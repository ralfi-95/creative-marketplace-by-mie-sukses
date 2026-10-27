-- Additive completion of the local marketplace workflows. Existing records remain intact.
ALTER TABLE users ADD COLUMN IF NOT EXISTS contact_phone text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS portfolio_url text;
ALTER TABLE services ADD COLUMN IF NOT EXISTS estimated_days integer CHECK (estimated_days > 0);

ALTER TABLE seller_applications ADD COLUMN IF NOT EXISTS application_type text NOT NULL DEFAULT 'seller';
ALTER TABLE seller_applications ADD COLUMN IF NOT EXISTS supporting_file_path text REFERENCES media_uploads(path);
ALTER TABLE seller_applications ALTER COLUMN portfolio_url DROP NOT NULL;
DROP INDEX IF EXISTS one_pending_seller_application;
CREATE UNIQUE INDEX IF NOT EXISTS one_pending_application_per_type
 ON seller_applications(user_id,application_type) WHERE status='pending';
ALTER TABLE seller_applications ADD CONSTRAINT seller_applications_type_check CHECK (application_type IN ('seller','admin'));
ALTER TABLE seller_applications ADD CONSTRAINT seller_application_portfolio_check
 CHECK ((application_type='seller' AND portfolio_url IS NOT NULL) OR application_type='admin');

ALTER TABLE media_uploads ADD COLUMN IF NOT EXISTS order_id uuid REFERENCES orders;
ALTER TABLE media_uploads DROP CONSTRAINT IF EXISTS media_uploads_kind_check;
ALTER TABLE media_uploads ADD CONSTRAINT media_uploads_kind_final_check
 CHECK (kind IN ('avatar','service','deliverable','application'));
ALTER TABLE order_deliverables ADD COLUMN IF NOT EXISTS delivery_url text;
ALTER TABLE order_deliverables ALTER COLUMN message DROP NOT NULL;
ALTER TABLE order_deliverables ADD CONSTRAINT order_deliverables_content_check
 CHECK (delivery_url IS NOT NULL OR media_path IS NOT NULL OR length(trim(coalesce(message,'')))>0);

ALTER TABLE checkout_payments DROP CONSTRAINT IF EXISTS checkout_payments_method_check;
ALTER TABLE checkout_payments ADD CONSTRAINT checkout_payments_method_final_check
 CHECK (method IN ('bank_transfer','e_wallet','qris','me_wallet','legacy_untracked'));
ALTER TABLE checkout_payments ADD COLUMN IF NOT EXISTS provider text;
ALTER TABLE checkout_payments ADD COLUMN IF NOT EXISTS idempotency_key uuid;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_final_check
 CHECK (status IN ('pending','accepted','in_progress','work_submitted','under_dispute','completed','rejected','cancelled','refunded'));

CREATE TABLE IF NOT EXISTS wallet_transactions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users,
 entry_type text NOT NULL CHECK (entry_type IN ('top_up','order_payment','order_earning','refund','withdrawal')),
 amount bigint NOT NULL CHECK (amount<>0), method text, provider text,
 order_id uuid REFERENCES orders, checkout_batch_id uuid REFERENCES checkout_batches,
 idempotency_key uuid, status text NOT NULL DEFAULT 'completed' CHECK (status IN ('completed','reversed')),
 recipient_name text, recipient_reference text,
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK ((entry_type IN ('top_up','order_earning','refund') AND amount>0) OR
        (entry_type IN ('order_payment','withdrawal') AND amount<0)),
 UNIQUE(user_id,idempotency_key)
);
CREATE UNIQUE INDEX IF NOT EXISTS wallet_transactions_order_type
 ON wallet_transactions(user_id,order_id,entry_type) WHERE order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS wallet_transactions_user_date ON wallet_transactions(user_id,created_at DESC);

CREATE TABLE IF NOT EXISTS order_issues (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_id uuid NOT NULL REFERENCES orders,
 issue_type text NOT NULL CHECK (issue_type IN ('refund_request','payment_claim','seller_rejection','customer_cancellation')),
 claimant_id uuid NOT NULL REFERENCES users, reason text NOT NULL CHECK (length(trim(reason)) BETWEEN 5 AND 2000),
 status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved')),
 resolution text CHECK (resolution IN ('approve_payment','approve_refund')),
 resolved_by uuid REFERENCES users, resolved_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS one_open_issue_per_order ON order_issues(order_id) WHERE status='open';
CREATE INDEX IF NOT EXISTS order_issues_status_date ON order_issues(status,created_at DESC);
CREATE TABLE IF NOT EXISTS order_settlements (
 order_id uuid PRIMARY KEY REFERENCES orders, outcome text NOT NULL CHECK (outcome IN ('payment','refund')),
 checkout_payment_id uuid NOT NULL REFERENCES checkout_payments, amount bigint NOT NULL CHECK (amount>0),
 method text NOT NULL, provider text, recorded_by uuid NOT NULL REFERENCES users,
 created_at timestamptz NOT NULL DEFAULT now()
);
