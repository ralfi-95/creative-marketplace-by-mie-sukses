CREATE TABLE IF NOT EXISTS checkout_payments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 checkout_batch_id uuid NOT NULL UNIQUE REFERENCES checkout_batches,
 buyer_id uuid NOT NULL REFERENCES users,
 amount bigint NOT NULL CHECK(amount>0),
 method text NOT NULL CHECK(method IN ('bank_transfer','e_wallet','qris','legacy_untracked')),
 status text NOT NULL CHECK(status IN ('awaiting_payment','simulated','legacy_untracked','refunded')),
 created_at timestamptz NOT NULL DEFAULT now(),
 confirmed_at timestamptz
);

INSERT INTO checkout_payments(checkout_batch_id,buyer_id,amount,method,status)
SELECT b.id,b.buyer_id,sum(o.price_snapshot),'legacy_untracked','legacy_untracked'
FROM checkout_batches b JOIN orders o ON o.checkout_batch_id=b.id
GROUP BY b.id,b.buyer_id
ON CONFLICT(checkout_batch_id) DO NOTHING;
