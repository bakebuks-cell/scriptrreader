-- Drop the conflicting trigger first, then the function
DROP TRIGGER IF EXISTS on_profile_created_assign_role ON public.profiles;
DROP FUNCTION IF EXISTS public.handle_admin_role_assignment() CASCADE;

-- Update handle_new_user to properly handle role assignment (single source of truth)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email);
  
  -- Check if admin email, then assign appropriate role
  IF public.is_admin_email(NEW.email) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;