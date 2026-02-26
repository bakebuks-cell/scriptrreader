import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface SubscriptionSettings {
  id: string;
  subscription_mode_enabled: boolean;
  crypto_name: string;
  crypto_symbol: string;
  crypto_decimals: number;
  receiver_wallet_address: string;
  trial_days: number;
  monthly_amount: number;
  created_at: string;
  updated_at: string;
}

export function useSubscriptionSettings() {
  const { user } = useAuth();

  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['subscription-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as SubscriptionSettings | null;
    },
    enabled: !!user,
  });

  return {
    settings,
    isLoading,
    error,
    isSubscriptionModeOn: settings?.subscription_mode_enabled ?? false,
  };
}

export function useAdminSubscriptionSettings() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['subscription-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as SubscriptionSettings | null;
    },
    enabled: isAdmin,
  });

  const updateSettings = useMutation({
    mutationFn: async (updates: Partial<Omit<SubscriptionSettings, 'id' | 'created_at' | 'updated_at'>>) => {
      if (!settings?.id) throw new Error('No settings row found');

      const { data, error } = await supabase
        .from('subscription_settings')
        .update(updates)
        .eq('id', settings.id)
        .select()
        .single();

      if (error) throw error;
      return data as SubscriptionSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-settings'] });
    },
  });

  return {
    settings,
    isLoading,
    error,
    updateSettings: updateSettings.mutateAsync,
    isUpdating: updateSettings.isPending,
  };
}
