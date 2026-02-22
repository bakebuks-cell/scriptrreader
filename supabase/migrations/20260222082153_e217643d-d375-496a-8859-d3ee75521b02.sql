
-- Add trade_mode column to profiles (global per user)
-- 'plain' = MODE A (2 signals: BUY/SELL with flip logic)
-- 'strategy' = MODE B (4 signals: BUY_OPEN/BUY_EXIT/SELL_OPEN/SELL_EXIT)
-- 'auto' = Auto-detect from script alert mapping
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS trade_mode text NOT NULL DEFAULT 'auto';

-- Add strategy_opposite_policy column
-- 'reject' = In strategy mode, reject BUY_OPEN when SHORT exists (and vice versa)
-- 'flip' = In strategy mode, close opposite then open new
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS strategy_opposite_policy text NOT NULL DEFAULT 'reject';
