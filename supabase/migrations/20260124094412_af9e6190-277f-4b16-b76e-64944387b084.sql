-- Update RLS policy for pine_scripts to allow users to see admin scripts
-- First drop the existing SELECT policy for users
DROP POLICY IF EXISTS "Users can view own scripts" ON public.pine_scripts;

-- Create new SELECT policy: Users can see their own scripts OR admin scripts (where admin_tag IS NOT NULL)
CREATE POLICY "Users can view own and admin scripts"
ON public.pine_scripts
FOR SELECT
USING (
  auth.uid() = created_by 
  OR admin_tag IS NOT NULL 
  OR is_admin(auth.uid())
);

-- Update the UPDATE policy to ensure users can only update their own non-admin scripts
DROP POLICY IF EXISTS "Users can update own scripts" ON public.pine_scripts;

CREATE POLICY "Users can update own scripts"
ON public.pine_scripts
FOR UPDATE
USING (
  (auth.uid() = created_by AND admin_tag IS NULL)
  OR is_admin(auth.uid())
);

-- Update the DELETE policy similarly
DROP POLICY IF EXISTS "Users can delete own scripts" ON public.pine_scripts;

CREATE POLICY "Users can delete own scripts"
ON public.pine_scripts
FOR DELETE
USING (
  (auth.uid() = created_by AND admin_tag IS NULL)
  OR is_admin(auth.uid())
);