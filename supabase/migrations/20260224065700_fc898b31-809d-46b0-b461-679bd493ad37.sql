
-- Add quantity and leverage columns to trades table
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS quantity numeric NULL;
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS leverage integer NULL DEFAULT 1;
