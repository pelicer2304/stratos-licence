-- Fix infinite recursion in admin_users RLS policy

-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can view admin users" ON admin_users;

-- Create a simple policy that allows users to see their own admin record
-- This avoids recursion because it doesn't call is_admin()
CREATE POLICY "Users can view own admin record"
  ON admin_users FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Allow admins to view all admin records (but this uses is_admin which is safe now)
CREATE POLICY "Admins can view all admin records"
  ON admin_users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
    )
  );
