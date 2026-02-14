-- Fix RLS policies on wallets table
-- The issue: multiple RESTRICTIVE policies for the same command ALL must pass,
-- causing conflicts for admin users. Fix: make the broad "manage" policies PERMISSIVE.

-- Drop the conflicting restrictive policies
DROP POLICY IF EXISTS "Admins can manage all wallets" ON public.wallets;
DROP POLICY IF EXISTS "Users can manage own wallets" ON public.wallets;

-- Recreate as PERMISSIVE so they work as OR conditions
CREATE POLICY "Admins can manage all wallets"
ON public.wallets
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Users can manage own wallets"
ON public.wallets
FOR ALL
USING ((user_id = auth.uid()) AND (role = 'USER'::wallet_role))
WITH CHECK ((user_id = auth.uid()) AND (role = 'USER'::wallet_role));
