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
  // Bot configuration fields
  candle_type: string;
  market_type: string;
  trading_pairs: string[];
  multi_pair_mode: boolean;
  position_size_type: string;
  position_size_value: number;
  max_capital: number;
  leverage: number;
  max_trades_per_day: number;
}

export interface CreatePineScriptInput {
  name: string;
  description?: string;
  script_content: string;
  symbol: string;
  allowed_timeframes: string[];
  is_active?: boolean;
  // Bot configuration fields
  candle_type?: string;
  market_type?: string;
  trading_pairs?: string[];
  multi_pair_mode?: boolean;
  position_size_type?: string;
  position_size_value?: number;
  max_capital?: number;
  leverage?: number;
  max_trades_per_day?: number;
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
  const { isAdmin, user } = useAuth();
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

  // Admin scripts (created by admin with admin_tag)
  const adminScripts = scripts?.filter(s => s.admin_tag) ?? [];
  const userScripts = scripts?.filter(s => !s.admin_tag) ?? [];

  const createAdminScript = useMutation({
    mutationFn: async (input: CreatePineScriptInput & { admin_tag?: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('pine_scripts')
        .insert({ 
          ...input, 
          created_by: user.id,
          admin_tag: input.admin_tag || 'ADMIN'
        })
        .select()
        .single();

      if (error) throw error;
      return data as PineScript;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pine-scripts'] });
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
      queryClient.invalidateQueries({ queryKey: ['admin-pine-scripts'] });
    },
  });

  const deleteScript = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pine_scripts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pine-scripts'] });
    },
  });

  const copyScript = useMutation({
    mutationFn: async (script: PineScript) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('pine_scripts')
        .insert({
          name: `${script.name} (Admin Copy)`,
          description: script.description,
          script_content: script.script_content,
          symbol: script.symbol,
          allowed_timeframes: script.allowed_timeframes,
          is_active: false,
          created_by: user.id,
          admin_tag: 'ADMIN_COPY'
        })
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
    adminScripts,
    userScripts,
    isLoading,
    error,
    createAdminScript: createAdminScript.mutateAsync,
    updateScript: updateScript.mutateAsync,
    deleteScript: deleteScript.mutateAsync,
    copyScript: copyScript.mutateAsync,
    isCreating: createAdminScript.isPending,
    isUpdating: updateScript.isPending,
    isDeleting: deleteScript.isPending,
    isCopying: copyScript.isPending,
  };
}
