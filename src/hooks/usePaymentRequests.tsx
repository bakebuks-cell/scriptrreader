import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface PaymentRequest {
  id: string;
  user_id: string;
  tx_hash: string;
  amount: number;
  crypto_symbol: string;
  wallet_address: string;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED';
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  subscription_starts_at: string | null;
  subscription_ends_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useUserPaymentRequests() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: requests, isLoading, error } = useQuery({
    queryKey: ['payment-requests', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_requests')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PaymentRequest[];
    },
    enabled: !!user?.id,
  });

  const submitPayment = useMutation({
    mutationFn: async ({ tx_hash, amount, crypto_symbol, wallet_address }: {
      tx_hash: string;
      amount: number;
      crypto_symbol: string;
      wallet_address: string;
    }) => {
      const { data, error } = await supabase
        .from('payment_requests')
        .insert({
          user_id: user!.id,
          tx_hash,
          amount,
          crypto_symbol,
          wallet_address,
          status: 'PENDING',
        })
        .select()
        .single();

      if (error) throw error;
      return data as PaymentRequest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-requests', user?.id] });
    },
  });

  // Check if user has an active subscription
  const activeSubscription = requests?.find(r => {
    if (r.status !== 'CONFIRMED' || !r.subscription_ends_at) return false;
    return new Date(r.subscription_ends_at) > new Date();
  });

  const pendingRequest = requests?.find(r => r.status === 'PENDING');

  return {
    requests: requests ?? [],
    isLoading,
    error,
    submitPayment: submitPayment.mutateAsync,
    isSubmitting: submitPayment.isPending,
    activeSubscription,
    pendingRequest,
    hasActiveSubscription: !!activeSubscription,
  };
}

export function useAdminPaymentRequests() {
  const { isAdmin, user } = useAuth();
  const queryClient = useQueryClient();

  const { data: requests, isLoading, error } = useQuery({
    queryKey: ['admin-payment-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PaymentRequest[];
    },
    enabled: isAdmin,
  });

  const reviewPayment = useMutation({
    mutationFn: async ({ id, status, admin_notes }: {
      id: string;
      status: 'CONFIRMED' | 'REJECTED';
      admin_notes?: string;
    }) => {
      const updates: Record<string, unknown> = {
        status,
        admin_notes: admin_notes || null,
        reviewed_by: user!.id,
        reviewed_at: new Date().toISOString(),
      };

      if (status === 'CONFIRMED') {
        const now = new Date();
        const expiresAt = new Date(now);
        expiresAt.setMonth(expiresAt.getMonth() + 1);
        updates.subscription_starts_at = now.toISOString();
        updates.subscription_ends_at = expiresAt.toISOString();
      }

      const { data, error } = await supabase
        .from('payment_requests')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as PaymentRequest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payment-requests'] });
    },
  });

  return {
    requests: requests ?? [],
    isLoading,
    error,
    reviewPayment: reviewPayment.mutateAsync,
    isReviewing: reviewPayment.isPending,
  };
}
