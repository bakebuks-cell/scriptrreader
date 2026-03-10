-- Backfill missing exit_price for trades that were closed by client-side reconciliation
-- Set exit_price = entry_price (PNL = 0) since we can't recover the actual exit price
UPDATE trades 
SET exit_price = entry_price,
    error_message = COALESCE(error_message, '') || ' [exit_price backfilled to entry_price - actual exit unknown]'
WHERE status = 'CLOSED' 
AND exit_price IS NULL 
AND entry_price IS NOT NULL;