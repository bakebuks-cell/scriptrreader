-- Add margin_amount column to trades table to snapshot the margin at trade creation time
ALTER TABLE public.trades ADD COLUMN margin_amount numeric NULL;

-- Backfill existing trades: compute margin from quantity and entry_price / leverage
UPDATE public.trades 
SET margin_amount = CASE 
  WHEN quantity IS NOT NULL AND entry_price IS NOT NULL AND leverage IS NOT NULL AND leverage > 0 
  THEN (quantity * entry_price) / leverage
  ELSE NULL 
END
WHERE margin_amount IS NULL;