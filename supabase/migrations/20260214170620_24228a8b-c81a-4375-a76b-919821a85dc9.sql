-- Add user-specific settings override column to user_scripts
ALTER TABLE public.user_scripts 
ADD COLUMN IF NOT EXISTS settings_json jsonb NOT NULL DEFAULT '{}'::jsonb;