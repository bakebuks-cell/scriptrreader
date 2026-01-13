import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Signal {
  id: string;
  script_id: string;
  signal_type: 'BUY' | 'SELL';
  symbol: string;
  timeframe: string;
  stop_loss: number | null;
  take_profit: number | null;
  price: number | null;
  candle_timestamp: string;
  received_at: string;
  processed: boolean;
}

export function useSignals() {
  const { user } = useAuth();

  const { data: signals, isLoading, error, refetch } = useQuery({
    queryKey: ['signals', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('signals')
        .select('*')
        .order('received_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as Signal[];
    },
    enabled: !!user?.id,
  });

  return {
    signals: signals ?? [],
    isLoading,
    error,
    refetch,
  };
}

export function useAllSignals() {
  const { isAdmin } = useAuth();

  const { data: signals, isLoading, error, refetch } = useQuery({
    queryKey: ['all-signals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('signals')
        .select('*')
        .order('received_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as Signal[];
    },
    enabled: isAdmin,
  });

  return {
    signals: signals ?? [],
    isLoading,
    error,
    refetch,
  };
}
