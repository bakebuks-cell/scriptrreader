
-- 1. Sessions table for multi-device session management
CREATE TABLE public.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text NOT NULL UNIQUE,
  device_info text,
  ip_address text,
  login_time timestamptz NOT NULL DEFAULT now(),
  last_activity_time timestamptz NOT NULL DEFAULT now(),
  expiry_time timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  session_status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions" ON public.user_sessions
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own sessions" ON public.user_sessions
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own sessions" ON public.user_sessions
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can delete own sessions" ON public.user_sessions
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all sessions" ON public.user_sessions
  FOR ALL TO authenticated USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Index for fast lookups
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_session_id ON public.user_sessions(session_id);

-- 2. Add pnl and trade_amount_used to trades table
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS pnl numeric DEFAULT NULL;
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS trade_amount_used numeric DEFAULT NULL;

-- 3. User trading defaults table (separate from profiles)
CREATE TABLE public.user_trading_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  default_margin numeric NOT NULL DEFAULT 10,
  default_leverage integer NOT NULL DEFAULT 10,
  default_trade_amount numeric NOT NULL DEFAULT 100,
  default_stop_loss numeric DEFAULT NULL,
  default_take_profit numeric DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_trading_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trading settings" ON public.user_trading_settings
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own trading settings" ON public.user_trading_settings
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own trading settings" ON public.user_trading_settings
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all trading settings" ON public.user_trading_settings
  FOR ALL TO authenticated USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 4. Session mode setting in a config table
CREATE TABLE public.session_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  multi_device_enabled boolean NOT NULL DEFAULT true,
  max_sessions_per_user integer NOT NULL DEFAULT 5,
  session_timeout_hours integer NOT NULL DEFAULT 168,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.session_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read session config" ON public.session_config
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage session config" ON public.session_config
  FOR ALL TO authenticated USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Insert default config
INSERT INTO public.session_config (multi_device_enabled, max_sessions_per_user, session_timeout_hours)
VALUES (true, 5, 168);

-- 5. Function to validate and create sessions
CREATE OR REPLACE FUNCTION public.create_user_session(
  _user_id uuid,
  _device_info text DEFAULT NULL,
  _ip_address text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _config session_config%ROWTYPE;
  _session_id text;
  _active_count integer;
  _result jsonb;
BEGIN
  -- Get config
  SELECT * INTO _config FROM session_config LIMIT 1;
  
  -- Generate unique session ID
  _session_id := gen_random_uuid()::text;
  
  -- Check active sessions count
  SELECT COUNT(*) INTO _active_count
  FROM user_sessions
  WHERE user_id = _user_id AND session_status = 'active' AND expiry_time > now();
  
  -- If single-session mode, revoke all existing sessions
  IF NOT _config.multi_device_enabled THEN
    UPDATE user_sessions
    SET session_status = 'revoked'
    WHERE user_id = _user_id AND session_status = 'active';
  ELSIF _active_count >= _config.max_sessions_per_user THEN
    -- Revoke oldest session if at max
    UPDATE user_sessions
    SET session_status = 'revoked'
    WHERE id = (
      SELECT id FROM user_sessions
      WHERE user_id = _user_id AND session_status = 'active'
      ORDER BY login_time ASC LIMIT 1
    );
  END IF;
  
  -- Create new session
  INSERT INTO user_sessions (user_id, session_id, device_info, ip_address, expiry_time)
  VALUES (
    _user_id,
    _session_id,
    _device_info,
    _ip_address,
    now() + (_config.session_timeout_hours || ' hours')::interval
  );
  
  _result := jsonb_build_object(
    'session_id', _session_id,
    'expiry_time', (now() + (_config.session_timeout_hours || ' hours')::interval)::text
  );
  
  RETURN _result;
END;
$$;

-- 6. Function to validate a session
CREATE OR REPLACE FUNCTION public.validate_session(_user_id uuid, _session_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _session user_sessions%ROWTYPE;
BEGIN
  SELECT * INTO _session
  FROM user_sessions
  WHERE user_id = _user_id AND session_id = _session_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'SESSION_NOT_FOUND');
  END IF;
  
  IF _session.session_status = 'revoked' THEN
    RETURN jsonb_build_object('valid', false, 'error', 'SESSION_REVOKED');
  END IF;
  
  IF _session.expiry_time < now() THEN
    UPDATE user_sessions SET session_status = 'expired' WHERE id = _session.id;
    RETURN jsonb_build_object('valid', false, 'error', 'SESSION_EXPIRED');
  END IF;
  
  -- Update last activity
  UPDATE user_sessions SET last_activity_time = now() WHERE id = _session.id;
  
  RETURN jsonb_build_object('valid', true, 'error', null);
END;
$$;

-- Auto-create trading settings for new users via trigger
CREATE OR REPLACE FUNCTION public.handle_new_user_trading_settings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_trading_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_trading_settings
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_trading_settings();
