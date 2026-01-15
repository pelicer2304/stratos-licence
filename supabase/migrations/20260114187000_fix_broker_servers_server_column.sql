/*
  # Fix missing broker_servers.server

  Some Supabase projects were created with an incomplete broker_servers table.
  The frontend expects a `server` text column.

  This migration:
  - Adds `server` if missing
  - Attempts to backfill from common legacy column names
  - Ensures NOT NULL with a safe fallback
*/

ALTER TABLE broker_servers
ADD COLUMN IF NOT EXISTS server text;

DO $$
BEGIN
  -- Backfill from legacy columns if they exist
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='broker_servers' AND column_name='server_name') THEN
    UPDATE broker_servers SET server = COALESCE(server, server_name) WHERE server IS NULL OR server = '';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='broker_servers' AND column_name='name') THEN
    UPDATE broker_servers SET server = COALESCE(server, name) WHERE server IS NULL OR server = '';
  END IF;

  -- Final fallback
  UPDATE broker_servers SET server = 'UNKNOWN' WHERE server IS NULL OR server = '';

  BEGIN
    ALTER TABLE broker_servers ALTER COLUMN server SET NOT NULL;
  EXCEPTION WHEN others THEN
    -- ignore
  END;
END $$;
