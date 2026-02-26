import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Trade {
  id: string;
  user_id: string;
  signal_id: string | null;
  script_id: string | null;
  signal_type: 'BUY' | 'SELL';
  symbol: string;
  timeframe: string;
  entry_price: number | null;
  exit_price: number | null;
  stop_loss: number | null;
  take_profit: number | null;
  status: 'PENDING' | 'OPEN' | 'CLOSED' | 'FAILED' | 'CANCELLED';
  coin_locked: boolean;
  coin_consumed: boolean;
  error_message: string | null;
  opened_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  quantity: number | null;
  leverage: number | null;
}

export function useTrades() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: trades, isLoading, error, refetch } = useQuery({
    queryKey: ['trades', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Trade[];
    },
    enabled: !!user?.id,
    refetchInterval: 10000, // Auto-refresh every 10 seconds
  });

  const activeTrades = trades?.filter(t => t.status === 'OPEN' || t.status === 'PENDING') ?? [];
  const completedTrades = trades?.filter(t => t.status === 'CLOSED' || t.status === 'FAILED' || t.status === 'CANCELLED') ?? [];

  const closeAllTradesMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');
      // Call the engine's close-all action to close positions on Binance + update DB
      const { data: { session } } = await supabase.auth.getSession();
      const baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pine-script-engine?action=close-all`;
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify({}),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
        throw new Error(err.error || 'Failed to close trades');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades', user?.id] });
    },
  });

  const closeSingleTradeMutation = useMutation({
    mutationFn: async (tradeId: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data: { session } } = await supabase.auth.getSession();
      const baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pine-script-engine?action=close-trade`;
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify({ tradeId }),
      });
      if (!response.ok) {
        // Fallback: mark as CLOSED in DB if engine call fails
        await supabase
          .from('trades')
          .update({ status: 'CLOSED' as const, closed_at: new Date().toISOString() })
          .eq('id', tradeId)
          .eq('user_id', user.id);
        return;
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades', user?.id] });
    },
  });

  return {
    trades: trades ?? [],
    activeTrades,
    completedTrades,
    isLoading,
    error,
    refetch,
    closeAllTrades: closeAllTradesMutation.mutateAsync,
    isClosingAll: closeAllTradesMutation.isPending,
    closeSingleTrade: closeSingleTradeMutation.mutateAsync,
    isClosingSingle: closeSingleTradeMutation.isPending,
    closingSingleId: closeSingleTradeMutation.variables,
  };
}

export function useAllTrades() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const { data: trades, isLoading, error, refetch } = useQuery({
    queryKey: ['all-trades'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Trade[];
    },
    enabled: isAdmin,
  });

  const activeTrades = (trades ?? []).filter(t => t.status === 'OPEN' || t.status === 'PENDING');

  const closeAllTradesMutation = useMutation({
    mutationFn: async () => {
      // Admin close-all: just update DB (admin may not have personal API keys)
      const { error } = await supabase
        .from('trades')
        .update({ status: 'CLOSED' as const, closed_at: new Date().toISOString() })
        .in('status', ['OPEN', 'PENDING']);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-trades'] });
    },
  });

  return {
    trades: trades ?? [],
    activeTrades,
    isLoading,
    error,
    refetch,
    closeAllTrades: closeAllTradesMutation.mutateAsync,
    isClosingAll: closeAllTradesMutation.isPending,
  };
}
