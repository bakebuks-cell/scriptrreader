import { useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const SESSION_KEY = 'lwt_session_id';
const ACTIVITY_INTERVAL_MS = 60_000; // validate every 60s

function getDeviceInfo(): string {
  const ua = navigator.userAgent;
  const platform = navigator.platform || 'unknown';
  return `${platform} | ${ua.slice(0, 100)}`;
}

export function useSessionManager() {
  const { toast } = useToast();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getSessionId = useCallback((): string | null => {
    return localStorage.getItem(SESSION_KEY);
  }, []);

  const createSession = useCallback(async (userId: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.rpc('create_user_session', {
        _user_id: userId,
        _device_info: getDeviceInfo(),
        _ip_address: null, // IP captured server-side if needed
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

  const validateSession = useCallback(async (userId: string): Promise<{ valid: boolean; error?: string }> => {
    const sessionId = getSessionId();
    if (!sessionId) {
      return { valid: false, error: 'SESSION_NOT_FOUND' };
    }

    try {
      const { data, error } = await supabase.rpc('validate_session', {
        _user_id: userId,
        _session_id: sessionId,
      });

      if (error) {
        console.error('Session validation error:', error);
        return { valid: false, error: 'VALIDATION_ERROR' };
      }

      const result = data as { valid: boolean; error: string | null } | null;
      return {
        valid: result?.valid ?? false,
        error: result?.error ?? undefined,
      };
    } catch (err) {
      console.error('Session validation exception:', err);
      return { valid: false, error: 'VALIDATION_ERROR' };
    }
  }, [getSessionId]);

  const revokeSession = useCallback(async () => {
    const sessionId = getSessionId();
    if (sessionId) {
      await supabase
        .from('user_sessions')
        .update({ session_status: 'revoked' })
        .eq('session_id', sessionId);
    }
    localStorage.removeItem(SESSION_KEY);
  }, [getSessionId]);

  const handleInvalidSession = useCallback(async (errorCode: string) => {
    localStorage.removeItem(SESSION_KEY);

    const messages: Record<string, string> = {
      SESSION_EXPIRED: 'Your session has expired. Please sign in again.',
      SESSION_REVOKED: 'Your session was ended because you logged in from another device.',
      SESSION_NOT_FOUND: 'Session not found. Please sign in again.',
    };

    toast({
      title: 'Session Invalid',
      description: messages[errorCode] || 'Please sign in again.',
      variant: 'destructive',
    });

    await supabase.auth.signOut();
  }, [toast]);

  const startActivityMonitor = useCallback((userId: string) => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(async () => {
      const result = await validateSession(userId);
      if (!result.valid && result.error) {
        handleInvalidSession(result.error);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    }, ACTIVITY_INTERVAL_MS);
  }, [validateSession, handleInvalidSession]);

  const stopActivityMonitor = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    getSessionId,
    createSession,
    validateSession,
    revokeSession,
    handleInvalidSession,
    startActivityMonitor,
    stopActivityMonitor,
  };
}
