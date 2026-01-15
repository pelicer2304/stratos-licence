import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useAdminCheck() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const { data, error: queryError } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (queryError) throw queryError;

      setIsAdmin(!!data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao verificar permissões');
      console.error('Error checking admin status:', err);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  return { isAdmin, loading, error, refetch: checkAdmin };
}

export async function addAdminUser(email: string) {
  const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

  if (usersError) throw usersError;

  const user = users.users.find(u => u.email === email);

  if (!user) {
    throw new Error('Usuário não encontrado');
  }

  const { error } = await supabase.from('admin_users').insert({
    user_id: user.id,
    email: user.email!,
  });

  if (error) throw error;
}
