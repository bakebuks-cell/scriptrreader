
CREATE TABLE public.tradingview_ohlc_collection (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol text NOT NULL,
  timeframe text NOT NULL,
  candle_time timestamptz NOT NULL,
  open numeric NOT NULL,
  high numeric NOT NULL,
  low numeric NOT NULL,
  close numeric NOT NULL,
  volume numeric,
  candle_type text NOT NULL DEFAULT 'regular',
  source text NOT NULL DEFAULT 'tradingview_webhook',
  raw_payload jsonb,
  received_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (symbol, timeframe, candle_time, candle_type)
);

CREATE INDEX idx_tv_ohlc_symbol_tf_time ON public.tradingview_ohlc_collection (symbol, timeframe, candle_time DESC);

ALTER TABLE public.tradingview_ohlc_collection ENABLE ROW LEVEL SECURITY;

-- Only admins can read the collected data
CREATE POLICY "Admins can read OHLC collection"
ON public.tradingview_ohlc_collection
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Only service role can insert (via edge function)
CREATE POLICY "Service role can insert OHLC"
ON public.tradingview_ohlc_collection
FOR INSERT
TO service_role
WITH CHECK (true);
