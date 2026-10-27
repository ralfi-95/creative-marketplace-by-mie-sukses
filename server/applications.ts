import type { Request, Response } from 'express';
import type { Pool } from 'pg';
import { z } from 'zod';

const applicationBody = z.object({
  applicationType: z.enum(['seller', 'admin']),
  reason: z.string().trim().min(30).max(2000),
  portfolioUrl: z.string().url().refine(value => ['http:', 'https:'].includes(new URL(value).protocol)).optional(),
  supportingFilePath: z.string().regex(/^\/media\/[0-9a-f-]{36}\.(png|jpg|webp|pdf|doc|docx)$/i).optional(),
}).superRefine((body, ctx) => {
  if (body.applicationType === 'seller' && !body.portfolioUrl) ctx.addIssue({ code: 'custom', path: ['portfolioUrl'], message: 'A portfolio URL is required.' });
  if (body.applicationType === 'seller' && !body.supportingFilePath) ctx.addIssue({ code: 'custom', path: ['supportingFilePath'], message: 'A supporting document is required.' });
});
const reviewBody = z.object({ decision: z.enum(['approved', 'rejected']), note: z.string().trim().max(500).optional() });

export function createRoleApplicationHandler(db: Pick<Pool, 'connect'>) {
  return async (req: Request, res: Response) => {
    const body = applicationBody.parse(req.body), applicant = (res.locals.user as { id: string }).id, client = await db.connect();
    try {
      await client.query('BEGIN');
      const account = await client.query('SELECT id,role,status FROM users WHERE id=$1 FOR UPDATE', [applicant]);
      if (!account.rowCount || account.rows[0].status !== 'active') throw Object.assign(new Error('An active account is required.'), { status: 403 });
      if (account.rows[0].role !== 'buyer') throw Object.assign(new Error('An approved role cannot be changed through another application.'), { status: 409 });
      const pending = await client.query("SELECT id FROM seller_applications WHERE user_id=$1 AND status='pending' LIMIT 1", [applicant]);
      if (pending.rowCount) throw Object.assign(new Error('You already have a pending role application.'), { status: 409 });
      if (body.supportingFilePath) {
        const file = await client.query("SELECT 1 FROM media_uploads WHERE path=$1 AND owner_id=$2 AND kind='application'", [body.supportingFilePath, applicant]);
        if (!file.rowCount) throw Object.assign(new Error('Invalid supporting document.'), { status: 400, code: 'INVALID_SUPPORTING_FILE' });
      }
      const result = await client.query('INSERT INTO seller_applications(user_id,reason,portfolio_url,application_type,supporting_file_path) VALUES($1,$2,$3,$4,$5) RETURNING id,status,submitted_at,application_type', [applicant, body.reason, body.portfolioUrl || null, body.applicationType, body.supportingFilePath || null]);
      await client.query('COMMIT');
      res.status(201).json({ application: result.rows[0] });
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  };
}

export function createMyRoleApplicationsHandler(db: Pick<Pool, 'query'>) {
  return async (_req: Request, res: Response) => {
    const result = await db.query("SELECT a.id,a.application_type,a.status,a.submitted_at,a.reviewed_at,a.review_note,CASE WHEN reviewer.role='admin' THEN reviewer.display_name END reviewer_name,CASE WHEN reviewer.role='admin' THEN reviewer.avatar_path END reviewer_avatar FROM seller_applications a LEFT JOIN users reviewer ON reviewer.id=a.reviewed_by WHERE a.user_id=$1 ORDER BY a.submitted_at DESC", [(res.locals.user as { id: string }).id]);
    res.json({ applications: result.rows });
  };
}

export function createAdminRoleApplicationsHandler(db: Pick<Pool, 'query'>) {
  return async (_req: Request, res: Response) => {
    const result = await db.query("SELECT a.*,u.email,u.display_name,u.avatar_path applicant_avatar FROM seller_applications a JOIN users u ON u.id=a.user_id ORDER BY a.submitted_at DESC", []);
    res.json({ applications: result.rows });
  };
}

export function createRoleApplicationReviewHandler(db: Pick<Pool, 'connect'>) {
  return async (req: Request, res: Response) => {
    const body = reviewBody.parse(req.body), admin = (res.locals.user as { id: string }).id, client = await db.connect();
    try {
      await client.query('BEGIN');
      const reference = await client.query('SELECT user_id FROM seller_applications WHERE id=$1', [req.params.id]);
      if (!reference.rowCount) throw Object.assign(new Error('Application not found.'), { status: 404 });
      const applicantId = reference.rows[0].user_id;
      const account = await client.query('SELECT id,role,status FROM users WHERE id=$1 FOR UPDATE', [applicantId]);
      if (!account.rowCount) throw Object.assign(new Error('Applicant is unavailable.'), { status: 404 });
      const result = await client.query("SELECT * FROM seller_applications WHERE id=$1 AND status='pending' FOR UPDATE", [req.params.id]);
      if (!result.rowCount) throw Object.assign(new Error('Application is no longer pending.'), { status: 409 });
      const application = result.rows[0];
      if (applicantId === admin) throw Object.assign(new Error('You cannot review your own application.'), { status: 403 });
      if (body.decision === 'approved') {
        if (account.rows[0].status !== 'active' || account.rows[0].role !== 'buyer') throw Object.assign(new Error('Applicant already has an approved role or is inactive.'), { status: 409 });
        const promoted = await client.query("UPDATE users SET role=$1 WHERE id=$2 AND status='active' AND role='buyer' RETURNING id", [application.application_type, applicantId]);
        if (!promoted.rowCount) throw Object.assign(new Error('Applicant is no longer eligible.'), { status: 409 });
      }
      await client.query('UPDATE seller_applications SET status=$1,reviewed_by=$2,reviewed_at=now(),review_note=$3 WHERE id=$4 AND status=\'pending\'', [body.decision, admin, body.note || null, application.id]);
      if (body.decision === 'approved') {
        const closed = await client.query("UPDATE seller_applications SET status='rejected',reviewed_by=$2,reviewed_at=now(),review_note=$3 WHERE user_id=$1 AND id<>$4 AND status='pending' RETURNING id,application_type", [applicantId, admin, `Closed because the ${application.application_type === 'seller' ? 'Freelancer' : 'Admin'} role application was approved.`, application.id]);
        for (const item of closed.rows) await client.query("INSERT INTO audit_events(actor_id,action,target_type,target_id,details) VALUES($1,'role_application_closed','seller_application',$2,$3)", [admin, item.id, JSON.stringify({ approvedApplicationId: application.id, applicationType: item.application_type })]);
      }
      await client.query('INSERT INTO audit_events(actor_id,action,target_type,target_id,details) VALUES($1,$2,$3,$4,$5)', [admin, `${application.application_type}_application_${body.decision}`, 'seller_application', application.id, JSON.stringify({ note: body.note || null })]);
      await client.query('COMMIT');
      res.json({ ok: true, applicationType: application.application_type, status: body.decision });
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  };
}
