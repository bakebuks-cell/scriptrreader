
-- Add subscription_active column to profiles (default true = unlimited for now)
ALTER TABLE public.profiles ADD COLUMN subscription_active boolean NOT NULL DEFAULT true;
