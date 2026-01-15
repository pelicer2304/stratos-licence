import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  checkingAdmin: boolean;
  adminChecked: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);

  const lastCheckedUserIdRef = useRef<string | null>(null);
  const adminCheckedRef = useRef(false);

  useEffect(() => {
    adminCheckedRef.current = adminChecked;
  }, [adminChecked]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);

      if (sessionUser) {
        const sameUserAsLastCheck = lastCheckedUserIdRef.current === sessionUser.id;
        const alreadyChecked = adminCheckedRef.current;

        if (!sameUserAsLastCheck || !alreadyChecked) {
          lastCheckedUserIdRef.current = sessionUser.id;
          setAdminChecked(false);
          checkAdmin(sessionUser.id);
        } else {
          setLoading(false);
        }
      } else {
        setAdminChecked(true);
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        const sessionUser = session?.user ?? null;
        setUser(sessionUser);

        if (sessionUser) {
          const sameUserAsLastCheck = lastCheckedUserIdRef.current === sessionUser.id;
          const alreadyChecked = adminCheckedRef.current;

          // Supabase emits auth events on token refresh / tab focus.
          // If it's the same user and admin is already known, don't block the whole UI.
          if (!sameUserAsLastCheck || !alreadyChecked) {
            lastCheckedUserIdRef.current = sessionUser.id;
            setAdminChecked(false);
            await checkAdmin(sessionUser.id);
          }
        } else {
          setIsAdmin(false);
          setCheckingAdmin(false);
          setAdminChecked(true);
          lastCheckedUserIdRef.current = null;
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdmin = async (userId: string) => {
    try {
      setCheckingAdmin(true);
      const { data, error } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      setIsAdmin(!!data);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    } finally {
      setCheckingAdmin(false);
      setAdminChecked(true);
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    if (data.user) {
      setAdminChecked(false);
      await checkAdmin(data.user.id);
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setIsAdmin(false);
    setAdminChecked(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, checkingAdmin, adminChecked, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
