-- ============================================
-- FIX COMPLETO: Corrige RLS e adiciona admin
-- ============================================

-- 1. Corrigir política recursiva do admin_users
DROP POLICY IF EXISTS "Admins can view admin users" ON admin_users;
DROP POLICY IF EXISTS "Users can view own admin record" ON admin_users;
DROP POLICY IF EXISTS "Admins can view all admin records" ON admin_users;

-- Política simples que não causa recursão
CREATE POLICY "Allow authenticated to check admin status"
  ON admin_users FOR SELECT
  TO authenticated
  USING (true);

-- 2. Adicionar o usuário como admin
INSERT INTO admin_users (user_id, email)
SELECT id, email FROM auth.users 
WHERE email = 'seu-email@exemplo.com'
ON CONFLICT (user_id) DO NOTHING;

-- 3. Verificar se foi adicionado
SELECT 
  au.email,
  au.created_at,
  'Admin cadastrado com sucesso!' as status
FROM admin_users au
WHERE au.email = 'seu-email@exemplo.com';
