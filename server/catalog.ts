import type { Request, Response } from 'express';
import type { Pool } from 'pg';
import { z } from 'zod';
import { serviceRatingsJoin, sellerRatingsJoin } from './reviews.js';

const filters=z.object({q:z.string().max(100).optional(),category:z.string().optional(),seller:z.string().uuid().optional()});
const serviceColumns='s.id,s.title,s.description,s.price_idr,s.estimated_days,s.thumbnail_path,s.seller_id,u.display_name seller_name,u.avatar_path seller_avatar,c.slug category_slug,c.name category_name,ratings.rating,ratings.review_count,ratings.completed_order_count';

export function createServiceListHandler(db:Pick<Pool,'query'>){return async(req:Request,res:Response)=>{
 const q=filters.parse(req.query),result=await db.query(`SELECT ${serviceColumns} FROM services s JOIN users u ON u.id=s.seller_id JOIN categories c ON c.id=s.category_id ${serviceRatingsJoin} WHERE s.status='published' AND u.status='active' AND c.is_active AND ($1::text IS NULL OR s.title ILIKE '%'||$1||'%' OR s.description ILIKE '%'||$1||'%') AND ($2::text IS NULL OR c.slug=$2) AND ($3::uuid IS NULL OR s.seller_id=$3) ORDER BY s.created_at DESC`,[q.q||null,q.category||null,q.seller||null]);
 res.json({services:result.rows});
};}

export function createServiceDetailHandler(db:Pick<Pool,'query'>){return async(req:Request,res:Response)=>{
 const result=await db.query(`SELECT ${serviceColumns} FROM services s JOIN users u ON u.id=s.seller_id JOIN categories c ON c.id=s.category_id ${serviceRatingsJoin} WHERE s.id=$1 AND s.status='published' AND u.status='active' AND c.is_active`,[req.params.id]);
 if(!result.rowCount)return res.status(404).json({error:'NOT_FOUND'});
 res.json({service:result.rows[0]});
};}

export function createPublicSellerHandler(db:Pick<Pool,'query'>){return async(req:Request,res:Response)=>{
 const seller=await db.query(`SELECT u.id,u.display_name,u.avatar_path,u.portfolio_url,ratings.rating,ratings.review_count,ratings.completed_order_count FROM users u ${sellerRatingsJoin} WHERE u.id=$1 AND u.role='seller' AND u.status='active'`,[req.params.id]);
 if(!seller.rowCount)return res.status(404).json({error:'NOT_FOUND'});
 const services=await db.query(`SELECT ${serviceColumns} FROM services s JOIN users u ON u.id=s.seller_id JOIN categories c ON c.id=s.category_id ${serviceRatingsJoin} WHERE s.seller_id=$1 AND s.status='published' ORDER BY s.created_at DESC`,[req.params.id]);
 res.json({seller:seller.rows[0],services:services.rows});
};}
