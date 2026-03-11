import { useState, useEffect, createContext, useContext, ReactNode, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'admin' | 'user';

const SESSION_KEY = 'lwt_session_id';
const ACTIVITY_INTERVAL_MS = 60_000;

function getDeviceInfo(): string {
  const ua = navigator.userAgent;
  const platform = navigator.platform || 'unknown';
  return `${platform} | ${ua.slice(0, 100)}`;
}

interface SessionError {
  code: string;
  message: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  loading: boolean;
  sessionError: SessionError | null;
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
  const [sessionError, setSessionError] = useState<SessionError | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

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

  // --- Session helpers ---
  const createAppSession = useCallback(async (userId: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.rpc('create_user_session', {
        _user_id: userId,
        _device_info: getDeviceInfo(),
        _ip_address: null,
      });

      if (error) {
        console.error('Failed to create session:', error);
        return null;
      }

      const result = data as { session_id: string; expiry_time: string } | null;
      if (result?.session_id) {
        localStorage.setItem(SESSION_KEY, result.session_id);
        return result.session_id;
      }
      return null;
    } catch (err) {
      console.error('Session creation error:', err);
      return null;
    }
  }, []);

  const validateAppSession = useCallback(async (userId: string): Promise<{ valid: boolean; error?: string }> => {
    const sessionId = localStorage.getItem(SESSION_KEY);
    if (!sessionId) return { valid: false, error: 'SESSION_NOT_FOUND' };

    try {
      const { data, error } = await supabase.rpc('validate_session', {
        _user_id: userId,
        _session_id: sessionId,
      });

      if (error) return { valid: false, error: 'VALIDATION_ERROR' };

      const result = data as { valid: boolean; error: string | null } | null;
      return { valid: result?.valid ?? false, error: result?.error ?? undefined };
    } catch {
      return { valid: false, error: 'VALIDATION_ERROR' };
    }
  }, []);

  const handleSessionInvalid = useCallback(async (errorCode: string) => {
    localStorage.removeItem(SESSION_KEY);

    const messages: Record<string, string> = {
      SESSION_EXPIRED: 'Your session has expired. Please sign in again.',
      SESSION_REVOKED: 'Your session was ended because you logged in from another device.',
      SESSION_NOT_FOUND: 'Session not found. Please sign in again.',
    };

    setSessionError({
      code: errorCode,
      message: messages[errorCode] || 'Please sign in again.',
    });

    // Stop monitoring
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    await supabase.auth.signOut();
  }, []);

  const startSessionMonitor = useCallback((userId: string) => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(async () => {
      if (!mountedRef.current) return;
      const result = await validateAppSession(userId);
      if (!result.valid && result.error) {
        handleSessionInvalid(result.error);
      }
    }, ACTIVITY_INTERVAL_MS);
  }, [validateAppSession, handleSessionInvalid]);

  // --- Auth lifecycle ---
  useEffect(() => {
    mountedRef.current = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, authSession) => {
        if (!mountedRef.current) return;
        setSession(authSession);
        setUser(authSession?.user ?? null);

        if (authSession?.user) {
          setTimeout(async () => {
            if (!mountedRef.current) return;
            const userRole = await fetchUserRole(authSession.user.id);
            if (mountedRef.current) {
              setRole(userRole);
              setLoading(false);
            }

            // On SIGNED_IN, create a new app session & start monitoring
            if (event === 'SIGNED_IN') {
              const existingSessionId = localStorage.getItem(SESSION_KEY);
              if (!existingSessionId) {
                await createAppSession(authSession.user.id);
              }
              startSessionMonitor(authSession.user.id);
            }
          }, 0);
        } else {
          setRole(null);
          setLoading(false);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      }
    );

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session: initSession }, error }) => {
      if (!mountedRef.current) return;

      if (error) {
        console.warn('Session retrieval error:', error.message);
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setRole(null);
        setLoading(false);
        return;
      }

      setSession(initSession);
      setUser(initSession?.user ?? null);

      if (initSession?.user) {
        const userRole = await fetchUserRole(initSession.user.id);
        if (mountedRef.current) setRole(userRole);

        // Validate existing app session on page load
        const existingSessionId = localStorage.getItem(SESSION_KEY);
        if (existingSessionId) {
          const result = await validateAppSession(initSession.user.id);
          if (!result.valid) {
            // Session invalid — create a new one (page refresh scenario)
            await createAppSession(initSession.user.id);
          }
          startSessionMonitor(initSession.user.id);
        } else {
          // No stored session — create one
          await createAppSession(initSession.user.id);
          startSessionMonitor(initSession.user.id);
        }
      }
      if (mountedRef.current) setLoading(false);
    }).catch(async (err) => {
      if (!mountedRef.current) return;
      console.error('Session error:', err);
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setRole(null);
      setLoading(false);
    });

    // Safety timeout
    const safetyTimer = setTimeout(() => {
      if (mountedRef.current) {
        setLoading(prev => {
          if (prev) console.warn('Auth loading safety timeout triggered');
          return false;
        });
      }
    }, 5000);

    return () => {
      mountedRef.current = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [createAppSession, validateAppSession, startSessionMonitor]);

  const getAuthRedirectBaseUrl = () => {
    const origin = window.location.origin;
    const hostname = window.location.hostname;
    const isPreviewHost =
      hostname.endsWith('lovableproject.com') || hostname.startsWith('id-preview--');
    return isPreviewHost ? 'https://scriptrreader.lovable.app' : origin;
  };

  const signIn = async (email: string, password?: string) => {
    const cleanEmail = email.trim();
    const cleanPassword = password?.trim() ?? '';
    setSessionError(null);

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

        if (!isNetworkFetchError(error)) {
          return { error: error as Error };
        }
      } catch (error) {
        if (!isNetworkFetchError(error)) {
          return { error: error instanceof Error ? error : new Error('Sign in failed') };
        }
      }
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: { emailRedirectTo: `${getAuthRedirectBaseUrl()}/auth` },
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
    // Revoke app session
    const sessionId = localStorage.getItem(SESSION_KEY);
    if (sessionId) {
      await supabase
        .from('user_sessions')
        .update({ session_status: 'revoked' } as any)
        .eq('session_id', sessionId);
      localStorage.removeItem(SESSION_KEY);
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
    setSessionError(null);
  };

  const value: AuthContextType = {
    user,
    session,
    role,
    loading,
    sessionError,
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
