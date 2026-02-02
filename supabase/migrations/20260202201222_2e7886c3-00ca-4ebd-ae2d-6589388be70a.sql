-- Create market maker bots table
CREATE TABLE public.market_maker_bots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'My Market Maker Bot',
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bot configurations table for storing all config sections
CREATE TABLE public.bot_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bot_id UUID NOT NULL REFERENCES public.market_maker_bots(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  module_type TEXT NOT NULL, -- 'basic_settings', 'exchange', 'notifications', 'market_pricing', 'autocancel', 'stop_loss', 'revert_backlog'
  settings_json JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(bot_id, module_type)
);

-- Enable Row Level Security
ALTER TABLE public.market_maker_bots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_configurations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for market_maker_bots
CREATE POLICY "Users can view own market maker bots" 
ON public.market_maker_bots 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can create own market maker bots" 
ON public.market_maker_bots 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own market maker bots" 
ON public.market_maker_bots 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own market maker bots" 
ON public.market_maker_bots 
FOR DELETE 
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all market maker bots" 
ON public.market_maker_bots 
FOR SELECT 
USING (is_admin(auth.uid()));

-- RLS Policies for bot_configurations
CREATE POLICY "Users can view own bot configurations" 
ON public.bot_configurations 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can create own bot configurations" 
ON public.bot_configurations 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own bot configurations" 
ON public.bot_configurations 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own bot configurations" 
ON public.bot_configurations 
FOR DELETE 
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all bot configurations" 
ON public.bot_configurations 
FOR SELECT 
USING (is_admin(auth.uid()));

-- Create trigger for updated_at on market_maker_bots
CREATE TRIGGER update_market_maker_bots_updated_at
BEFORE UPDATE ON public.market_maker_bots
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on bot_configurations
CREATE TRIGGER update_bot_configurations_updated_at
BEFORE UPDATE ON public.bot_configurations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();