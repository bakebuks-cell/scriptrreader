-- Update pine_scripts table to support user-created scripts
-- Add admin_tag column for admins to tag scripts
ALTER TABLE public.pine_scripts ADD COLUMN IF NOT EXISTS admin_tag text;

-- Drop existing restrictive RLS policy
DROP POLICY IF EXISTS "Admins can manage pine scripts" ON public.pine_scripts;

-- Create new RLS policies that allow users to manage their own scripts
CREATE POLICY "Users can create own scripts"
ON public.pine_scripts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can view own scripts"
ON public.pine_scripts
FOR SELECT
TO authenticated
USING (auth.uid() = created_by OR is_admin(auth.uid()));

CREATE POLICY "Users can update own scripts"
ON public.pine_scripts
FOR UPDATE
TO authenticated
USING (auth.uid() = created_by OR is_admin(auth.uid()));

CREATE POLICY "Users can delete own scripts"
ON public.pine_scripts
FOR DELETE
TO authenticated
USING (auth.uid() = created_by OR is_admin(auth.uid()));

-- Allow users to manage their own user_scripts (attach scripts to bot)
DROP POLICY IF EXISTS "Users can view own script assignments" ON public.user_scripts;
CREATE POLICY "Users can manage own script assignments"
ON public.user_scripts
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);