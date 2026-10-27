import type { Request, Response } from 'express';
import type { Pool } from 'pg';
import { z } from 'zod';

const bodySchema=z.object({message:z.string().trim().max(10000).optional(),deliveryUrl:z.string().url().refine(x=>['http:','https:'].includes(new URL(x).protocol)).optional(),mediaPath:z.string().regex(/^\/media\/[0-9a-f-]{36}\.(png|jpg|webp|pdf|doc|docx)$/i).optional()}).refine(b=>Boolean(b.deliveryUrl||b.mediaPath),{message:'Provide a delivery URL or report file.'});

export function createDeliverableHandler(db:Pick<Pool,'connect'>){
 return async(req:Request,res:Response)=>{
  const body=bodySchema.parse(req.body),user=res.locals.user as {id:string};
  const client=await db.connect();
  try{
   await client.query('BEGIN');
   const order=await client.query("SELECT id,seller_id,status FROM orders WHERE id=$1 FOR UPDATE",[req.params.id]);
   if(!order.rowCount)throw Object.assign(new Error('Order not found.'),{status:404});
   if(order.rows[0].seller_id!==user.id)throw Object.assign(new Error('Only the assigned seller can submit work.'),{status:403});
   if(order.rows[0].status!=='in_progress')throw Object.assign(new Error('Work can only be submitted while the order is Processed.'),{status:409});
   if(body.mediaPath){const media=await client.query("SELECT 1 FROM media_uploads WHERE path=$1 AND owner_id=$2 AND kind='deliverable' AND order_id=$3 FOR UPDATE",[body.mediaPath,user.id,order.rows[0].id]);if(!media.rowCount)throw Object.assign(new Error('Uploaded file is not available for this order.'),{status:400});}
   const result=await client.query('INSERT INTO order_deliverables(order_id,seller_id,message,media_path,delivery_url) VALUES($1,$2,$3,$4,$5) RETURNING *',[order.rows[0].id,user.id,body.message||null,body.mediaPath||null,body.deliveryUrl||null]);
   await client.query("UPDATE orders SET status='work_submitted',updated_at=now() WHERE id=$1",[order.rows[0].id]);
   await client.query("INSERT INTO order_events(order_id,actor_id,from_status,to_status) VALUES($1,$2,'in_progress','work_submitted')",[order.rows[0].id,user.id]);
   await client.query("INSERT INTO audit_events(actor_id,action,target_type,target_id,details) VALUES($1,'order_deliverable_submitted','order',$2,'{}')",[user.id,order.rows[0].id]);
   await client.query('COMMIT');
   res.status(201).json({deliverable:result.rows[0]});
  }catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}
 };
}
