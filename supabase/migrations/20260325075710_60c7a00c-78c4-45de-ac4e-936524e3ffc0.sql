-- Enable webhook_enabled in simti's user_scripts settings_json for the SuperTrend script
UPDATE public.user_scripts
SET settings_json = settings_json || '{"webhook_enabled": true}'::jsonb
WHERE id = 'e7f1fb31-3a34-4c4e-af3b-88471e8d9cc4';