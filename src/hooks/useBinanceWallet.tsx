import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useState } from 'react';
import { useToast } from './use-toast';

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

const BINANCE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/binance-api`;

async function callBinanceApi(action: string, method: string = 'GET', body?: any) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const response = await fetch(`${BINANCE_FUNCTION_URL}?action=${action}`, {
    method,
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'API request failed');
  return data;
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

      const { data: existing } = await supabase
        .from('exchange_keys')
        .select('id')
        .eq('user_id', user.id)
        .eq('exchange', 'binance')
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('exchange_keys')
          .update({
            api_key_encrypted: apiKey,
            api_secret_encrypted: apiSecret,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
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
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
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
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
    },
  });

  const testConnection = useMutation({
    mutationFn: async () => {
      return await callBinanceApi('test');
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
    testConnection: testConnection.mutateAsync,
    isSaving: saveKeys.isPending,
    isDeleting: deleteKeys.isPending,
    isTesting: testConnection.isPending,
  };
}

export function useWalletBalance() {
  const { hasKeys } = useExchangeKeys();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data, isLoading, refetch, error } = useQuery({
    queryKey: ['wallet-balance'],
    queryFn: async () => {
      const result = await callBinanceApi('balance');
      return result;
    },
    enabled: hasKeys,
    staleTime: 30000,
    retry: 1,
  });

  const refresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const spotBalances: WalletBalance[] = data?.spot ?? [];
  const futuresBalances: WalletBalance[] = data?.futures ?? [];
  const allBalances = [...spotBalances, ...futuresBalances];

  // Calculate total in USDT (simplified - in production use real price feeds)
  const totalUSDT = allBalances.reduce((sum, b) => {
    if (b.asset === 'USDT' || b.asset === 'BUSD') {
      return sum + parseFloat(b.free) + parseFloat(b.locked);
    }
    return sum;
  }, 0);

  return {
    balances: allBalances,
    spotBalances,
    futuresBalances,
    totalUSDT,
    isLoading,
    isRefreshing,
    refresh,
    hasKeys,
    error,
  };
}

export function useOpenPositions() {
  const { hasKeys } = useExchangeKeys();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['open-positions'],
    queryFn: async () => {
      const result = await callBinanceApi('positions');
      return result.positions as OpenPosition[];
    },
    enabled: hasKeys,
    staleTime: 10000,
    retry: 1,
  });

  return {
    positions: data ?? [],
    isLoading,
    hasKeys,
    refetch,
  };
}

export function usePlaceTrade() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: {
      symbol: string;
      side: 'BUY' | 'SELL';
      quantity: string;
      type?: 'MARKET' | 'LIMIT';
      price?: string;
      stopLoss?: string;
      takeProfit?: string;
      isFutures?: boolean;
    }) => {
      return await callBinanceApi('trade', 'POST', params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      queryClient.invalidateQueries({ queryKey: ['open-positions'] });
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast({ title: 'Trade Executed', description: 'Your order has been placed successfully.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Trade Failed', description: error.message, variant: 'destructive' });
    },
  });
}

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
