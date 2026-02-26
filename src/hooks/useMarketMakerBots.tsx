import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface MarketMakerBot {
  id: string;
  user_id: string;
  name: string;
  is_active: boolean;
  auto_stop_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BotConfiguration {
  id: string;
  bot_id: string;
  user_id: string;
  module_type: string;
  settings_json: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type ModuleType = 
  | 'basic_settings' 
  | 'exchange' 
  | 'notifications' 
  | 'market_pricing' 
  | 'order_layers'
  | 'autocancel' 
  | 'stop_loss' 
  | 'revert_backlog'
  | 'risk_control';

export function useMarketMakerBots() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all bots for the user
  const { data: bots = [], isLoading: botsLoading } = useQuery({
    queryKey: ['market-maker-bots', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('market_maker_bots')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as MarketMakerBot[];
    },
    enabled: !!user?.id,
  });

  // Create a new bot
  const createBot = useMutation({
    mutationFn: async (name: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('market_maker_bots')
        .insert({ user_id: user.id, name })
        .select()
        .single();
      
      if (error) throw error;
      return data as MarketMakerBot;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-maker-bots'] });
      toast({ title: 'Bot Created', description: 'Your Market Maker bot has been created.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Update a bot
  const updateBot = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MarketMakerBot> & { id: string }) => {
      const { data, error } = await supabase
        .from('market_maker_bots')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as MarketMakerBot;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-maker-bots'] });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Delete a bot
  const deleteBot = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('market_maker_bots')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-maker-bots'] });
      toast({ title: 'Bot Deleted', description: 'Your bot has been deleted.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return {
    bots,
    botsLoading,
    createBot,
    updateBot,
    deleteBot,
  };
}

export function useBotConfiguration(botId: string | null) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all configurations for a bot
  const { data: configurations = [], isLoading: configLoading } = useQuery({
    queryKey: ['bot-configurations', botId],
    queryFn: async () => {
      if (!botId) return [];
      const { data, error } = await supabase
        .from('bot_configurations')
        .select('*')
        .eq('bot_id', botId);
      
      if (error) throw error;
      return data as BotConfiguration[];
    },
    enabled: !!botId,
  });

  // Get configuration for a specific module
  const getModuleConfig = (moduleType: ModuleType): Record<string, unknown> => {
    const config = configurations.find(c => c.module_type === moduleType);
    return config?.settings_json ?? {};
  };

  // Save or update configuration for a module
  const saveConfig = useMutation({
    mutationFn: async ({ 
      moduleType, 
      settings 
    }: { 
      moduleType: ModuleType; 
      settings: Record<string, unknown> 
    }) => {
      if (!botId || !user?.id) throw new Error('Bot or user not found');
      
      const existingConfig = configurations.find(c => c.module_type === moduleType);
      
      // Cast settings to Json type for Supabase
      const jsonSettings = settings as unknown as import('@/integrations/supabase/types').Json;
      
      if (existingConfig) {
        const { data, error } = await supabase
          .from('bot_configurations')
          .update({ settings_json: jsonSettings })
          .eq('id', existingConfig.id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('bot_configurations')
          .insert([{
            bot_id: botId,
            user_id: user.id,
            module_type: moduleType,
            settings_json: jsonSettings,
          }])
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bot-configurations', botId] });
      toast({ title: 'Saved', description: 'Configuration saved successfully.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return {
    configurations,
    configLoading,
    getModuleConfig,
    saveConfig,
  };
}
