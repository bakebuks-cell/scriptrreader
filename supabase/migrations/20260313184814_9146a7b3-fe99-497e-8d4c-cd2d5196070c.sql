
CREATE TABLE public.engine_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  log_type text NOT NULL DEFAULT 'INFO',
  category text NOT NULL DEFAULT 'GENERAL',
  user_id uuid,
  script_id uuid,
  symbol text,
  timeframe text,
  message text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  resolved boolean NOT NULL DEFAULT false,
  resolved_at timestamptz,
  resolved_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_engine_logs_category ON public.engine_logs(category);
CREATE INDEX idx_engine_logs_created_at ON public.engine_logs(created_at DESC);
CREATE INDEX idx_engine_logs_log_type ON public.engine_logs(log_type);
CREATE INDEX idx_engine_logs_resolved ON public.engine_logs(resolved);

ALTER TABLE public.engine_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all engine logs"
  ON public.engine_logs
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
