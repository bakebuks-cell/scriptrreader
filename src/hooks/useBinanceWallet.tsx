import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useState } from 'react';

export interface ExchangeKey {
  id: string;
  user_id: string;
  exchange: string;
  api_key_encrypted: string;
  api_secret_encrypted: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WalletBalance {
  asset: string;
  free: string;
  locked: string;
}

export interface OpenPosition {
  symbol: string;
  positionAmt: string;
  entryPrice: string;
  unrealizedProfit: string;
  leverage: string;
}

export function useExchangeKeys() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: exchangeKeys, isLoading, error } = useQuery({
    queryKey: ['exchange-keys', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('exchange_keys')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return data as ExchangeKey[];
    },
    enabled: !!user?.id,
  });

  const saveKeys = useMutation({
    mutationFn: async ({ apiKey, apiSecret }: { apiKey: string; apiSecret: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Check if keys exist
      const { data: existing } = await supabase
        .from('exchange_keys')
        .select('id')
        .eq('user_id', user.id)
        .eq('exchange', 'binance')
        .maybeSingle();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('exchange_keys')
          .update({
            api_key_encrypted: apiKey, // Note: In production, encrypt these properly
            api_secret_encrypted: apiSecret,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('exchange_keys')
          .insert({
            user_id: user.id,
            exchange: 'binance',
            api_key_encrypted: apiKey,
            api_secret_encrypted: apiSecret,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchange-keys', user?.id] });
    },
  });

  const deleteKeys = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('exchange_keys')
        .delete()
        .eq('user_id', user.id)
        .eq('exchange', 'binance');

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchange-keys', user?.id] });
    },
  });

  const hasKeys = (exchangeKeys?.length ?? 0) > 0;
  const binanceKeys = exchangeKeys?.find(k => k.exchange === 'binance');

  return {
    exchangeKeys: exchangeKeys ?? [],
    binanceKeys,
    hasKeys,
    isLoading,
    error,
    saveKeys: saveKeys.mutateAsync,
    deleteKeys: deleteKeys.mutateAsync,
    isSaving: saveKeys.isPending,
    isDeleting: deleteKeys.isPending,
  };
}

// Mock wallet data for demo - in production, this would call an edge function
// that securely communicates with Binance API
export function useWalletBalance() {
  const { binanceKeys, hasKeys } = useExchangeKeys();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // In production, this would call an edge function to get real Binance balance
  const { data: balances, isLoading, refetch } = useQuery({
    queryKey: ['wallet-balance', binanceKeys?.id],
    queryFn: async (): Promise<WalletBalance[]> => {
      // Mock data for demo purposes
      // In production, call: await supabase.functions.invoke('get-binance-balance')
      return [
        { asset: 'USDT', free: '1000.00', locked: '0.00' },
        { asset: 'BTC', free: '0.05', locked: '0.00' },
        { asset: 'ETH', free: '0.5', locked: '0.00' },
      ];
    },
    enabled: hasKeys,
    staleTime: 30000, // 30 seconds
  });

  const refresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const totalUSDT = balances?.reduce((sum, b) => {
    if (b.asset === 'USDT') return sum + parseFloat(b.free);
    // Mock conversion rates
    if (b.asset === 'BTC') return sum + parseFloat(b.free) * 45000;
    if (b.asset === 'ETH') return sum + parseFloat(b.free) * 2500;
    return sum;
  }, 0) ?? 0;

  return {
    balances: balances ?? [],
    totalUSDT,
    isLoading,
    isRefreshing,
    refresh,
    hasKeys,
  };
}

export function useOpenPositions() {
  const { binanceKeys, hasKeys } = useExchangeKeys();

  const { data: positions, isLoading } = useQuery({
    queryKey: ['open-positions', binanceKeys?.id],
    queryFn: async (): Promise<OpenPosition[]> => {
      // Mock data for demo purposes
      // In production, call: await supabase.functions.invoke('get-binance-positions')
      return [];
    },
    enabled: hasKeys,
    staleTime: 10000, // 10 seconds
  });

  return {
    positions: positions ?? [],
    isLoading,
    hasKeys,
  };
}

// Admin hook to view all user wallets (read-only)
export function useAdminWallets() {
  const { isAdmin } = useAuth();

  const { data: allKeys, isLoading } = useQuery({
    queryKey: ['admin-exchange-keys'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exchange_keys')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ExchangeKey[];
    },
    enabled: isAdmin,
  });

  return {
    allKeys: allKeys ?? [],
    isLoading,
  };
}
