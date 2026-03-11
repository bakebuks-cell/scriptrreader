-- Deactivate the broken admin copy script for jungharepiyush17
UPDATE public.user_scripts 
SET is_active = false 
WHERE user_id = '65b70139-0389-4161-ae1a-c4f49ff55a8d' 
AND script_id = '881ad59b-4717-4395-9892-50ec0c7aed9a';

-- Deactivate the strategy_state so it stops being polled
UPDATE public.strategy_state 
SET status = 'inactive' 
WHERE user_id = '65b70139-0389-4161-ae1a-c4f49ff55a8d' 
AND script_id = '881ad59b-4717-4395-9892-50ec0c7aed9a';

-- Clean up the spam FAILED trades from the last 2 hours for this user/script
DELETE FROM public.trades 
WHERE user_id = '65b70139-0389-4161-ae1a-c4f49ff55a8d' 
AND status = 'FAILED' 
AND error_message LIKE '%Insufficient balance%'
AND created_at > now() - interval '2 hours';