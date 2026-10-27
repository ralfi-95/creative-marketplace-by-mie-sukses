CREATE TABLE IF NOT EXISTS wallet_payout_requests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 seller_id uuid NOT NULL REFERENCES users,
 idempotency_key uuid NOT NULL,
 amount bigint NOT NULL CHECK(amount>0),
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
 request_note text,
 decision_reason text,
 created_at timestamptz NOT NULL DEFAULT now(),
 reviewed_by uuid REFERENCES users,
 reviewed_at timestamptz,
 UNIQUE(seller_id,idempotency_key)
);

CREATE TABLE IF NOT EXISTS wallet_ledger (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 seller_id uuid NOT NULL REFERENCES users,
 order_id uuid REFERENCES orders,
 payout_request_id uuid REFERENCES wallet_payout_requests,
 entry_type text NOT NULL CHECK(entry_type IN ('order_earning','payout_reserved','payout_release')),
 amount bigint NOT NULL CHECK(amount<>0),
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK((entry_type='order_earning' AND order_id IS NOT NULL AND payout_request_id IS NULL AND amount>0) OR
       (entry_type='payout_reserved' AND order_id IS NULL AND payout_request_id IS NOT NULL AND amount<0) OR
       (entry_type='payout_release' AND order_id IS NULL AND payout_request_id IS NOT NULL AND amount>0)),
 UNIQUE(order_id,entry_type),
 UNIQUE(payout_request_id,entry_type)
);
CREATE INDEX IF NOT EXISTS wallet_ledger_seller ON wallet_ledger(seller_id,created_at DESC);
