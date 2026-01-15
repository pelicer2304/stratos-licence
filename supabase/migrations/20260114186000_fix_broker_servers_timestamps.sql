/*
  # Fix missing broker_servers timestamps

  If the project was created before the full schema, it may be missing created_at/updated_at.
*/

ALTER TABLE broker_servers
ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE broker_servers
ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
