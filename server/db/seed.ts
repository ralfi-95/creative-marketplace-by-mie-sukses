import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import { copyFile, mkdir, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { pool } from './pool.js';
try {
 const target = await pool.query('select current_database() db');
 if (target.rows[0].db !== 'mie_sukses_marketplace') throw new Error(`Refusing seed: connected to ${target.rows[0].db}.`);
 const files = ['demo-edit.svg','demo-photo.svg','demo-design.svg','demo-ui.svg'];
 await mkdir(path.resolve('storage'),{recursive:true});
 for (const file of files) { try { await copyFile(path.resolve('public',file),path.resolve('storage',file),constants.COPYFILE_EXCL); } catch(e) { if((e as NodeJS.ErrnoException).code!=='EEXIST') throw e; const [source,existing]=await Promise.all([readFile(path.resolve('public',file)),readFile(path.resolve('storage',file))]);if(!source.equals(existing))throw new Error(`Refusing to replace the existing storage file ${file}.`); } }
 const names = ['Studio Senja','Lensa Pagi','Ruang Grafis','Produk Digital'];
 const categories = await pool.query('SELECT id,slug FROM categories ORDER BY slug');
 if (categories.rowCount !== 4) throw new Error('Run npm run db:migrate first.');
 const bySlug = new Map(categories.rows.map((c: {id:string;slug:string}) => [c.slug,c.id] as const));
 const demos = [
  ['video-foto-editing','Edit Video Reels Cinematic','Editing video pendek untuk konten sosial media, dengan warna dan ritme yang rapi.',225000],
  ['fotografi','Fotografi Produk Natural','Foto produk dengan pencahayaan natural untuk katalog dan toko online.',350000],
  ['desain-grafis','Desain Identitas Visual','Paket desain visual untuk brand yang ingin tampil konsisten dan mudah dikenali.',450000],
  ['ui-ux-design','Desain UI Landing Page','Rancangan antarmuka landing page yang jelas, responsif, dan mudah digunakan.',600000]
 ] as const;
 for (let i=0;i<demos.length;i++) {
  const email=`demo-${i+1}@mie-sukses.local`;
  const hash=await bcrypt.hash(randomBytes(32).toString('hex'),12);
  const inserted=await pool.query("INSERT INTO users(email,password_hash,display_name,role) VALUES($1,$2,$3,'seller') ON CONFLICT(email) DO NOTHING RETURNING id",[email,hash,names[i]]);
  const user=inserted.rowCount?inserted:await pool.query('SELECT id FROM users WHERE email=$1',[email]);
  const category=bySlug.get(demos[i][0]); if(!category) throw new Error(`Missing category ${demos[i][0]}`);
  const media=`/media/${files[i]}`;
  await pool.query("INSERT INTO media_uploads(path,owner_id,kind) VALUES($1,$2,'service') ON CONFLICT(path) DO NOTHING",[media,user.rows[0].id]);
  const existing=await pool.query('SELECT 1 FROM services WHERE seller_id=$1 AND title=$2',[user.rows[0].id,demos[i][1]]);
  if(!existing.rowCount) await pool.query("INSERT INTO services(seller_id,category_id,title,description,price_idr,thumbnail_path,status) VALUES($1,$2,$3,$4,$5,$6,'published')",[user.rows[0].id,category,demos[i][1],demos[i][2],demos[i][3],media]);
 }
 console.log('Demo categories and four clearly labeled demo listings are ready.');
} finally { await pool.end(); }
