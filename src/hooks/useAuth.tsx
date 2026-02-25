import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'admin' | 'user';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  loading: boolean;
  signIn: (email: string, password?: string) => Promise<{ error: Error | null; requiresEmailVerification?: boolean }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user role:', error);
        return null;
      }

      return data?.role as AppRole | null;
    } catch (err) {
      console.error('Error fetching user role:', err);
      return null;
    }
  };

  useEffect(() => {
    // Set up auth state listener BEFORE getting session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Defer role fetching to avoid blocking
          setTimeout(async () => {
            const userRole = await fetchUserRole(session.user.id);
            setRole(userRole);
            setLoading(false);
          }, 0);
        } else {
          setRole(null);
          setLoading(false);
        }
      }
    );

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      // Handle stale/invalid refresh token by signing out gracefully
      if (error) {
        console.warn('Session retrieval error:', error.message);
        // Clear any stale session data
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setRole(null);
        setLoading(false);
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const userRole = await fetchUserRole(session.user.id);
        setRole(userRole);
      }
      setLoading(false);
    }).catch(async (err) => {
      console.error('Session error:', err);
      // Clear any stale session data on error
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setRole(null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const getAuthRedirectBaseUrl = () => {
    const origin = window.location.origin;
    const hostname = window.location.hostname;

    const isPreviewHost =
      hostname.endsWith('lovableproject.com') || hostname.startsWith('id-preview--');

    // Keep auth redirects stable when running on preview hosts
    return isPreviewHost ? 'https://scriptrreader.lovable.app' : origin;
  };

  const signIn = async (email: string, password?: string) => {
    const cleanEmail = email.trim();
    const cleanPassword = password?.trim() ?? '';

    const isNetworkFetchError = (value: unknown) => {
      const message = value instanceof Error ? value.message : String(value ?? '');
      return message.toLowerCase().includes('failed to fetch');
    };

    if (cleanPassword) {
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPassword,
        });

        if (!error) {
          return { error: null };
        }

        // Only fallback when this is a network fetch issue.
        if (!isNetworkFetchError(error)) {
          return { error: error as Error };
        }
      } catch (error) {
        // signInWithPassword can throw TypeError("Failed to fetch") in preview environments.
        if (!isNetworkFetchError(error)) {
          return {
            error: error instanceof Error ? error : new Error('Sign in failed'),
          };
        }
      }
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          emailRedirectTo: `${getAuthRedirectBaseUrl()}/auth`,
        },
      });

      return {
        error: error as Error | null,
        requiresEmailVerification: !error,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error : new Error('Failed to send magic link'),
      };
    }
  };

  const signUp = async (email: string, password: string) => {
    const baseUrl = getAuthRedirectBaseUrl();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${baseUrl}/auth?verified=true&email=${encodeURIComponent(email)}`,
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
  };

  const value: AuthContextType = {
    user,
    session,
    role,
    loading,
    signIn,
    signUp,
    signOut,
    isAdmin: role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
