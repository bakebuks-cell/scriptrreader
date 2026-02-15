import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface ApiKeyStatus {
  hasPermissionError: boolean;
  errorType: 'futures' | 'spot' | 'general' | null;
  errorMessage: string | null;
}

/**
 * Checks the user's most recent trades. If the last 3 are ALL failed
 * with API permission errors, surfaces a warning. If any recent trade
 * succeeded, no warning is shown (user-specific, no false positives).
 */
export function useApiKeyStatus(): ApiKeyStatus & { isLoading: boolean } {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['api-key-status', user?.id],
    queryFn: async (): Promise<ApiKeyStatus> => {
      if (!user?.id) return { hasPermissionError: false, errorType: null, errorMessage: null };

      // Get last 5 trades from the last 2 hours only (avoid stale errors from old API keys)
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const { data: recentTrades } = await supabase
        .from('trades')
        .select('status, error_message')
        .eq('user_id', user.id)
        .gte('created_at', twoHoursAgo)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!recentTrades || recentTrades.length === 0) {
        return { hasPermissionError: false, errorType: null, errorMessage: null };
      }

      // If ANY recent trade succeeded (OPEN or CLOSED), no warning
      const hasSuccess = recentTrades.some(t => t.status === 'OPEN' || t.status === 'CLOSED');
      if (hasSuccess) {
        return { hasPermissionError: false, errorType: null, errorMessage: null };
      }

      // Check if failed trades have API permission errors
      const permissionFails = recentTrades.filter(
        t => t.status === 'FAILED' && (
          t.error_message?.includes('Invalid API-key') ||
          t.error_message?.includes('permissions for action') ||
          t.error_message?.includes('API-key format invalid')
        )
      );

      if (permissionFails.length >= 2) {
        const msg = permissionFails[0]?.error_message || '';
        const isFutures = msg.includes('Futures') || msg.includes('fapi') || msg.includes('dapi');
        return {
          hasPermissionError: true,
          errorType: isFutures ? 'futures' : 'general',
          errorMessage: msg,
        };
      }

      return { hasPermissionError: false, errorType: null, errorMessage: null };
    },
    enabled: !!user?.id,
    staleTime: 60000, // Check once per minute
  });

  return {
    hasPermissionError: data?.hasPermissionError ?? false,
    errorType: data?.errorType ?? null,
    errorMessage: data?.errorMessage ?? null,
    isLoading,
  };
}
