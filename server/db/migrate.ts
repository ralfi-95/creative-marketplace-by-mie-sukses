import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pool } from './pool.js';
try {
 const target = await pool.query('select current_database() as db, current_user as role');
 if (target.rows[0].db !== 'mie_sukses_marketplace'||target.rows[0].role!=='marketplace_app') throw new Error(`Refusing migration: expected local mie_sukses_marketplace as marketplace_app; connected as ${target.rows[0].role} to ${target.rows[0].db}.`);
 console.log(`Verified local target: ${target.rows[0].db} as ${target.rows[0].role}`);
 const client = await pool.connect();
 try {
  await client.query('BEGIN');
  await client.query('SELECT pg_advisory_xact_lock(742001)');
  await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
  const files = (await (await import('node:fs/promises')).readdir(path.resolve('migrations'))).filter(x => x.endsWith('.sql')).sort();
  for (const name of files) {
   const found = await client.query('SELECT 1 FROM schema_migrations WHERE name=$1', [name]);
   if (found.rowCount) continue;
   await client.query(await readFile(path.resolve('migrations', name), 'utf8'));
   await client.query('INSERT INTO schema_migrations(name) VALUES($1)', [name]);
   console.log(`Applied ${name}`);
  }
  await client.query('COMMIT');
 } catch (error) { await client.query('ROLLBACK'); throw error; }
 finally { client.release(); }
} finally { await pool.end(); }
