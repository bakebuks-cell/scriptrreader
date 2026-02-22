-- Add validation status columns to pine_scripts
ALTER TABLE public.pine_scripts
ADD COLUMN validation_status text NOT NULL DEFAULT 'pending',
ADD COLUMN validation_errors text[] NOT NULL DEFAULT '{}';

-- Comment for clarity
COMMENT ON COLUMN public.pine_scripts.validation_status IS 'pending | valid | invalid';
COMMENT ON COLUMN public.pine_scripts.validation_errors IS 'Array of validation error messages';