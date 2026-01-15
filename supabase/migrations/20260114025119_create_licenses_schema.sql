/*
  # Create Licenses Management Schema

  ## Tables Created
  
  1. `licenses` - Main licenses table
    - `id` (uuid, primary key)
    - `client_name` (text) - Client's full name
    - `mt5_login` (text) - MT5 account login number
    - `allowed_servers` (text[]) - Array of allowed server names
    - `expires_at` (timestamptz) - License expiration date
    - `status` (text) - Current status: 'active', 'expiring', 'blocked'
    - `is_active` (boolean) - Active toggle
    - `created_at` (timestamptz) - Creation timestamp
    - `updated_at` (timestamptz) - Last update timestamp
    - `user_id` (uuid) - Reference to auth.users
  
  2. `validation_logs` - License validation logs
    - `id` (uuid, primary key)
    - `license_id` (uuid) - Foreign key to licenses
    - `server_name` (text) - Server that validated
    - `action` (text) - Action performed
    - `result` (text) - Result: 'success', 'failed', 'blocked'
    - `ip_address` (text) - IP address of validation
    - `created_at` (timestamptz) - Log timestamp
  
  ## Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own licenses
    - Add policies for viewing logs
*/

-- Create licenses table
CREATE TABLE IF NOT EXISTS licenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name text NOT NULL,
  mt5_login text NOT NULL,
  allowed_servers text[] NOT NULL DEFAULT '{}',
  expires_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expiring', 'blocked')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Create validation_logs table
CREATE TABLE IF NOT EXISTS validation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id uuid REFERENCES licenses(id) ON DELETE CASCADE NOT NULL,
  server_name text NOT NULL,
  action text NOT NULL,
  result text NOT NULL CHECK (result IN ('success', 'failed', 'blocked')),
  ip_address text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_licenses_user_id ON licenses(user_id);
CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);
CREATE INDEX IF NOT EXISTS idx_licenses_expires_at ON licenses(expires_at);
CREATE INDEX IF NOT EXISTS idx_validation_logs_license_id ON validation_logs(license_id);
CREATE INDEX IF NOT EXISTS idx_validation_logs_created_at ON validation_logs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_logs ENABLE ROW LEVEL SECURITY;

-- Policies for licenses table
CREATE POLICY "Users can view own licenses"
  ON licenses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own licenses"
  ON licenses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own licenses"
  ON licenses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own licenses"
  ON licenses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for validation_logs table
CREATE POLICY "Users can view logs for own licenses"
  ON validation_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM licenses
      WHERE licenses.id = validation_logs.license_id
      AND licenses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create logs for own licenses"
  ON validation_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM licenses
      WHERE licenses.id = validation_logs.license_id
      AND licenses.user_id = auth.uid()
    )
  );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on licenses
CREATE TRIGGER update_licenses_updated_at
  BEFORE UPDATE ON licenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();