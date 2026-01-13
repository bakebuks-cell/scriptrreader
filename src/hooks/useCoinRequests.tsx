import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface CoinRequest {
  id: string;
  user_id: string;
  requested_coins: number;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useCoinRequests() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch user's own coin requests
  const { data: myRequests, isLoading } = useQuery({
    queryKey: ['coin-requests', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('coin_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CoinRequest[];
    },
    enabled: !!user?.id,
  });

  // Create a new coin request
  const createRequest = useMutation({
    mutationFn: async ({ requestedCoins, reason }: { requestedCoins: number; reason?: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('coin_requests')
        .insert({
          user_id: user.id,
          requested_coins: requestedCoins,
          reason: reason || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coin-requests'] });
      toast({
        title: 'Request Submitted',
        description: 'Your coin request has been submitted for admin approval.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit coin request',
        variant: 'destructive',
      });
    },
  });

  const pendingRequests = myRequests?.filter(r => r.status === 'pending') || [];
  const hasPendingRequest = pendingRequests.length > 0;

  return {
    myRequests: myRequests || [],
    pendingRequests,
    hasPendingRequest,
    isLoading,
    createRequest: createRequest.mutateAsync,
    isCreating: createRequest.isPending,
  };
}

// Admin hook for managing all coin requests
export function useAdminCoinRequests() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch all coin requests (admin only)
  const { data: allRequests, isLoading } = useQuery({
    queryKey: ['admin-coin-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coin_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CoinRequest[];
    },
    enabled: isAdmin,
  });

  // Approve a coin request
  const approveRequest = useMutation({
    mutationFn: async ({ requestId, adminNotes }: { requestId: string; adminNotes?: string }) => {
      // Get the request details
      const { data: request, error: fetchError } = await supabase
        .from('coin_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (fetchError) throw fetchError;

      // Get current user coins
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('coins')
        .eq('user_id', request.user_id)
        .single();

      if (profileError) throw profileError;

      const coinsBefore = profile.coins;
      const coinsAfter = coinsBefore + request.requested_coins;

      // Update user coins
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ coins: coinsAfter })
        .eq('user_id', request.user_id);

      if (updateError) throw updateError;

      // Update request status
      const { error: requestError } = await supabase
        .from('coin_requests')
        .update({
          status: 'approved',
          admin_notes: adminNotes || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (requestError) throw requestError;

      // Create audit log
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('coin_audit_log').insert({
        user_id: request.user_id,
        action: 'request_approved',
        coins_before: coinsBefore,
        coins_after: coinsAfter,
        reason: `Request approved: ${request.reason || 'No reason provided'}`,
        performed_by: user?.id,
      });

      return { coinsBefore, coinsAfter };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coin-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: 'Request Approved',
        description: 'Coins have been added to the user\'s account.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve request',
        variant: 'destructive',
      });
    },
  });

  // Reject a coin request
  const rejectRequest = useMutation({
    mutationFn: async ({ requestId, adminNotes }: { requestId: string; adminNotes?: string }) => {
      const { error } = await supabase
        .from('coin_requests')
        .update({
          status: 'rejected',
          admin_notes: adminNotes || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coin-requests'] });
      toast({
        title: 'Request Rejected',
        description: 'The coin request has been rejected.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject request',
        variant: 'destructive',
      });
    },
  });

  // Add coins manually
  const addCoins = useMutation({
    mutationFn: async ({ userId, coins, reason }: { userId: string; coins: number; reason?: string }) => {
      // Get current coins
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('coins')
        .eq('user_id', userId)
        .single();

      if (profileError) throw profileError;

      const coinsBefore = profile.coins;
      const coinsAfter = coinsBefore + coins;

      // Update coins
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ coins: coinsAfter })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      // Create audit log
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('coin_audit_log').insert({
        user_id: userId,
        action: 'admin_add',
        coins_before: coinsBefore,
        coins_after: coinsAfter,
        reason: reason || 'Admin manual addition',
        performed_by: user?.id,
      });

      return { coinsBefore, coinsAfter };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast({
        title: 'Coins Added',
        description: 'Coins have been added to the user\'s account.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add coins',
        variant: 'destructive',
      });
    },
  });

  // Deduct coins
  const deductCoins = useMutation({
    mutationFn: async ({ userId, coins, reason }: { userId: string; coins: number; reason?: string }) => {
      // Get current coins
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('coins')
        .eq('user_id', userId)
        .single();

      if (profileError) throw profileError;

      const coinsBefore = profile.coins;
      const coinsAfter = Math.max(0, coinsBefore - coins);

      // Update coins
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ coins: coinsAfter })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      // Create audit log
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('coin_audit_log').insert({
        user_id: userId,
        action: 'admin_deduct',
        coins_before: coinsBefore,
        coins_after: coinsAfter,
        reason: reason || 'Admin manual deduction',
        performed_by: user?.id,
      });

      return { coinsBefore, coinsAfter };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast({
        title: 'Coins Deducted',
        description: 'Coins have been deducted from the user\'s account.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to deduct coins',
        variant: 'destructive',
      });
    },
  });

  const pendingRequests = allRequests?.filter(r => r.status === 'pending') || [];

  return {
    allRequests: allRequests || [],
    pendingRequests,
    isLoading,
    approveRequest: approveRequest.mutateAsync,
    rejectRequest: rejectRequest.mutateAsync,
    addCoins: addCoins.mutateAsync,
    deductCoins: deductCoins.mutateAsync,
    isApproving: approveRequest.isPending,
    isRejecting: rejectRequest.isPending,
    isAddingCoins: addCoins.isPending,
    isDeductingCoins: deductCoins.isPending,
  };
}
