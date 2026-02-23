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
  deleted_at: string | null;
  // Bot configuration fields
  candle_type: string;
  market_type: string;
  trading_pairs: string[];
  multi_pair_mode: boolean;
  position_size_type: string;
  position_size_value: number;
  leverage: number;
  max_trades_per_day: number;
  // Validation fields
  validation_status: string;
  validation_errors: string[];
}

// Extended with per-user activation state
export interface PineScriptWithUserState extends PineScript {
  user_is_active: boolean; // per-user activation state (from user_scripts)
  user_script_id: string | null; // user_scripts row id
}

export interface CreatePineScriptInput {
  name: string;
  description?: string;
  script_content: string;
  symbol: string;
  allowed_timeframes: string[];
  is_active?: boolean;
  candle_type?: string;
  market_type?: string;
  trading_pairs?: string[];
  multi_pair_mode?: boolean;
  position_size_type?: string;
  position_size_value?: number;
  leverage?: number;
  max_trades_per_day?: number;
}

// User hook - sees own scripts AND admin scripts (read-only for admin scripts)
// Uses user_scripts table for per-user activation of Common Library scripts
export function usePineScripts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all scripts user can see
  const { data: scripts, isLoading: scriptsLoading } = useQuery({
    queryKey: ['pine-scripts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('pine_scripts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PineScript[];
    },
    enabled: !!user?.id,
  });

  // Fetch user's per-user activation records
  const { data: userScriptRecords, isLoading: userScriptsLoading } = useQuery({
    queryKey: ['user-scripts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('user_scripts')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const isLoading = scriptsLoading || userScriptsLoading;

  // Build admin scripts with per-user activation state
  // Admin/Common Library scripts: any script with admin_tag, regardless of who created it
  const adminScripts: PineScriptWithUserState[] = (scripts ?? [])
    .filter(s => s.admin_tag !== null)
    .map(s => {
      const userRecord = userScriptRecords?.find(us => us.script_id === s.id);
      // Apply user-specific overrides from settings_json
      const userSettings = (userRecord as any)?.settings_json || {};
      return {
        ...s,
        // Override with user settings if they exist
        ...(userSettings.leverage !== undefined && { leverage: userSettings.leverage }),
        ...(userSettings.trading_pairs !== undefined && { trading_pairs: userSettings.trading_pairs }),
        ...(userSettings.allowed_timeframes !== undefined && { allowed_timeframes: userSettings.allowed_timeframes }),
        ...(userSettings.market_type !== undefined && { market_type: userSettings.market_type }),
        ...(userSettings.position_size_value !== undefined && { position_size_value: userSettings.position_size_value }),
        ...(userSettings.max_trades_per_day !== undefined && { max_trades_per_day: userSettings.max_trades_per_day }),
        ...(userSettings.trade_mechanism !== undefined && { trade_mechanism: userSettings.trade_mechanism }),
        user_is_active: userRecord?.is_active ?? false,
        user_script_id: userRecord?.id ?? null,
      };
    });

  // Own scripts use their native is_active (exclude soft-deleted)
  // Own scripts: user-created, no admin_tag, not soft-deleted
  // Merge settings from user_scripts (e.g. trade_mechanism) if a record exists
  const ownScripts: PineScriptWithUserState[] = (scripts ?? [])
    .filter(s => s.created_by === user?.id && !s.deleted_at && s.admin_tag === null)
    .map(s => {
      const userRecord = userScriptRecords?.find(us => us.script_id === s.id);
      const userSettings = (userRecord as any)?.settings_json || {};
      return {
        ...s,
        // Apply user_scripts settings (trade_mechanism, etc.)
        ...(userSettings.trade_mechanism !== undefined && { trade_mechanism: userSettings.trade_mechanism }),
        user_is_active: s.is_active,
        user_script_id: userRecord?.id ?? null,
      };
    });

  const createScript = useMutation({
    mutationFn: async (input: CreatePineScriptInput) => {
      if (!user?.id) throw new Error('Not authenticated');

      const cleanInput = {
        name: input.name,
        script_content: input.script_content,
        symbol: input.symbol,
        allowed_timeframes: input.allowed_timeframes,
        is_active: input.is_active ?? false,
        description: input.description || null,
        candle_type: input.candle_type || 'regular',
        market_type: input.market_type || 'spot',
        trading_pairs: input.trading_pairs || [input.symbol],
        multi_pair_mode: input.multi_pair_mode ?? false,
        position_size_type: input.position_size_type || 'fixed',
        position_size_value: input.position_size_value || 100,
        leverage: input.leverage || 1,
        max_trades_per_day: input.max_trades_per_day || 10,
        created_by: user.id,
      };

      const { data, error } = await supabase
        .from('pine_scripts')
        .insert(cleanInput)
        .select();

      if (error) {
        console.error('Script creation error:', error);
        throw new Error(error.message || 'Failed to create script');
      }
      
      if (!data || data.length === 0) {
        throw new Error('Script was not created');
      }

      // Validate script content server-side
      const script = data[0] as PineScript;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const validateUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pine-script-engine?action=validate-script`;
        await fetch(validateUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || ''}`,
          },
          body: JSON.stringify({ scriptContent: input.script_content, scriptId: script.id }),
        });
      } catch (valErr) {
        console.warn('[VALIDATE] Server validation call failed:', valErr);
      }
      
      return script;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pine-scripts', user?.id] });
    },
  });

  const updateScript = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PineScript> & { id: string }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const script = scripts?.find(s => s.id === id);
      
      // For admin/common scripts (any script with admin_tag), save user settings to user_scripts.settings_json
      if (script && script.admin_tag !== null) {
        const userSettings: Record<string, any> = {};
        if (updates.leverage !== undefined) userSettings.leverage = updates.leverage;
        if (updates.trading_pairs !== undefined) userSettings.trading_pairs = updates.trading_pairs;
        if (updates.allowed_timeframes !== undefined) userSettings.allowed_timeframes = updates.allowed_timeframes;
        if (updates.market_type !== undefined) userSettings.market_type = updates.market_type;
        if (updates.position_size_value !== undefined) userSettings.position_size_value = updates.position_size_value;
        if (updates.max_trades_per_day !== undefined) userSettings.max_trades_per_day = updates.max_trades_per_day;
        if ((updates as any).trade_mechanism !== undefined) userSettings.trade_mechanism = (updates as any).trade_mechanism;

        const existingRecord = userScriptRecords?.find(us => us.script_id === id);
        if (existingRecord) {
          // Merge with existing settings
          const mergedSettings = { ...((existingRecord as any).settings_json || {}), ...userSettings };
          const { error } = await supabase
            .from('user_scripts')
            .update({ settings_json: mergedSettings })
            .eq('id', existingRecord.id);
          if (error) throw new Error(error.message);
        } else {
          // Create user_scripts record with settings
          const { error } = await supabase
            .from('user_scripts')
            .insert({ user_id: user.id, script_id: id, is_active: false, settings_json: userSettings });
          if (error) throw new Error(error.message);
        }
        return { ...script, ...userSettings } as PineScript;
      }

      // For own scripts, update pine_scripts directly
      const cleanUpdates: Record<string, any> = {};
      if (updates.name !== undefined) cleanUpdates.name = updates.name;
      if (updates.description !== undefined) cleanUpdates.description = updates.description || null;
      if (updates.script_content !== undefined) cleanUpdates.script_content = updates.script_content;
      if (updates.symbol !== undefined) cleanUpdates.symbol = updates.symbol;
      if (updates.allowed_timeframes !== undefined) cleanUpdates.allowed_timeframes = updates.allowed_timeframes;
      if (updates.is_active !== undefined) cleanUpdates.is_active = updates.is_active;
      if (updates.candle_type !== undefined) cleanUpdates.candle_type = updates.candle_type;
      if (updates.market_type !== undefined) cleanUpdates.market_type = updates.market_type;
      if (updates.trading_pairs !== undefined) cleanUpdates.trading_pairs = updates.trading_pairs;
      if (updates.multi_pair_mode !== undefined) cleanUpdates.multi_pair_mode = updates.multi_pair_mode;
      if (updates.position_size_type !== undefined) cleanUpdates.position_size_type = updates.position_size_type;
      if (updates.position_size_value !== undefined) cleanUpdates.position_size_value = updates.position_size_value;
      if (updates.leverage !== undefined) cleanUpdates.leverage = updates.leverage;
      if (updates.max_trades_per_day !== undefined) cleanUpdates.max_trades_per_day = updates.max_trades_per_day;

      const { data, error } = await supabase
        .from('pine_scripts')
        .update(cleanUpdates)
        .eq('id', id)
        .select();

      if (error) {
        console.error('Script update error:', error);
        throw new Error(error.message || 'Failed to update script');
      }
      
      if (!data || data.length === 0) {
        throw new Error('Script not found or update failed');
      }

      // Also save trade_mechanism to user_scripts.settings_json for user-created scripts
      const tradeMechanism = (updates as any).trade_mechanism;
      if (tradeMechanism !== undefined) {
        const existingRecord = userScriptRecords?.find(us => us.script_id === id);
        if (existingRecord) {
          const mergedSettings = { ...((existingRecord as any).settings_json || {}), trade_mechanism: tradeMechanism };
          const { error: updateErr } = await supabase
            .from('user_scripts')
            .update({ settings_json: mergedSettings })
            .eq('id', existingRecord.id);
          if (updateErr) {
            console.error('[SAVE] Failed to update trade_mechanism in user_scripts:', updateErr);
          } else {
            console.log(`[SAVE] Updated trade_mechanism=${tradeMechanism} for script ${id}`);
          }
        } else {
          // Create user_scripts record to store settings
          const { error: insertErr } = await supabase
            .from('user_scripts')
            .insert({ user_id: user.id, script_id: id, is_active: true, settings_json: { trade_mechanism: tradeMechanism } });
          if (insertErr) {
            console.error('[SAVE] Failed to insert trade_mechanism in user_scripts:', insertErr);
          } else {
            console.log(`[SAVE] Created user_scripts with trade_mechanism=${tradeMechanism} for script ${id}`);
          }
        }
      }

      // Re-validate if script_content changed
      if (updates.script_content !== undefined) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const validateUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pine-script-engine?action=validate-script`;
          await fetch(validateUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.access_token || ''}`,
            },
            body: JSON.stringify({ scriptContent: updates.script_content, scriptId: id }),
          });
        } catch (valErr) {
          console.warn('[VALIDATE] Server validation call failed:', valErr);
        }
      }
      
      return data[0] as PineScript;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pine-scripts', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-scripts', user?.id] });
    },
  });

  const deleteScript = useMutation({
    mutationFn: async (id: string) => {
      const script = scripts?.find(s => s.id === id);
      
      // For admin scripts, remove the user_scripts record (not the global script)
      if (script?.admin_tag !== null) {
        const { error } = await supabase
          .from('user_scripts')
          .delete()
          .eq('script_id', id)
          .eq('user_id', user!.id);
        if (error) {
          console.error('User script removal error:', error);
          throw new Error(error.message || 'Failed to remove script from library');
        }
        return id;
      }

      // For own scripts, soft-delete
      const { error } = await supabase
        .from('pine_scripts')
        .update({ deleted_at: new Date().toISOString(), is_active: false })
        .eq('id', id);
      if (error) {
        console.error('Script deletion error:', error);
        throw new Error(error.message || 'Failed to delete script');
      }
      return id;
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['pine-scripts', user?.id] });
      const previousScripts = queryClient.getQueryData(['pine-scripts', user?.id]);
      queryClient.setQueryData(['pine-scripts', user?.id], (old: PineScript[] | undefined) => 
        old ? old.filter(script => script.id !== id) : []
      );
      return { previousScripts };
    },
    onError: (err, id, context) => {
      if (context?.previousScripts) {
        queryClient.setQueryData(['pine-scripts', user?.id], context.previousScripts);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['pine-scripts', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-scripts', user?.id] });
    },
  });

  // Toggle activation - uses user_scripts for admin scripts, pine_scripts for own scripts
  const toggleActivation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const script = scripts?.find(s => s.id === id);
      if (!script) throw new Error('Script not found');
      if (!user?.id) throw new Error('Not authenticated');

      // For admin/company scripts - use user_scripts table for per-user state
      if (script.admin_tag !== null) {
        const existingRecord = userScriptRecords?.find(us => us.script_id === id);
        
        if (existingRecord) {
          // Update existing record
          const { error } = await supabase
            .from('user_scripts')
            .update({ is_active })
            .eq('id', existingRecord.id);
          if (error) throw error;
        } else {
          // Create new record
          const { error } = await supabase
            .from('user_scripts')
            .insert({ user_id: user.id, script_id: id, is_active });
          if (error) throw error;
        }
        return { id, is_active };
      }

      // For own scripts - update pine_scripts directly
      if (script.created_by !== user.id) {
        throw new Error('Cannot modify scripts you do not own');
      }

      const { error } = await supabase
        .from('pine_scripts')
        .update({ is_active })
        .eq('id', id)
        .select();

      if (error) throw error;
      return { id, is_active };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pine-scripts', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-scripts', user?.id] });
    },
  });

  // Helper functions
  const canEditScript = (script: PineScript) => {
    return script.created_by === user?.id && script.admin_tag === null;
  };

  const canToggleScript = (script: PineScript) => {
    return script.created_by === user?.id && script.admin_tag === null;
  };

  const isAdminScript = (script: PineScript) => {
    return script.admin_tag !== null;
  };

  return {
    scripts: scripts ?? [],
    ownScripts,
    adminScripts,
    isLoading,
    error: null,
    createScript: createScript.mutateAsync,
    updateScript: updateScript.mutateAsync,
    deleteScript: deleteScript.mutateAsync,
    toggleActivation: toggleActivation.mutateAsync,
    isCreating: createScript.isPending,
    isUpdating: updateScript.isPending,
    isDeleting: deleteScript.isPending,
    isToggling: toggleActivation.isPending,
    canEditScript,
    canToggleScript,
    isAdminScript,
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

  const adminScripts = scripts?.filter(s => s.admin_tag) ?? [];
  const allUserScripts = scripts?.filter(s => !s.admin_tag) ?? [];
  const activeUserScripts = allUserScripts.filter(s => s.is_active && !(s as any).deleted_at);
  const inactiveUserScripts = allUserScripts.filter(s => !s.is_active && !(s as any).deleted_at);
  const storedUserScripts = allUserScripts.filter(s => !!(s as any).deleted_at);
  // Keep backward compat
  const userScripts = allUserScripts.filter(s => !(s as any).deleted_at);

  const createAdminScript = useMutation({
    mutationFn: async (input: CreatePineScriptInput & { admin_tag?: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const cleanInput = {
        name: input.name,
        script_content: input.script_content,
        symbol: input.symbol,
        allowed_timeframes: input.allowed_timeframes,
        is_active: input.is_active ?? false,
        description: input.description || null,
        candle_type: input.candle_type || 'regular',
        market_type: input.market_type || 'spot',
        trading_pairs: input.trading_pairs || [input.symbol],
        multi_pair_mode: input.multi_pair_mode ?? false,
        position_size_type: input.position_size_type || 'fixed',
        position_size_value: input.position_size_value || 100,
        leverage: input.leverage || 1,
        max_trades_per_day: input.max_trades_per_day || 10,
        created_by: user.id,
        admin_tag: input.admin_tag || 'ADMIN',
      };

      const { data, error } = await supabase
        .from('pine_scripts')
        .insert(cleanInput)
        .select();

      if (error) {
        console.error('Admin script creation error:', error);
        throw new Error(error.message || 'Failed to create script');
      }
      
      if (!data || data.length === 0) {
        throw new Error('Script was not created');
      }
      
      return data[0] as PineScript;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pine-scripts'] });
    },
  });

  const updateScript = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PineScript> & { id: string }) => {
      const cleanUpdates: Record<string, any> = {};
      if (updates.name !== undefined) cleanUpdates.name = updates.name;
      if (updates.description !== undefined) cleanUpdates.description = updates.description || null;
      if (updates.script_content !== undefined) cleanUpdates.script_content = updates.script_content;
      if (updates.symbol !== undefined) cleanUpdates.symbol = updates.symbol;
      if (updates.allowed_timeframes !== undefined) cleanUpdates.allowed_timeframes = updates.allowed_timeframes;
      if (updates.is_active !== undefined) cleanUpdates.is_active = updates.is_active;
      if (updates.candle_type !== undefined) cleanUpdates.candle_type = updates.candle_type;
      if (updates.market_type !== undefined) cleanUpdates.market_type = updates.market_type;
      if (updates.trading_pairs !== undefined) cleanUpdates.trading_pairs = updates.trading_pairs;
      if (updates.multi_pair_mode !== undefined) cleanUpdates.multi_pair_mode = updates.multi_pair_mode;
      if (updates.position_size_type !== undefined) cleanUpdates.position_size_type = updates.position_size_type;
      if (updates.position_size_value !== undefined) cleanUpdates.position_size_value = updates.position_size_value;
      if (updates.leverage !== undefined) cleanUpdates.leverage = updates.leverage;
      if (updates.max_trades_per_day !== undefined) cleanUpdates.max_trades_per_day = updates.max_trades_per_day;

      const { data, error } = await supabase
        .from('pine_scripts')
        .update(cleanUpdates)
        .eq('id', id)
        .select();

      if (error) {
        console.error('Admin script update error:', error);
        throw new Error(error.message || 'Failed to update script');
      }
      
      if (!data || data.length === 0) {
        throw new Error('Script not found or update failed');
      }
      
      return data[0] as PineScript;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pine-scripts'] });
    },
  });

  const deleteScript = useMutation({
    mutationFn: async (id: string) => {
      const script = scripts?.find(s => s.id === id);
      // Soft-delete user scripts, hard-delete admin scripts
      if (script && !script.admin_tag) {
        const { error } = await supabase
          .from('pine_scripts')
          .update({ deleted_at: new Date().toISOString(), is_active: false })
          .eq('id', id);
        if (error) {
          console.error('Script soft-delete error:', error);
          throw new Error(error.message || 'Failed to archive script');
        }
      } else {
        const { error } = await supabase.from('pine_scripts').delete().eq('id', id);
        if (error) {
          console.error('Admin script deletion error:', error);
          throw new Error(error.message || 'Failed to delete script');
        }
      }
      return id;
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['admin-pine-scripts'] });
      const previousScripts = queryClient.getQueryData(['admin-pine-scripts']);
      queryClient.setQueryData(['admin-pine-scripts'], (old: PineScript[] | undefined) => 
        old ? old.filter(script => script.id !== id) : []
      );
      return { previousScripts };
    },
    onError: (err, id, context) => {
      if (context?.previousScripts) {
        queryClient.setQueryData(['admin-pine-scripts'], context.previousScripts);
      }
    },
    onSettled: () => {
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

  const toggleActivation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('pine_scripts')
        .update({ is_active })
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

  // Fetch all user_scripts records (per-user activation states)
  const { data: allUserScriptRecords, isLoading: userScriptRecordsLoading } = useQuery({
    queryKey: ['admin-all-user-scripts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_scripts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Fetch all profiles for user info
  const { data: allProfiles, isLoading: profilesLoading } = useQuery({
    queryKey: ['admin-all-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, email, display_name, bot_enabled')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Restore a soft-deleted script
  const restoreScript = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('pine_scripts')
        .update({ deleted_at: null })
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
    adminScripts,
    userScripts,
    activeUserScripts,
    inactiveUserScripts,
    storedUserScripts,
    allUserScriptRecords: allUserScriptRecords ?? [],
    allProfiles: allProfiles ?? [],
    isLoading: isLoading || userScriptRecordsLoading || profilesLoading,
    error,
    createAdminScript: createAdminScript.mutateAsync,
    updateScript: updateScript.mutateAsync,
    deleteScript: deleteScript.mutateAsync,
    copyScript: copyScript.mutateAsync,
    toggleActivation: toggleActivation.mutateAsync,
    restoreScript: restoreScript.mutateAsync,
    isCreating: createAdminScript.isPending,
    isUpdating: updateScript.isPending,
    isDeleting: deleteScript.isPending,
    isCopying: copyScript.isPending,
    isToggling: toggleActivation.isPending,
    isRestoring: restoreScript.isPending,
  };
}
