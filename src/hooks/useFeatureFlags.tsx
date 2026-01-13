import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface FeatureFlag {
  id: string;
  name: string;
  enabled: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export function useFeatureFlags() {
  const { user } = useAuth();

  const { data: flags, isLoading, error } = useQuery({
    queryKey: ['feature-flags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*');

      if (error) throw error;
      return data as FeatureFlag[];
    },
    enabled: !!user,
  });

  const isPaidModeEnabled = flags?.find(f => f.name === 'paid_mode')?.enabled ?? false;
  const isTradingEnabled = flags?.find(f => f.name === 'trading_enabled')?.enabled ?? true;

  return {
    flags: flags ?? [],
    isPaidModeEnabled,
    isTradingEnabled,
    isLoading,
    error,
  };
}

export function useAdminFeatureFlags() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const { data: flags, isLoading, error } = useQuery({
    queryKey: ['feature-flags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*');

      if (error) throw error;
      return data as FeatureFlag[];
    },
    enabled: isAdmin,
  });

  const toggleFlag = useMutation({
    mutationFn: async ({ name, enabled }: { name: string; enabled: boolean }) => {
      const { error } = await supabase
        .from('feature_flags')
        .update({ enabled })
        .eq('name', name);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
    },
  });

  return {
    flags: flags ?? [],
    isLoading,
    error,
    toggleFlag: toggleFlag.mutateAsync,
    isToggling: toggleFlag.isPending,
  };
}
