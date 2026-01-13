-- Coin Requests Table for user coin request system
CREATE TABLE public.coin_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    requested_coins integer NOT NULL DEFAULT 5,
    reason text,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes text,
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on coin_requests
ALTER TABLE public.coin_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "Users can view own coin requests"
ON public.coin_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own requests
CREATE POLICY "Users can create coin requests"
ON public.coin_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all requests
CREATE POLICY "Admins can view all coin requests"
ON public.coin_requests
FOR SELECT
USING (is_admin(auth.uid()));

-- Admins can update all requests
CREATE POLICY "Admins can update coin requests"
ON public.coin_requests
FOR UPDATE
USING (is_admin(auth.uid()));

-- Create admin whitelist table to store permanent admin emails
CREATE TABLE public.admin_whitelist (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text NOT NULL UNIQUE,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Insert permanent admin emails
INSERT INTO public.admin_whitelist (email) VALUES 
    ('piyushjunghare635@gmail.com'),
    ('Bakebuks@gmail.com');

-- Enable RLS on admin_whitelist (read-only for security functions)
ALTER TABLE public.admin_whitelist ENABLE ROW LEVEL SECURITY;

-- Only allow reading for checking whitelist
CREATE POLICY "Anyone can read admin whitelist"
ON public.admin_whitelist
FOR SELECT
USING (true);

-- Function to check if email is in admin whitelist
CREATE OR REPLACE FUNCTION public.is_admin_email(check_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.admin_whitelist WHERE LOWER(email) = LOWER(check_email)
    )
$$;

-- Function to auto-assign admin role on profile creation
CREATE OR REPLACE FUNCTION public.handle_admin_role_assignment()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the email is in the admin whitelist
    IF public.is_admin_email(NEW.email) THEN
        -- Insert admin role
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.user_id, 'admin')
        ON CONFLICT (user_id, role) DO NOTHING;
    ELSE
        -- Insert user role
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.user_id, 'user')
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-assign role after profile creation
DROP TRIGGER IF EXISTS on_profile_created_assign_role ON public.profiles;
CREATE TRIGGER on_profile_created_assign_role
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_admin_role_assignment();

-- Audit log for coin changes
CREATE TABLE public.coin_audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    action text NOT NULL,
    coins_before integer NOT NULL,
    coins_after integer NOT NULL,
    reason text,
    performed_by uuid,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.coin_audit_log ENABLE ROW LEVEL SECURITY;

-- Users can view their own audit log
CREATE POLICY "Users can view own coin audit"
ON public.coin_audit_log
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all audit logs
CREATE POLICY "Admins can view all coin audits"
ON public.coin_audit_log
FOR SELECT
USING (is_admin(auth.uid()));

-- Admins can insert audit logs
CREATE POLICY "Admins can create coin audits"
ON public.coin_audit_log
FOR INSERT
WITH CHECK (is_admin(auth.uid()));