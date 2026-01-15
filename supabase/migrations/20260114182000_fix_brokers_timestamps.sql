/*
  # Fix missing brokers timestamps

  If the project was created before the full brokers schema, it may be missing created_at/updated_at.
  These are used by ordering and UI.
*/

ALTER TABLE brokers
ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE brokers
ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- If updated_at exists but doesn't auto-update, you may also want the trigger from the brokers schema migration.
