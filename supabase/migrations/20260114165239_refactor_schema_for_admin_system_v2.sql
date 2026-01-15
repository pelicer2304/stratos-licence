/*
  # Refactor Schema for Admin System

  ## Changes

  1. Create admin_users table
  2. Update licenses table structure
  3. Create license_brokers table
  4. Create audit_logs table
  5. Update RLS policies to admin-only
  6. Create database views
*/

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on admin_users
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Policy: only admins can view admin_users
CREATE POLICY "Admins can view admin users"
  ON admin_users FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop old RLS policies for licenses (these depend on user_id column)
DROP POLICY IF EXISTS "Users can view own licenses" ON licenses;
DROP POLICY IF EXISTS "Users can create own licenses" ON licenses;
DROP POLICY IF EXISTS "Users can update own licenses" ON licenses;
DROP POLICY IF EXISTS "Users can delete own licenses" ON licenses;

-- Drop old policies for validation_logs (these also depend on licenses.user_id)
DROP POLICY IF EXISTS "Users can view logs for own licenses" ON validation_logs;
DROP POLICY IF EXISTS "Users can create logs for own licenses" ON validation_logs;

-- Now we can safely alter licenses table
DO $$
BEGIN
  -- Drop old columns if they exist
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'licenses' AND column_name = 'allowed_servers'
  ) THEN
    ALTER TABLE licenses DROP COLUMN allowed_servers;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'licenses' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE licenses DROP COLUMN user_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'licenses' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE licenses DROP COLUMN is_active;
  END IF;

  -- Change mt5_login to bigint
  ALTER TABLE licenses ALTER COLUMN mt5_login TYPE bigint USING mt5_login::bigint;

  -- Add notes column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'licenses' AND column_name = 'notes'
  ) THEN
    ALTER TABLE licenses ADD COLUMN notes text DEFAULT '';
  END IF;

  -- Add unique constraint on mt5_login if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'licenses_mt5_login_key'
  ) THEN
    ALTER TABLE licenses ADD CONSTRAINT licenses_mt5_login_key UNIQUE (mt5_login);
  END IF;

  -- Change expires_at to date type
  ALTER TABLE licenses ALTER COLUMN expires_at TYPE date USING expires_at::date;
END $$;

-- Create license_brokers table
CREATE TABLE IF NOT EXISTS license_brokers (
  license_id uuid NOT NULL REFERENCES licenses(id) ON DELETE CASCADE,
  broker_id uuid NOT NULL REFERENCES brokers(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (license_id, broker_id)
);

-- Enable RLS on license_brokers
ALTER TABLE license_brokers ENABLE ROW LEVEL SECURITY;

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  entity text NOT NULL,
  entity_id uuid,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create index on audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);

-- Enable RLS on audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create new admin-only policies for licenses
CREATE POLICY "Admins can view all licenses"
  ON licenses FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can create licenses"
  ON licenses FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update licenses"
  ON licenses FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete licenses"
  ON licenses FOR DELETE
  TO authenticated
  USING (is_admin());

-- Drop old policies for brokers and create admin-only policies
DROP POLICY IF EXISTS "Authenticated users can view brokers" ON brokers;
DROP POLICY IF EXISTS "Authenticated users can create brokers" ON brokers;
DROP POLICY IF EXISTS "Authenticated users can update brokers" ON brokers;
DROP POLICY IF EXISTS "Authenticated users can delete brokers" ON brokers;

CREATE POLICY "Admins can view brokers"
  ON brokers FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can create brokers"
  ON brokers FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update brokers"
  ON brokers FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete brokers"
  ON brokers FOR DELETE
  TO authenticated
  USING (is_admin());

-- Drop old policies for broker_servers and create admin-only policies
DROP POLICY IF EXISTS "Authenticated users can view broker servers" ON broker_servers;
DROP POLICY IF EXISTS "Authenticated users can create broker servers" ON broker_servers;
DROP POLICY IF EXISTS "Authenticated users can update broker servers" ON broker_servers;
DROP POLICY IF EXISTS "Authenticated users can delete broker servers" ON broker_servers;

CREATE POLICY "Admins can view broker servers"
  ON broker_servers FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can create broker servers"
  ON broker_servers FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update broker servers"
  ON broker_servers FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete broker servers"
  ON broker_servers FOR DELETE
  TO authenticated
  USING (is_admin());

-- Policies for license_brokers
CREATE POLICY "Admins can view license brokers"
  ON license_brokers FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can create license brokers"
  ON license_brokers FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete license brokers"
  ON license_brokers FOR DELETE
  TO authenticated
  USING (is_admin());

-- Admin-only policies for validation_logs
CREATE POLICY "Admins can view validation logs"
  ON validation_logs FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can create validation logs"
  ON validation_logs FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- Policies for audit_logs
CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can create audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- Create view for licenses with brokers
CREATE OR REPLACE VIEW v_licenses_with_brokers AS
SELECT 
  l.*,
  COALESCE(
    json_agg(
      json_build_object(
        'id', b.id,
        'name', b.name,
        'slug', b.slug,
        'is_active', b.is_active
      ) ORDER BY b.name
    ) FILTER (WHERE b.id IS NOT NULL),
    '[]'::json
  ) as brokers
FROM licenses l
LEFT JOIN license_brokers lb ON l.id = lb.license_id
LEFT JOIN brokers b ON lb.broker_id = b.id
GROUP BY l.id;