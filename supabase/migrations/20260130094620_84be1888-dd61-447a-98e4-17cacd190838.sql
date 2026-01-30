-- Fix RLS policies to require authentication (not anonymous access)
-- This addresses the security warnings about anonymous access

-- admin_whitelist: Should be readable only by authenticated users checking admin status
DROP POLICY IF EXISTS "Anyone can read admin whitelist" ON public.admin_whitelist;
CREATE POLICY "Authenticated can read admin whitelist" 
ON public.admin_whitelist 
FOR SELECT 
TO authenticated
USING (true);

-- coin_audit_log: Restrict to authenticated users only
DROP POLICY IF EXISTS "Admins can view all coin audits" ON public.coin_audit_log;
DROP POLICY IF EXISTS "Users can view own coin audit" ON public.coin_audit_log;
CREATE POLICY "Admins can view all coin audits" 
ON public.coin_audit_log 
FOR SELECT 
TO authenticated
USING (public.is_admin(auth.uid()));
CREATE POLICY "Users can view own coin audit" 
ON public.coin_audit_log 
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

-- coin_requests: Restrict to authenticated users only  
DROP POLICY IF EXISTS "Admins can update coin requests" ON public.coin_requests;
DROP POLICY IF EXISTS "Admins can view all coin requests" ON public.coin_requests;
DROP POLICY IF EXISTS "Users can view own coin requests" ON public.coin_requests;
CREATE POLICY "Admins can update coin requests" 
ON public.coin_requests 
FOR UPDATE 
TO authenticated
USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can view all coin requests" 
ON public.coin_requests 
FOR SELECT 
TO authenticated
USING (public.is_admin(auth.uid()));
CREATE POLICY "Users can view own coin requests" 
ON public.coin_requests 
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

-- exchange_keys: Restrict to authenticated users only
DROP POLICY IF EXISTS "Admins can view all exchange keys" ON public.exchange_keys;
DROP POLICY IF EXISTS "Users can manage own exchange keys" ON public.exchange_keys;
CREATE POLICY "Admins can view all exchange keys" 
ON public.exchange_keys 
FOR SELECT 
TO authenticated
USING (public.is_admin(auth.uid()));
CREATE POLICY "Users can manage own exchange keys" 
ON public.exchange_keys 
FOR ALL 
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- feature_flags: Restrict to authenticated users only
DROP POLICY IF EXISTS "Admins can manage feature flags" ON public.feature_flags;
DROP POLICY IF EXISTS "All authenticated can read feature flags" ON public.feature_flags;
CREATE POLICY "Admins can manage feature flags" 
ON public.feature_flags 
FOR ALL 
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Authenticated can read feature flags" 
ON public.feature_flags 
FOR SELECT 
TO authenticated
USING (true);

-- pine_scripts: Restrict to authenticated users only
DROP POLICY IF EXISTS "Users can delete own scripts" ON public.pine_scripts;
DROP POLICY IF EXISTS "Users can update own scripts" ON public.pine_scripts;
DROP POLICY IF EXISTS "Users can view own and admin scripts" ON public.pine_scripts;
CREATE POLICY "Users can delete own scripts" 
ON public.pine_scripts 
FOR DELETE 
TO authenticated
USING (created_by = auth.uid());
CREATE POLICY "Users can update own scripts" 
ON public.pine_scripts 
FOR UPDATE 
TO authenticated
USING (created_by = auth.uid());
CREATE POLICY "Users can view own and admin scripts" 
ON public.pine_scripts 
FOR SELECT 
TO authenticated
USING (created_by = auth.uid() OR admin_tag IS NOT NULL);

-- profiles: Restrict to authenticated users only
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Admins can update all profiles" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (public.is_admin(auth.uid()));
CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (user_id = auth.uid());
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

-- script_reports: Restrict to authenticated users only
DROP POLICY IF EXISTS "Admins can delete reports" ON public.script_reports;
DROP POLICY IF EXISTS "Admins can update reports" ON public.script_reports;
DROP POLICY IF EXISTS "Admins can view all reports" ON public.script_reports;
DROP POLICY IF EXISTS "Users can view own reports" ON public.script_reports;
CREATE POLICY "Admins can delete reports" 
ON public.script_reports 
FOR DELETE 
TO authenticated
USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update reports" 
ON public.script_reports 
FOR UPDATE 
TO authenticated
USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can view all reports" 
ON public.script_reports 
FOR SELECT 
TO authenticated
USING (public.is_admin(auth.uid()));
CREATE POLICY "Users can view own reports" 
ON public.script_reports 
FOR SELECT 
TO authenticated
USING (reported_by = auth.uid());

-- signals: Restrict to authenticated users only
DROP POLICY IF EXISTS "Admins can manage all signals" ON public.signals;
DROP POLICY IF EXISTS "Users can view signals for their assigned scripts" ON public.signals;
CREATE POLICY "Admins can manage all signals" 
ON public.signals 
FOR ALL 
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Users can view signals for their assigned scripts" 
ON public.signals 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_scripts us 
    WHERE us.script_id = signals.script_id 
    AND us.user_id = auth.uid()
  )
);

-- trades: Restrict to authenticated users only
DROP POLICY IF EXISTS "Admins can manage all trades" ON public.trades;
DROP POLICY IF EXISTS "Admins can view all trades" ON public.trades;
DROP POLICY IF EXISTS "Users can view own trades" ON public.trades;
CREATE POLICY "Admins can manage all trades" 
ON public.trades 
FOR ALL 
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Users can view own trades" 
ON public.trades 
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

-- user_roles: Restrict to authenticated users only
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
CREATE POLICY "Admins can manage all roles" 
ON public.user_roles 
FOR ALL 
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Users can view own role" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

-- user_scripts: Restrict to authenticated users only
DROP POLICY IF EXISTS "Admins can manage all user scripts" ON public.user_scripts;
DROP POLICY IF EXISTS "Users can manage own script assignments" ON public.user_scripts;
CREATE POLICY "Admins can manage all user scripts" 
ON public.user_scripts 
FOR ALL 
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Users can manage own script assignments" 
ON public.user_scripts 
FOR ALL 
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- wallets: Restrict to authenticated users only
DROP POLICY IF EXISTS "Admins can manage all wallets" ON public.wallets;
DROP POLICY IF EXISTS "Users can manage own wallets" ON public.wallets;
CREATE POLICY "Admins can manage all wallets" 
ON public.wallets 
FOR ALL 
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Users can manage own wallets" 
ON public.wallets 
FOR ALL 
TO authenticated
USING (user_id = auth.uid() AND role = 'USER')
WITH CHECK (user_id = auth.uid() AND role = 'USER');