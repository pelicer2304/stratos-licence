/*
  # Fix audit_logs schema

  Some Supabase projects have an older/incomplete audit_logs table.
  The frontend expects: id, action, entity, entity_id, meta, user_id, created_at.

  This migration adds missing columns and indexes safely.
*/

-- Ensure required columns exist
ALTER TABLE audit_logs
ADD COLUMN IF NOT EXISTS id uuid;

ALTER TABLE audit_logs
ADD COLUMN IF NOT EXISTS action text;

ALTER TABLE audit_logs
ADD COLUMN IF NOT EXISTS entity text;

ALTER TABLE audit_logs
ADD COLUMN IF NOT EXISTS entity_id uuid;

ALTER TABLE audit_logs
ADD COLUMN IF NOT EXISTS meta jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE audit_logs
ADD COLUMN IF NOT EXISTS user_id uuid;

ALTER TABLE audit_logs
ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

-- Defaults / backfills
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'audit_logs' AND column_name = 'id'
  ) THEN
    -- gen_random_uuid() is available on Supabase (pgcrypto)
    BEGIN
      ALTER TABLE audit_logs ALTER COLUMN id SET DEFAULT gen_random_uuid();
    EXCEPTION WHEN others THEN
      -- ignore
    END;

    UPDATE audit_logs SET id = gen_random_uuid() WHERE id IS NULL;
  END IF;

  -- action/entity are required by the app; if they're null in old rows, fill with placeholders.
  UPDATE audit_logs SET action = COALESCE(action, 'unknown') WHERE action IS NULL;
  UPDATE audit_logs SET entity = COALESCE(entity, 'unknown') WHERE entity IS NULL;
END $$;

-- Primary key if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'audit_logs'::regclass
      AND contype = 'p'
  ) THEN
    ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);
  END IF;
END $$;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
