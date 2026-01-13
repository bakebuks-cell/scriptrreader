import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface PineScript {
  id: string;
  name: string;
  description: string | null;
  script_content: string;
  symbol: string;
  webhook_secret: string;
  is_active: boolean;
  allowed_timeframes: string[];
  admin_tag: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePineScriptInput {
  name: string;
  description?: string;
  script_content: string;
  symbol: string;
  allowed_timeframes: string[];
  is_active?: boolean;
}

// User hook - sees only their own scripts
export function usePineScripts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: scripts, isLoading, error } = useQuery({
    queryKey: ['pine-scripts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('pine_scripts')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PineScript[];
    },
    enabled: !!user?.id,
  });

  const createScript = useMutation({
    mutationFn: async (input: CreatePineScriptInput) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('pine_scripts')
        .insert({ ...input, created_by: user.id })
        .select()
        .single();

      if (error) throw error;
      return data as PineScript;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pine-scripts', user?.id] });
    },
  });

  const updateScript = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PineScript> & { id: string }) => {
      const { data, error } = await supabase
        .from('pine_scripts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as PineScript;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pine-scripts', user?.id] });
    },
  });

  const deleteScript = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pine_scripts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pine-scripts', user?.id] });
    },
  });

  return {
    scripts: scripts ?? [],
    isLoading,
    error,
    createScript: createScript.mutateAsync,
    updateScript: updateScript.mutateAsync,
    deleteScript: deleteScript.mutateAsync,
    isCreating: createScript.isPending,
    isUpdating: updateScript.isPending,
    isDeleting: deleteScript.isPending,
  };
}

// Admin hook - sees ALL scripts from all users
export function useAdminPineScripts() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const { data: scripts, isLoading, error } = useQuery({
    queryKey: ['admin-pine-scripts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pine_scripts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PineScript[];
    },
    enabled: isAdmin,
  });

  const updateScript = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PineScript> & { id: string }) => {
      const { data, error } = await supabase
        .from('pine_scripts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as PineScript;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pine-scripts'] });
    },
  });

  return {
    scripts: scripts ?? [],
    isLoading,
    error,
    updateScript: updateScript.mutateAsync,
    isUpdating: updateScript.isPending,
  };
}
