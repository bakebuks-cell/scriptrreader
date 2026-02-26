
-- 1. Subscription settings (single-row config)
CREATE TABLE public.subscription_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_mode_enabled boolean NOT NULL DEFAULT false,
  crypto_name text NOT NULL DEFAULT 'USDT',
  crypto_symbol text NOT NULL DEFAULT 'USDT',
  crypto_decimals integer NOT NULL DEFAULT 6,
  receiver_wallet_address text NOT NULL DEFAULT '',
  trial_days integer NOT NULL DEFAULT 7,
  monthly_amount numeric NOT NULL DEFAULT 30,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read subscription settings"
  ON public.subscription_settings FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admins can manage subscription settings"
  ON public.subscription_settings FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Seed one row
INSERT INTO public.subscription_settings (id) VALUES (gen_random_uuid());

-- Trigger for updated_at
CREATE TRIGGER update_subscription_settings_updated_at
  BEFORE UPDATE ON public.subscription_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Lifetime free emails
CREATE TABLE public.lifetime_free_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lifetime_free_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage lifetime free emails"
  ON public.lifetime_free_emails FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Authenticated can read lifetime free emails"
  ON public.lifetime_free_emails FOR SELECT
  TO authenticated USING (true);

-- 3. Payment requests
CREATE TABLE public.payment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tx_hash text NOT NULL,
  amount numeric NOT NULL,
  crypto_symbol text NOT NULL DEFAULT 'USDT',
  wallet_address text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'PENDING',
  admin_notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  subscription_starts_at timestamptz,
  subscription_ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment requests"
  ON public.payment_requests FOR SELECT
  TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can create own payment requests"
  ON public.payment_requests FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all payment requests"
  ON public.payment_requests FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER update_payment_requests_updated_at
  BEFORE UPDATE ON public.payment_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Add access control columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS feature_access boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS login_access boolean NOT NULL DEFAULT true;
