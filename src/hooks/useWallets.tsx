import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useState } from 'react';
import { useToast } from './use-toast';

// Wallet role type matching database enum
export type WalletRole = 'ADMIN' | 'USER';

export interface Wallet {
  id: string;
  user_id: string | null;
  role: WalletRole;
  name: string;
  exchange: string;
  api_key_encrypted: string | null;
  api_secret_encrypted: string | null;
  is_active: boolean;
  total_balance_usdt: number | null;
  last_synced_at: string | null;
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

/**
 * Call Binance API via edge function with auth token
 * Server-side enforces role-based access
 */
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

/**
 * Hook for USER wallets - only returns user's own wallets with role=USER
 * RLS enforces: users NEVER see admin wallets or other users' wallets
 */
export function useUserWallets() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Query only returns wallets where role=USER AND user_id=current user (RLS enforced)
  const { data: wallets, isLoading, error } = useQuery({
    queryKey: ['user-wallets', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // RLS policy ensures only own USER wallets are returned
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('[useUserWallets] Query error:', error);
        throw error;
      }
      
      // Log for verification (remove in production)
      console.log(`[useUserWallets] User ${user.id} received ${data?.length ?? 0} wallets`);
      
      return data as Wallet[];
    },
    enabled: !!user?.id,
  });

  const createWallet = useMutation({
    mutationFn: async ({ name, apiKey, apiSecret }: { name: string; apiKey: string; apiSecret: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('wallets')
        .insert({
          user_id: user.id,
          role: 'USER' as WalletRole,
          name,
          exchange: 'binance',
          api_key_encrypted: apiKey,
          api_secret_encrypted: apiSecret,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Wallet;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-wallets', user?.id] });
      toast({ title: 'Success', description: 'Wallet created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateWallet = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Wallet> & { id: string }) => {
      const { data, error } = await supabase
        .from('wallets')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Wallet;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-wallets', user?.id] });
    },
  });

  const deleteWallet = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('wallets')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-wallets', user?.id] });
      toast({ title: 'Success', description: 'Wallet deleted' });
    },
  });

  const hasWallets = (wallets?.length ?? 0) > 0;
  const activeWallet = wallets?.find(w => w.is_active);

  return {
    wallets: wallets ?? [],
    activeWallet,
    hasWallets,
    isLoading,
    error,
    createWallet: createWallet.mutateAsync,
    updateWallet: updateWallet.mutateAsync,
    deleteWallet: deleteWallet.mutateAsync,
    isCreating: createWallet.isPending,
    isUpdating: updateWallet.isPending,
    isDeleting: deleteWallet.isPending,
  };
}

/**
 * Hook for ADMIN wallets - returns ALL wallets (both ADMIN and USER)
 * Only accessible when isAdmin is true (RLS enforced)
 */
export function useAdminWallets() {
  const { isAdmin, user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Query returns all wallets for admins (RLS enforced)
  const { data: wallets, isLoading, error } = useQuery({
    queryKey: ['admin-wallets'],
    queryFn: async () => {
      // RLS policy ensures only admins can see all wallets
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .order('role', { ascending: true })
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('[useAdminWallets] Query error:', error);
        throw error;
      }
      
      // Log for verification
      const adminCount = data?.filter(w => w.role === 'ADMIN').length ?? 0;
      const userCount = data?.filter(w => w.role === 'USER').length ?? 0;
      console.log(`[useAdminWallets] Admin ${user?.id} received ${data?.length ?? 0} wallets (ADMIN: ${adminCount}, USER: ${userCount})`);
      
      return data as Wallet[];
    },
    enabled: isAdmin,
  });

  // Filter wallets by role for convenience
  const adminWallets = wallets?.filter(w => w.role === 'ADMIN') ?? [];
  const userWallets = wallets?.filter(w => w.role === 'USER') ?? [];

  const createAdminWallet = useMutation({
    mutationFn: async ({ name, apiKey, apiSecret }: { name: string; apiKey: string; apiSecret: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('wallets')
        .insert({
          user_id: user.id, // Admin's user_id
          role: 'ADMIN' as WalletRole,
          name,
          exchange: 'binance',
          api_key_encrypted: apiKey,
          api_secret_encrypted: apiSecret,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Wallet;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-wallets'] });
      toast({ title: 'Success', description: 'Admin wallet created' });
    },
  });

  const updateWallet = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Wallet> & { id: string }) => {
      const { data, error } = await supabase
        .from('wallets')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Wallet;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-wallets'] });
    },
  });

  const deleteWallet = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('wallets')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-wallets'] });
      toast({ title: 'Success', description: 'Wallet deleted' });
    },
  });

  return {
    wallets: wallets ?? [],
    adminWallets,
    userWallets,
    isLoading,
    error,
    createAdminWallet: createAdminWallet.mutateAsync,
    updateWallet: updateWallet.mutateAsync,
    deleteWallet: deleteWallet.mutateAsync,
    isCreating: createAdminWallet.isPending,
    isUpdating: updateWallet.isPending,
    isDeleting: deleteWallet.isPending,
  };
}

/**
 * Hook for wallet balance - uses active wallet
 */
export function useWalletBalance(walletId?: string) {
  const { wallets, hasWallets, activeWallet } = useUserWallets();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const targetWallet = walletId 
    ? wallets.find(w => w.id === walletId) 
    : activeWallet;

  const { data, isLoading, refetch, error } = useQuery({
    queryKey: ['wallet-balance', targetWallet?.id],
    queryFn: async () => {
      const result = await callBinanceApi('balance');
      return result;
    },
    enabled: !!targetWallet?.api_key_encrypted,
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
    hasWallets,
    wallet: targetWallet,
    error,
  };
}

/**
 * Hook for open positions
 */
export function useOpenPositions() {
  const { hasWallets, activeWallet } = useUserWallets();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['open-positions', activeWallet?.id],
    queryFn: async () => {
      const result = await callBinanceApi('positions');
      return result.positions as OpenPosition[];
    },
    enabled: !!activeWallet?.api_key_encrypted,
    staleTime: 10000,
    retry: 1,
  });

  return {
    positions: data ?? [],
    isLoading,
    hasWallets,
    refetch,
  };
}

/**
 * Hook for placing trades
 */
export function usePlaceTrade() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

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
      queryClient.invalidateQueries({ queryKey: ['user-wallets', user?.id] });
      toast({ title: 'Trade Executed', description: 'Your order has been placed successfully.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Trade Failed', description: error.message, variant: 'destructive' });
    },
  });
}

// Re-export for backward compatibility
export { callBinanceApi };
