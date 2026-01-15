/*
  # Fix missing broker_servers.is_active

  Some Supabase projects were created without the `is_active` column on `broker_servers`.
  The frontend and validations expect it.
*/

ALTER TABLE broker_servers
ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_broker_servers_is_active ON broker_servers(is_active);
