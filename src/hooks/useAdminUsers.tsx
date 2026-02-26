import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface AdminUser {
  id: string;
  user_id: string;
  email: string | null;
  display_name: string | null;
  coins: number;
  bot_enabled: boolean;
  selected_timeframes: string[];
  feature_access: boolean;
  login_access: boolean;
  created_at: string;
  updated_at: string;
  role?: 'admin' | 'user';
}

export function useAdminUsers() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const { data: users, isLoading, error } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch roles for all users
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Merge profiles with roles
      const usersWithRoles = profiles.map(profile => ({
        ...profile,
        role: roles.find(r => r.user_id === profile.user_id)?.role as 'admin' | 'user' | undefined,
      }));

      return usersWithRoles as AdminUser[];
    },
    enabled: isAdmin,
  });

  const updateUserCoins = useMutation({
    mutationFn: async ({ userId, coins }: { userId: string; coins: number }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ coins })
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  const updateUserRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'admin' | 'user' }) => {
      // Delete existing role
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      // Insert new role
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  return {
    users: users ?? [],
    isLoading,
    error,
    updateUserCoins: updateUserCoins.mutateAsync,
    updateUserRole: updateUserRole.mutateAsync,
    isUpdating: updateUserCoins.isPending || updateUserRole.isPending,
  };
}
