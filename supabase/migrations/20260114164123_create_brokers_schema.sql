/*
  # Create brokers and broker_servers tables

  1. New Tables
    - `brokers`
      - `id` (uuid, primary key)
      - `name` (text, required) - Nome da corretora
      - `slug` (text, unique) - Slug único
      - `is_active` (boolean, default true) - Status ativo/inativo
      - `notes` (text, optional) - Observações
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `broker_servers`
      - `id` (uuid, primary key)
      - `broker_id` (uuid, foreign key to brokers)
      - `server` (text, required) - String exata do ACCOUNT_SERVER MT5
      - `is_active` (boolean, default true) - Status ativo/inativo
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage brokers and servers
*/

-- Create brokers table
CREATE TABLE IF NOT EXISTS brokers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create broker_servers table
CREATE TABLE IF NOT EXISTS broker_servers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id uuid NOT NULL REFERENCES brokers(id) ON DELETE CASCADE,
  server text NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(broker_id, server)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_brokers_slug ON brokers(slug);
CREATE INDEX IF NOT EXISTS idx_brokers_is_active ON brokers(is_active);
CREATE INDEX IF NOT EXISTS idx_broker_servers_broker_id ON broker_servers(broker_id);
CREATE INDEX IF NOT EXISTS idx_broker_servers_is_active ON broker_servers(is_active);

-- Enable Row Level Security
ALTER TABLE brokers ENABLE ROW LEVEL SECURITY;
ALTER TABLE broker_servers ENABLE ROW LEVEL SECURITY;

-- Create policies for brokers
CREATE POLICY "Authenticated users can view brokers"
  ON brokers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create brokers"
  ON brokers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update brokers"
  ON brokers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete brokers"
  ON brokers FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for broker_servers
CREATE POLICY "Authenticated users can view broker servers"
  ON broker_servers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create broker servers"
  ON broker_servers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update broker servers"
  ON broker_servers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete broker servers"
  ON broker_servers FOR DELETE
  TO authenticated
  USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to auto-update updated_at
DROP TRIGGER IF EXISTS update_brokers_updated_at ON brokers;
CREATE TRIGGER update_brokers_updated_at
  BEFORE UPDATE ON brokers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_broker_servers_updated_at ON broker_servers;
CREATE TRIGGER update_broker_servers_updated_at
  BEFORE UPDATE ON broker_servers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();