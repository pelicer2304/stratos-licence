/*
  # Fix missing brokers.is_active

  Some Supabase projects were created before the `is_active` column existed on `brokers`.
  The frontend expects this column, and the admin view `v_licenses_with_brokers` also references it.

  This migration adds the column safely.
*/

ALTER TABLE brokers
ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_brokers_is_active ON brokers(is_active);
