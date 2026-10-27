CREATE TABLE IF NOT EXISTS order_deliverables (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 order_id uuid NOT NULL REFERENCES orders,
 seller_id uuid NOT NULL REFERENCES users,
 message text NOT NULL CHECK(length(trim(message)) BETWEEN 1 AND 10000),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS order_deliverables_order ON order_deliverables(order_id,created_at);
