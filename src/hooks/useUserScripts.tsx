import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface UserScript {
  id: string;
  user_id: string;
  script_id: string;
  is_active: boolean;
  created_at: string;
}

export function useUserScripts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: userScripts, isLoading, error } = useQuery({
    queryKey: ['user-scripts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('user_scripts')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return data as UserScript[];
    },
    enabled: !!user?.id,
  });

  return {
    userScripts: userScripts ?? [],
    isLoading,
    error,
  };
}

export function useAdminUserScripts() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const { data: allUserScripts, isLoading, error } = useQuery({
    queryKey: ['all-user-scripts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_scripts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as UserScript[];
    },
    enabled: isAdmin,
  });

  const assignScript = useMutation({
    mutationFn: async ({ userId, scriptId }: { userId: string; scriptId: string }) => {
      const { error } = await supabase
        .from('user_scripts')
        .upsert({ user_id: userId, script_id: scriptId, is_active: true });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-user-scripts'] });
    },
  });

  const removeAssignment = useMutation({
    mutationFn: async ({ userId, scriptId }: { userId: string; scriptId: string }) => {
      const { error } = await supabase
        .from('user_scripts')
        .delete()
        .eq('user_id', userId)
        .eq('script_id', scriptId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-user-scripts'] });
    },
  });

  return {
    allUserScripts: allUserScripts ?? [],
    isLoading,
    error,
    assignScript: assignScript.mutateAsync,
    removeAssignment: removeAssignment.mutateAsync,
    isAssigning: assignScript.isPending,
    isRemoving: removeAssignment.isPending,
  };
}
