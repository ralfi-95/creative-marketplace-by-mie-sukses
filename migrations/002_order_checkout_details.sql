ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_email_snapshot text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_phone_snapshot text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS project_brief text;

DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='orders_project_brief_length') THEN
  ALTER TABLE orders ADD CONSTRAINT orders_project_brief_length
   CHECK(project_brief IS NULL OR length(trim(project_brief)) BETWEEN 1 AND 10000) NOT VALID;
 END IF;
END $$;
