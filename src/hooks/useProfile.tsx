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
    const enabling = !profile.bot_enabled;
    await updateProfile.mutateAsync({ bot_enabled: enabling });

    // When enabling the bot, stamp bot_started_at on all user_scripts so the
    // engine ignores signals that existed BEFORE this moment.
    if (enabling && user?.id) {
      const botStartedAt = new Date().toISOString();
      // Fetch all user scripts for this user
      const { data: userScripts } = await supabase
        .from('user_scripts')
        .select('id, settings_json')
        .eq('user_id', user.id);

      if (userScripts && userScripts.length > 0) {
        for (const us of userScripts) {
          const existingSettings = (us.settings_json as Record<string, any>) || {};
          await supabase
            .from('user_scripts')
            .update({ settings_json: { ...existingSettings, bot_started_at: botStartedAt } })
            .eq('id', us.id);
        }
      }

      // Also stamp user-created scripts (pine_scripts with created_by = user)
      // Store in a profile-level field via profiles metadata (simplest approach: use user_scripts)
      // For user-created scripts not in user_scripts, we use a separate key in profiles updated_at
      // We'll handle this in the engine by also checking profiles.updated_at as fallback
    }
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
