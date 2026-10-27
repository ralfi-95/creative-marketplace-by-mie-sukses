import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import type { Pool } from 'pg';
import { createRoleApplicationHandler, createRoleApplicationReviewHandler } from './applications.js';

const reason = 'I want to contribute professional creative services to the marketplace.';

function testDb(role = 'buyer') {
  const users = new Map([['applicant', { role, status: 'active' }], ['admin-1', { role: 'admin', status: 'active' }], ['admin-2', { role: 'admin', status: 'active' }]]);
  const applications = new Map<string, any>();
  let next = 0, held = false, waiters: (() => void)[] = [];
  const calls: string[] = [];
  const acquire = async () => {
    if (held) await new Promise<void>(resolve => waiters.push(resolve));
    held = true;
  };
  const releaseLock = () => { held = false; waiters.shift()?.(); };
  const connect = async () => ({
    query: async (sql: string, values: any[] = []) => {
      calls.push(sql);
      if (sql.startsWith('SELECT id,role,status FROM users')) {
        await acquire();
        const account = users.get(values[0]);
        return { rows: account ? [{ id: values[0], ...account }] : [], rowCount: account ? 1 : 0 };
      }
      if (sql.startsWith('SELECT id FROM seller_applications WHERE user_id')) {
        const found = [...applications.values()].find(row => row.user_id === values[0] && row.status === 'pending');
        return { rows: found ? [{ id: found.id }] : [], rowCount: Number(Boolean(found)) };
      }
      if (sql.startsWith('SELECT 1 FROM media_uploads')) return { rows: [{ ok: 1 }], rowCount: 1 };
      if (sql.startsWith('INSERT INTO seller_applications')) {
        const id = `app-${++next}`, row = { id, user_id: values[0], reason: values[1], portfolio_url: values[2], application_type: values[3], status: 'pending' };
        applications.set(id, row); return { rows: [row], rowCount: 1 };
      }
      if (sql.startsWith('SELECT user_id FROM seller_applications')) {
        const row = applications.get(values[0]); return { rows: row ? [{ user_id: row.user_id }] : [], rowCount: Number(Boolean(row)) };
      }
      if (sql.startsWith('SELECT * FROM seller_applications')) {
        const row = applications.get(values[0]), found = row?.status === 'pending';
        return { rows: found ? [row] : [], rowCount: Number(found) };
      }
      if (sql.startsWith('UPDATE users SET role=')) {
        const user = users.get(values[1]);
        if (user?.role !== 'buyer' || user.status !== 'active') return { rows: [], rowCount: 0 };
        user.role = values[0]; return { rows: [{ id: values[1] }], rowCount: 1 };
      }
      if (sql.startsWith('UPDATE seller_applications SET status=$1')) {
        const row = applications.get(values[3]); row.status = values[0]; row.review_note = values[2]; return { rows: [], rowCount: 1 };
      }
      if (sql.startsWith("UPDATE seller_applications SET status='rejected'")) {
        let count = 0;
        for (const row of applications.values()) if (row.user_id === values[0] && row.id !== values[3] && row.status === 'pending') { row.status = 'rejected'; row.review_note = values[2]; count++; }
        return { rows: [], rowCount: count };
      }
      if (sql === 'COMMIT' || sql === 'ROLLBACK') releaseLock();
      return { rows: [], rowCount: 1 };
    }, release: () => undefined,
  });
  return { db: { connect } as unknown as Pick<Pool, 'connect'>, users, applications, calls };
}

function appFor(db: Pick<Pool, 'connect'>, actor: string) {
  const app = express(); app.use(express.json());
  app.post('/apps', (req, res, next) => { res.locals.user = { id: actor }; next(); }, (req, res, next) => { void createRoleApplicationHandler(db)(req, res).catch(next); });
  app.post('/apps/:id/review', (req, res, next) => { res.locals.user = { id: actor }; next(); }, (req, res, next) => { void createRoleApplicationReviewHandler(db)(req, res).catch(next); });
  app.use((error: any, _req: unknown, res: express.Response, _next: unknown) => res.status(error.status || 500).json({ error: error.message }));
  return app;
}

describe('role applications', () => {
  it('allows one pending application across role types and permits reapplication after rejection', async () => {
    const t = testDb(), app = appFor(t.db, 'applicant');
    const seller = { applicationType: 'seller', reason, portfolioUrl: 'https://example.test/work', supportingFilePath: '/media/00000000-0000-4000-8000-000000000001.pdf' };
    expect((await request(app).post('/apps').send(seller)).status).toBe(201);
    expect((await request(app).post('/apps').send({ applicationType: 'admin', reason })).status).toBe(409);
    t.applications.get('app-1').status = 'rejected';
    expect((await request(app).post('/apps').send({ applicationType: 'admin', reason })).status).toBe(201);
  });

  it('does not let an approved role apply for or change to another role', async () => {
    const t = testDb('seller'), response = await request(appFor(t.db, 'applicant')).post('/apps').send({ applicationType: 'admin', reason });
    expect(response.status).toBe(409);
    expect([...t.applications]).toHaveLength(0);
  });

  it('serializes simultaneous applications of different types', async () => {
    const t = testDb(), app = appFor(t.db, 'applicant');
    const [seller, admin] = await Promise.all([
      request(app).post('/apps').send({ applicationType: 'seller', reason, portfolioUrl: 'https://example.test/work', supportingFilePath: '/media/00000000-0000-4000-8000-000000000001.pdf' }),
      request(app).post('/apps').send({ applicationType: 'admin', reason }),
    ]);
    expect([seller.status, admin.status].sort()).toEqual([201, 409]);
    expect([...t.applications.values()].filter(row => row.status === 'pending')).toHaveLength(1);
  });

  it('serializes competing approvals and makes the other pending application non-actionable', async () => {
    const t = testDb();
    t.applications.set('seller-app', { id: 'seller-app', user_id: 'applicant', application_type: 'seller', status: 'pending' });
    t.applications.set('admin-app', { id: 'admin-app', user_id: 'applicant', application_type: 'admin', status: 'pending' });
    const [seller, admin] = await Promise.all([
      request(appFor(t.db, 'admin-1')).post('/apps/seller-app/review').send({ decision: 'approved' }),
      request(appFor(t.db, 'admin-2')).post('/apps/admin-app/review').send({ decision: 'approved' }),
    ]);
    expect([seller.status, admin.status].sort()).toEqual([200, 409]);
    expect(['seller', 'admin']).toContain(t.users.get('applicant')?.role);
    expect([...t.applications.values()].filter(row => row.status === 'pending')).toHaveLength(0);
    expect(t.calls.indexOf('SELECT id,role,status FROM users WHERE id=$1 FOR UPDATE')).toBeLessThan(t.calls.indexOf("SELECT * FROM seller_applications WHERE id=$1 AND status='pending' FOR UPDATE"));
  });
});
