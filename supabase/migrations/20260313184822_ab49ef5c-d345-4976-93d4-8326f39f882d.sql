
CREATE POLICY "Service role can insert engine logs"
  ON public.engine_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);
