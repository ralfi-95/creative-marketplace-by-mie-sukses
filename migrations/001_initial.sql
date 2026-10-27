CREATE TABLE IF NOT EXISTS users (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text NOT NULL UNIQUE,
 password_hash text NOT NULL, display_name text NOT NULL CHECK(length(trim(display_name)) BETWEEN 2 AND 80),
 avatar_path text, role text NOT NULL DEFAULT 'buyer' CHECK(role IN ('buyer','seller','admin')),
 status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','suspended','deactivated')),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS categories (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), slug text NOT NULL UNIQUE, name text NOT NULL,
 is_active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO categories(slug,name) VALUES
 ('video-foto-editing','Video & Foto Editing'),('fotografi','Fotografi'),
 ('desain-grafis','Desain Grafis'),('ui-ux-design','UI/UX Design')
ON CONFLICT(slug) DO NOTHING;
CREATE TABLE IF NOT EXISTS seller_applications (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users,
 reason text NOT NULL CHECK(length(trim(reason)) BETWEEN 30 AND 2000), portfolio_url text NOT NULL,
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
 submitted_at timestamptz NOT NULL DEFAULT now(), reviewed_by uuid REFERENCES users,
 reviewed_at timestamptz, review_note text
);
CREATE UNIQUE INDEX IF NOT EXISTS one_pending_seller_application ON seller_applications(user_id) WHERE status='pending';
CREATE TABLE IF NOT EXISTS services (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), seller_id uuid NOT NULL REFERENCES users,
 category_id uuid NOT NULL REFERENCES categories, title text NOT NULL CHECK(length(trim(title)) BETWEEN 5 AND 100),
 description text NOT NULL CHECK(length(trim(description)) BETWEEN 1 AND 10000), price_idr bigint NOT NULL CHECK(price_idr>0),
 thumbnail_path text, status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','archived','suspended')),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK(status<>'published' OR (thumbnail_path IS NOT NULL AND length(trim(thumbnail_path))>0))
);
CREATE INDEX IF NOT EXISTS services_catalog ON services(category_id,created_at DESC) WHERE status='published';
CREATE TABLE IF NOT EXISTS media_uploads (
 path text PRIMARY KEY, owner_id uuid NOT NULL REFERENCES users,
 kind text NOT NULL CHECK(kind IN ('avatar','service')), service_id uuid REFERENCES services,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE OR REPLACE FUNCTION validate_published_service() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.thumbnail_path IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM media_uploads WHERE path=NEW.thumbnail_path AND owner_id=NEW.seller_id AND kind='service'
 ) THEN RAISE EXCEPTION 'Thumbnail must be uploaded by this seller' USING ERRCODE='23514'; END IF;
 IF NEW.status='published' AND (
  NOT EXISTS(SELECT 1 FROM users WHERE id=NEW.seller_id AND role='seller' AND status='active') OR
  NOT EXISTS(SELECT 1 FROM categories WHERE id=NEW.category_id AND is_active)
 ) THEN RAISE EXCEPTION 'Published service requires an active seller and category' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS services_publication_guard ON services;
CREATE TRIGGER services_publication_guard BEFORE INSERT OR UPDATE ON services
 FOR EACH ROW EXECUTE FUNCTION validate_published_service();
CREATE TABLE IF NOT EXISTS carts (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), buyer_id uuid NOT NULL UNIQUE REFERENCES users, created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS cart_items (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), cart_id uuid NOT NULL REFERENCES carts ON DELETE CASCADE, service_id uuid NOT NULL REFERENCES services, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(cart_id,service_id));
CREATE TABLE IF NOT EXISTS checkout_batches (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), buyer_id uuid NOT NULL REFERENCES users, idempotency_key uuid NOT NULL,
 request_fingerprint text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(buyer_id,idempotency_key)
);
CREATE TABLE IF NOT EXISTS orders (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), checkout_batch_id uuid NOT NULL REFERENCES checkout_batches,
 buyer_id uuid NOT NULL REFERENCES users, seller_id uuid NOT NULL REFERENCES users, service_id uuid NOT NULL REFERENCES services,
 title_snapshot text NOT NULL, seller_name_snapshot text NOT NULL, price_snapshot bigint NOT NULL CHECK(price_snapshot>0), quantity integer NOT NULL DEFAULT 1 CHECK(quantity=1),
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','accepted','in_progress','completed','rejected','cancelled')),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS orders_buyer ON orders(buyer_id,created_at DESC);
CREATE INDEX IF NOT EXISTS orders_seller ON orders(seller_id,created_at DESC);
CREATE TABLE IF NOT EXISTS order_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_id uuid NOT NULL REFERENCES orders,
 actor_id uuid NOT NULL REFERENCES users, from_status text, to_status text NOT NULL, reason text,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS audit_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), actor_id uuid NOT NULL REFERENCES users,
 action text NOT NULL, target_type text NOT NULL, target_id uuid NOT NULL, details jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS user_sessions (
 sid varchar NOT NULL PRIMARY KEY, sess json NOT NULL, expire timestamp(6) NOT NULL
);
CREATE INDEX IF NOT EXISTS user_sessions_expire ON user_sessions(expire);
