
-- Add soft-delete column to pine_scripts
ALTER TABLE public.pine_scripts ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Allow admins full access to pine_scripts (they need to see all users' scripts including deleted)
CREATE POLICY "Admins can view all scripts"
ON public.pine_scripts
FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update all scripts"
ON public.pine_scripts
FOR UPDATE
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete all scripts"
ON public.pine_scripts
FOR DELETE
USING (is_admin(auth.uid()));
