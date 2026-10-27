-- Add canonical paid and resolved states without rewriting historical orders.
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_final_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_final_check
 CHECK (status IN ('pending','paid','accepted','in_progress','work_submitted','under_dispute','completed','resolved','rejected','cancelled','refunded'));

WITH changed AS (
 UPDATE orders o SET status='paid',updated_at=now()
 FROM checkout_payments p
 WHERE p.checkout_batch_id=o.checkout_batch_id AND p.status='simulated' AND o.status='pending'
 RETURNING o.id,o.buyer_id
)
INSERT INTO order_events(order_id,actor_id,from_status,to_status,reason)
SELECT id,buyer_id,'pending','paid','Payment was already confirmed before canonical paid state was introduced.'
FROM changed;

ALTER TABLE order_issues ADD COLUMN IF NOT EXISTS pre_dispute_status text;
UPDATE order_issues i SET pre_dispute_status=coalesce(
 (SELECT e.from_status FROM order_events e WHERE e.order_id=i.order_id AND e.to_status='under_dispute' ORDER BY e.created_at DESC LIMIT 1),
 CASE WHEN i.issue_type='seller_rejection' THEN 'paid' ELSE 'work_submitted' END)
 WHERE i.status='open' AND i.pre_dispute_status IS NULL;
ALTER TABLE order_issues DROP CONSTRAINT IF EXISTS order_issues_resolution_check;
ALTER TABLE order_issues ADD CONSTRAINT order_issues_resolution_check
 CHECK (resolution IS NULL OR resolution IN ('approve_payment','approve_refund','approve_seller','approve_buyer','rejected'));

DROP INDEX IF EXISTS one_open_issue_per_order;
CREATE UNIQUE INDEX IF NOT EXISTS one_open_issue_per_order_claimant
 ON order_issues(order_id,claimant_id,issue_type) WHERE status='open';
