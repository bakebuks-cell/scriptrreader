import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { MAX_SELECTED_TIMEFRAMES } from '@/lib/constants';

export interface Profile {
  id: string;
  user_id: string;
  email: string | null;
  display_name: string | null;
  coins: number;
  bot_enabled: boolean;
  selected_timeframes: string[];
  subscription_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as Profile | null;
    },
    enabled: !!user?.id,
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: Partial<Pick<Profile, 'display_name' | 'bot_enabled' | 'selected_timeframes' | 'subscription_active'>>) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Validate timeframes limit
      if (updates.selected_timeframes && updates.selected_timeframes.length > MAX_SELECTED_TIMEFRAMES) {
        throw new Error(`Maximum ${MAX_SELECTED_TIMEFRAMES} timeframes allowed`);
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as Profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });

  const toggleBot = async () => {
    if (!profile) return;
    await updateProfile.mutateAsync({ bot_enabled: !profile.bot_enabled });
  };

  const toggleSubscription = async () => {
    if (!profile) return;
    await updateProfile.mutateAsync({ subscription_active: !profile.subscription_active });
  };

  const updateTimeframes = async (timeframes: string[]) => {
    await updateProfile.mutateAsync({ selected_timeframes: timeframes });
  };

  return {
    profile,
    isLoading,
    error,
    updateProfile: updateProfile.mutateAsync,
    toggleBot,
    toggleSubscription,
    updateTimeframes,
    isUpdating: updateProfile.isPending,
  };
}
