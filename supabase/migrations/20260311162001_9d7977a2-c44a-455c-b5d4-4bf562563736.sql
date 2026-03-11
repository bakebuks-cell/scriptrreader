
UPDATE public.profiles 
SET daily_profit_target = 0, 
    daily_target_reset_at = now()
WHERE user_id = '5a0202d2-49fd-4dd2-ab3d-2fc25232cd5e';
