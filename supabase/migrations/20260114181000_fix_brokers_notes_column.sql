/*
  # Fix missing brokers.notes

  Some Supabase projects were created without the `notes` column on `brokers`.
  The frontend uses this column and PostgREST returns PGRST204 when it doesn't exist.
*/

ALTER TABLE brokers
ADD COLUMN IF NOT EXISTS notes text NOT NULL DEFAULT '';
