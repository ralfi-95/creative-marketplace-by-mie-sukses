ALTER TABLE media_uploads ADD COLUMN IF NOT EXISTS order_id uuid REFERENCES orders;
ALTER TABLE media_uploads DROP CONSTRAINT IF EXISTS media_uploads_kind_check;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='media_uploads_kind_check') THEN
  ALTER TABLE media_uploads ADD CONSTRAINT media_uploads_kind_check CHECK(kind IN ('avatar','service','deliverable'));
 END IF;
END $$;
ALTER TABLE order_deliverables ADD COLUMN IF NOT EXISTS media_path text REFERENCES media_uploads(path);
