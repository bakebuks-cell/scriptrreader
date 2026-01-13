-- Update admin_whitelist to use lowercase email for bakebuks@gmail.com
UPDATE admin_whitelist 
SET email = 'bakebuks@gmail.com'
WHERE LOWER(email) = 'bakebuks@gmail.com';

-- Make is_admin_email function case-insensitive
CREATE OR REPLACE FUNCTION public.is_admin_email(check_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_whitelist
    WHERE LOWER(email) = LOWER(check_email)
  );
END;
$$;

-- Clean up duplicate user roles (keep only the correct role based on admin status)
DELETE FROM user_roles ur1
USING user_roles ur2
WHERE ur1.user_id = ur2.user_id
  AND ur1.id < ur2.id;