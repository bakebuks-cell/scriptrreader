
-- Strategy state table for central scheduler
CREATE TABLE public.strategy_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  script_id uuid NOT NULL,
  symbol text NOT NULL,
  timeframe text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  last_checked_time timestamptz,
  next_check_time timestamptz DEFAULT now(),
  last_data_update_time timestamptz,
  last_processed_candle_time bigint DEFAULT 0,
  last_signal_time timestamptz,
  last_signal_side text DEFAULT 'NONE',
  last_order_time timestamptz,
  last_successful_api_fetch_time timestamptz,
  last_failed_api_fetch_time timestamptz,
  signal_lock_status text DEFAULT 'UNLOCKED',
  last_execution_candle_time bigint DEFAULT 0,
  execution_count integer DEFAULT 0,
  error_count integer DEFAULT 0,
  consecutive_errors integer DEFAULT 0,
  last_error text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, script_id, symbol, timeframe)
);

ALTER TABLE public.strategy_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all strategy states"
  ON public.strategy_state FOR ALL TO authenticated
  USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Users can view own strategy states"
  ON public.strategy_state FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX idx_strategy_state_due ON public.strategy_state (next_check_time, status) WHERE status = 'active';

-- Market data cache table
CREATE TABLE public.market_data_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol text NOT NULL,
  timeframe text NOT NULL,
  latest_candle_time bigint DEFAULT 0,
  current_price numeric,
  candle_count integer DEFAULT 0,
  data_payload jsonb,
  fetched_at timestamptz DEFAULT now(),
  cache_expiry_time timestamptz,
  fetch_status text DEFAULT 'SUCCESS',
  fetch_duration_ms integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(symbol, timeframe)
);

ALTER TABLE public.market_data_cache ENABLE ROW LEVEL SECURITY;
