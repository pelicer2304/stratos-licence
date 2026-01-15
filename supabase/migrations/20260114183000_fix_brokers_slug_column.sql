/*
  # Fix missing brokers.slug

  Some Supabase projects were created without the `slug` column on `brokers`.
  The frontend expects it and PostgREST returns PGRST204 when it doesn't exist.

  This migration:
  - Adds the column if missing
  - Backfills existing rows safely (unique-ish slug)
  - Adds a unique index
*/

ALTER TABLE brokers
ADD COLUMN IF NOT EXISTS slug text;

-- Backfill only rows without slug.
-- Uses a sanitized name + short id suffix to keep uniqueness.
UPDATE brokers
SET slug =
  CASE
    WHEN COALESCE(NULLIF(regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g'), ''), '') <> ''
      THEN regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g') || '-' || substr(id::text, 1, 8)
    ELSE 'broker-' || substr(id::text, 1, 8)
  END
WHERE slug IS NULL OR slug = '';

CREATE UNIQUE INDEX IF NOT EXISTS brokers_slug_key ON brokers(slug);
