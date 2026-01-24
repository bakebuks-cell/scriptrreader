-- Create report status enum
CREATE TYPE public.report_status AS ENUM ('PENDING', 'REVIEWED', 'RESOLVED');

-- Create report reason enum
CREATE TYPE public.report_reason AS ENUM ('SPAM', 'SCAM', 'FAKE_STRATEGY', 'OFFENSIVE', 'OTHER');

-- Create script_reports table
CREATE TABLE public.script_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  script_id UUID NOT NULL REFERENCES public.pine_scripts(id) ON DELETE CASCADE,
  reported_by UUID NOT NULL,
  reason report_reason NOT NULL,
  description TEXT,
  status report_status NOT NULL DEFAULT 'PENDING',
  admin_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.script_reports ENABLE ROW LEVEL SECURITY;

-- Users can create reports (but not on their own scripts)
CREATE POLICY "Users can create reports"
ON public.script_reports
FOR INSERT
WITH CHECK (
  auth.uid() = reported_by
  AND NOT EXISTS (
    SELECT 1 FROM public.pine_scripts 
    WHERE id = script_id AND created_by = auth.uid()
  )
);

-- Users can view their own reports
CREATE POLICY "Users can view own reports"
ON public.script_reports
FOR SELECT
USING (auth.uid() = reported_by);

-- Admins can view all reports
CREATE POLICY "Admins can view all reports"
ON public.script_reports
FOR SELECT
USING (public.is_admin(auth.uid()));

-- Admins can update reports (status, admin_notes, etc.)
CREATE POLICY "Admins can update reports"
ON public.script_reports
FOR UPDATE
USING (public.is_admin(auth.uid()));

-- Admins can delete reports
CREATE POLICY "Admins can delete reports"
ON public.script_reports
FOR DELETE
USING (public.is_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_script_reports_updated_at
BEFORE UPDATE ON public.script_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();