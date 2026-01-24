-- Create wallet role enum
CREATE TYPE public.wallet_role AS ENUM ('ADMIN', 'USER');

-- Create wallets table with role-based ownership
CREATE TABLE public.wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role wallet_role NOT NULL DEFAULT 'USER',
  name TEXT NOT NULL DEFAULT 'My Wallet',
  exchange TEXT NOT NULL DEFAULT 'binance',
  api_key_encrypted TEXT,
  api_secret_encrypted TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  total_balance_usdt NUMERIC DEFAULT 0,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraint: USER wallets MUST have a user_id
  CONSTRAINT user_wallet_requires_user_id CHECK (
    (role = 'ADMIN') OR (role = 'USER' AND user_id IS NOT NULL)
  )
);

-- Enable RLS
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can ONLY see their OWN USER role wallets
-- This is the critical security policy - users NEVER see admin wallets
CREATE POLICY "Users can view only their own USER wallets"
  ON public.wallets
  FOR SELECT
  USING (
    role = 'USER' 
    AND user_id = auth.uid()
  );

-- RLS Policy: Admins can see ALL wallets (both ADMIN and USER)
CREATE POLICY "Admins can view all wallets"
  ON public.wallets
  FOR SELECT
  USING (
    public.is_admin(auth.uid())
  );

-- RLS Policy: Users can only insert their own USER wallets
CREATE POLICY "Users can create own USER wallets"
  ON public.wallets
  FOR INSERT
  WITH CHECK (
    role = 'USER'
    AND user_id = auth.uid()
  );

-- RLS Policy: Admins can insert any wallet
CREATE POLICY "Admins can create any wallet"
  ON public.wallets
  FOR INSERT
  WITH CHECK (
    public.is_admin(auth.uid())
  );

-- RLS Policy: Users can update only their own USER wallets
CREATE POLICY "Users can update own USER wallets"
  ON public.wallets
  FOR UPDATE
  USING (
    role = 'USER'
    AND user_id = auth.uid()
  );

-- RLS Policy: Admins can update any wallet
CREATE POLICY "Admins can update any wallet"
  ON public.wallets
  FOR UPDATE
  USING (
    public.is_admin(auth.uid())
  );

-- RLS Policy: Users can delete only their own USER wallets
CREATE POLICY "Users can delete own USER wallets"
  ON public.wallets
  FOR DELETE
  USING (
    role = 'USER'
    AND user_id = auth.uid()
  );

-- RLS Policy: Admins can delete any wallet
CREATE POLICY "Admins can delete any wallet"
  ON public.wallets
  FOR DELETE
  USING (
    public.is_admin(auth.uid())
  );

-- Add updated_at trigger
CREATE TRIGGER update_wallets_updated_at
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing exchange_keys to wallets table
INSERT INTO public.wallets (user_id, role, name, exchange, api_key_encrypted, api_secret_encrypted, is_active, created_at, updated_at)
SELECT 
  user_id,
  'USER'::wallet_role,
  'Binance Wallet',
  exchange,
  api_key_encrypted,
  api_secret_encrypted,
  is_active,
  created_at,
  updated_at
FROM public.exchange_keys;

-- Create index for faster queries
CREATE INDEX idx_wallets_user_id ON public.wallets(user_id);
CREATE INDEX idx_wallets_role ON public.wallets(role);
CREATE INDEX idx_wallets_user_role ON public.wallets(user_id, role);