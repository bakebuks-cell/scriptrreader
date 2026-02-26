
-- Add auto_stop_at column to market_maker_bots
ALTER TABLE public.market_maker_bots
ADD COLUMN auto_stop_at timestamp with time zone DEFAULT NULL;
