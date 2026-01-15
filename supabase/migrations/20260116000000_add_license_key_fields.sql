-- Add license_key field to licenses table
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS license_key TEXT UNIQUE;

-- Add mt5_login field to validation_logs
ALTER TABLE validation_logs ADD COLUMN IF NOT EXISTS mt5_login BIGINT;
ALTER TABLE validation_logs ADD COLUMN IF NOT EXISTS server_name TEXT;
ALTER TABLE validation_logs ADD COLUMN IF NOT EXISTS validation_time TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE validation_logs ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE validation_logs ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- Rename result to status if exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='validation_logs' AND column_name='result') THEN
    ALTER TABLE validation_logs RENAME COLUMN result TO status_old;
  END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_licenses_license_key ON licenses(license_key);
CREATE INDEX IF NOT EXISTS idx_validation_logs_license_status ON validation_logs(license_id, status);
