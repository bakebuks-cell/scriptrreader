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
}

export function usePineScripts() {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const { data: scripts, isLoading, error } = useQuery({
    queryKey: ['pine-scripts'],
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

  const createScript = useMutation({
    mutationFn: async (input: CreatePineScriptInput) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('pine_scripts')
        .insert({
          ...input,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as PineScript;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pine-scripts'] });
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
      queryClient.invalidateQueries({ queryKey: ['pine-scripts'] });
    },
  });

  const deleteScript = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pine_scripts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pine-scripts'] });
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
