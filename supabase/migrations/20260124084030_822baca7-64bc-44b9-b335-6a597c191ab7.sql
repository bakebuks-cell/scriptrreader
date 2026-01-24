-- Add bot configuration columns to pine_scripts table
ALTER TABLE public.pine_scripts
ADD COLUMN IF NOT EXISTS candle_type TEXT DEFAULT 'regular' CHECK (candle_type IN ('regular', 'heikin_ashi')),
ADD COLUMN IF NOT EXISTS market_type TEXT DEFAULT 'spot' CHECK (market_type IN ('spot', 'usdt_futures', 'coin_futures')),
ADD COLUMN IF NOT EXISTS trading_pairs TEXT[] DEFAULT ARRAY['BTCUSDT'],
ADD COLUMN IF NOT EXISTS multi_pair_mode BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS position_size_type TEXT DEFAULT 'fixed' CHECK (position_size_type IN ('fixed', 'percentage')),
ADD COLUMN IF NOT EXISTS position_size_value DECIMAL(18, 8) DEFAULT 100,
ADD COLUMN IF NOT EXISTS max_capital DECIMAL(18, 8) DEFAULT 1000,
ADD COLUMN IF NOT EXISTS leverage INTEGER DEFAULT 1 CHECK (leverage >= 1 AND leverage <= 125),
ADD COLUMN IF NOT EXISTS max_trades_per_day INTEGER DEFAULT 10 CHECK (max_trades_per_day >= 1 AND max_trades_per_day <= 100);

-- Add comments for documentation
COMMENT ON COLUMN public.pine_scripts.candle_type IS 'Type of candles: regular or heikin_ashi';
COMMENT ON COLUMN public.pine_scripts.market_type IS 'Market type: spot, usdt_futures, coin_futures';
COMMENT ON COLUMN public.pine_scripts.trading_pairs IS 'Array of trading pairs for this strategy';
COMMENT ON COLUMN public.pine_scripts.multi_pair_mode IS 'Whether to trade multiple pairs simultaneously';
COMMENT ON COLUMN public.pine_scripts.position_size_type IS 'Position sizing method: fixed amount or percentage';
COMMENT ON COLUMN public.pine_scripts.position_size_value IS 'Position size value (amount in USDT or percentage)';
COMMENT ON COLUMN public.pine_scripts.max_capital IS 'Maximum capital limit per bot';
COMMENT ON COLUMN public.pine_scripts.leverage IS 'Leverage for futures trading (1-125)';
COMMENT ON COLUMN public.pine_scripts.max_trades_per_day IS 'Maximum number of trades allowed per day';