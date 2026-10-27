import type { Request, Response } from 'express';
import type { Pool } from 'pg';
import { z } from 'zod';

const bodySchema=z.object({rating:z.number().int().min(1).max(5)});

export function createOrderReviewHandler(db:Pick<Pool,'connect'>){return async(req:Request,res:Response)=>{
 const {rating}=bodySchema.parse(req.body),user=res.locals.user as {id:string},client=await db.connect();
 try{
  await client.query('BEGIN');
  const result=await client.query('SELECT id,buyer_id,seller_id,status FROM orders WHERE id=$1 FOR UPDATE',[req.params.id]);
  if(!result.rowCount)throw Object.assign(new Error('Order not found.'),{status:404});
  const order=result.rows[0];
  if(order.buyer_id!==user.id)throw Object.assign(new Error('Only this order’s buyer may review it.'),{status:403});
  if(order.seller_id===user.id)throw Object.assign(new Error('You cannot review your own service.'),{status:403});
  if(order.status!=='completed')throw Object.assign(new Error('Only completed orders may be reviewed.'),{status:409});
  const review=await client.query('INSERT INTO order_reviews(order_id,rating) VALUES($1,$2) ON CONFLICT(order_id) DO UPDATE SET rating=EXCLUDED.rating,updated_at=now() RETURNING order_id,rating,created_at,updated_at',[order.id,rating]);
  await client.query('COMMIT');
  res.json({review:review.rows[0]});
 }catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}
};}

export const serviceRatingsJoin=`LEFT JOIN LATERAL (
 SELECT round(avg(r.rating)::numeric,2) rating,count(r.order_id)::int review_count,count(o.id)::int completed_order_count
 FROM orders o LEFT JOIN order_reviews r ON r.order_id=o.id
 WHERE o.service_id=s.id AND o.status='completed'
) ratings ON true`;

export const sellerRatingsJoin=`LEFT JOIN LATERAL (
 SELECT round(avg(r.rating)::numeric,2) rating,count(r.order_id)::int review_count,count(o.id)::int completed_order_count
 FROM services owned JOIN orders o ON o.service_id=owned.id LEFT JOIN order_reviews r ON r.order_id=o.id
 WHERE owned.seller_id=u.id AND o.status='completed'
) ratings ON true`;
