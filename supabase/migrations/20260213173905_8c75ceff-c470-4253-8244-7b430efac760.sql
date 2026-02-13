
-- Add free_trades_remaining column to profiles (5 free trades for every user)
ALTER TABLE public.profiles
ADD COLUMN free_trades_remaining integer NOT NULL DEFAULT 5;

-- Update existing profiles to have 5 free trades
UPDATE public.profiles SET free_trades_remaining = 5 WHERE free_trades_remaining = 0;
