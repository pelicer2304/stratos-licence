-- Script para popular dados de exemplo
-- Execute após configurar seu usuário admin

-- Inserir corretoras de exemplo (caso ainda não existam)
INSERT INTO brokers (name, slug, is_active, notes) VALUES
  ('XP Investimentos', 'xp-investimentos', true, 'Principal corretora do Brasil'),
  ('Rico', 'rico', true, 'Corretora com taxas competitivas'),
  ('Clear', 'clear', true, 'Corretora do Grupo XP'),
  ('BTG Pactual', 'btg-pactual', true, 'Banco de investimentos'),
  ('Modalmais', 'modalmais', true, 'Corretora digital')
ON CONFLICT (slug) DO NOTHING;

-- Inserir servidores para cada corretora
DO $$
DECLARE
  xp_id uuid;
  rico_id uuid;
  clear_id uuid;
  btg_id uuid;
  modal_id uuid;
BEGIN
  -- Obter IDs das corretoras
  SELECT id INTO xp_id FROM brokers WHERE slug = 'xp-investimentos';
  SELECT id INTO rico_id FROM brokers WHERE slug = 'rico';
  SELECT id INTO clear_id FROM brokers WHERE slug = 'clear';
  SELECT id INTO btg_id FROM brokers WHERE slug = 'btg-pactual';
  SELECT id INTO modal_id FROM brokers WHERE slug = 'modalmais';

  -- Servidores XP
  IF xp_id IS NOT NULL THEN
    INSERT INTO broker_servers (broker_id, server, is_active) VALUES
      (xp_id, 'XPInvestimentos-MT5', true),
      (xp_id, 'XPInvestimentos-Demo', true),
      (xp_id, 'XPInvestimentos-Live01', true),
      (xp_id, 'XPInvestimentos-Live02', false)
    ON CONFLICT (broker_id, server) DO NOTHING;
  END IF;

  -- Servidores Rico
  IF rico_id IS NOT NULL THEN
    INSERT INTO broker_servers (broker_id, server, is_active) VALUES
      (rico_id, 'Rico-MT5Live', true),
      (rico_id, 'Rico-MT5Demo', true)
    ON CONFLICT (broker_id, server) DO NOTHING;
  END IF;

  -- Servidores Clear
  IF clear_id IS NOT NULL THEN
    INSERT INTO broker_servers (broker_id, server, is_active) VALUES
      (clear_id, 'Clear-Live', true),
      (clear_id, 'Clear-Demo', true),
      (clear_id, 'Clear-Live-Backup', true)
    ON CONFLICT (broker_id, server) DO NOTHING;
  END IF;

  -- Servidores BTG
  IF btg_id IS NOT NULL THEN
    INSERT INTO broker_servers (broker_id, server, is_active) VALUES
      (btg_id, 'BTGPactual-MT5', true),
      (btg_id, 'BTGPactual-MT5-Demo', true)
    ON CONFLICT (broker_id, server) DO NOTHING;
  END IF;

  -- Servidores Modal
  IF modal_id IS NOT NULL THEN
    INSERT INTO broker_servers (broker_id, server, is_active) VALUES
      (modal_id, 'Modalmais-Server01', true),
      (modal_id, 'Modalmais-Server02', true)
    ON CONFLICT (broker_id, server) DO NOTHING;
  END IF;
END $$;

-- Inserir licenças de exemplo (opcional)
DO $$
DECLARE
  xp_id uuid;
  rico_id uuid;
  license1_id uuid;
  license2_id uuid;
BEGIN
  SELECT id INTO xp_id FROM brokers WHERE slug = 'xp-investimentos' LIMIT 1;
  SELECT id INTO rico_id FROM brokers WHERE slug = 'rico' LIMIT 1;

  -- Licença 1
  INSERT INTO licenses (client_name, mt5_login, status, expires_at, notes)
  VALUES ('João Silva', 12345678, 'active', CURRENT_DATE + INTERVAL '90 days', 'Cliente VIP')
  ON CONFLICT (mt5_login) DO NOTHING
  RETURNING id INTO license1_id;

  -- Licença 2
  INSERT INTO licenses (client_name, mt5_login, status, expires_at, notes)
  VALUES ('Maria Santos', 87654321, 'active', CURRENT_DATE + INTERVAL '60 days', 'Cliente regular')
  ON CONFLICT (mt5_login) DO NOTHING
  RETURNING id INTO license2_id;

  -- Associar brokers às licenças
  IF license1_id IS NOT NULL AND xp_id IS NOT NULL THEN
    INSERT INTO license_brokers (license_id, broker_id)
    VALUES (license1_id, xp_id)
    ON CONFLICT DO NOTHING;
  END IF;

  IF license2_id IS NOT NULL AND rico_id IS NOT NULL THEN
    INSERT INTO license_brokers (license_id, broker_id)
    VALUES (license2_id, rico_id)
    ON CONFLICT DO NOTHING;
  END IF;

  IF license2_id IS NOT NULL AND xp_id IS NOT NULL THEN
    INSERT INTO license_brokers (license_id, broker_id)
    VALUES (license2_id, xp_id)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Verificar dados inseridos
SELECT 'Corretoras:', COUNT(*) FROM brokers;
SELECT 'Servidores:', COUNT(*) FROM broker_servers;
SELECT 'Licenças:', COUNT(*) FROM licenses;
SELECT 'License-Broker links:', COUNT(*) FROM license_brokers;
