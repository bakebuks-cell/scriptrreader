
-- Add missing cron jobs for standard timeframes (1m, 5m, 15m, 30m, 1h, 4h, 1d)
-- These were missing, causing signals to be delayed until manual trigger

-- 1m (every minute)
SELECT cron.schedule('pine-engine-1m', '* * * * *',
  $$select net.http_post(url:='https://wqavctxsscolwgmnnujg.supabase.co/functions/v1/pine-script-engine?action=run&timeframe=1m',headers:='{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxYXZjdHhzc2NvbHdnbW5udWpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMjc0MjAsImV4cCI6MjA4MzkwMzQyMH0.TS5XvpQ6k_7IPro44Ht7EBta4bv2FHjD88-cMqo-mkU"}'::jsonb,body:='{}'::jsonb) as request_id;$$
);

-- 5m (every 5 minutes)
SELECT cron.schedule('pine-engine-5m', '*/5 * * * *',
  $$select net.http_post(url:='https://wqavctxsscolwgmnnujg.supabase.co/functions/v1/pine-script-engine?action=run&timeframe=5m',headers:='{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxYXZjdHhzc2NvbHdnbW5udWpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMjc0MjAsImV4cCI6MjA4MzkwMzQyMH0.TS5XvpQ6k_7IPro44Ht7EBta4bv2FHjD88-cMqo-mkU"}'::jsonb,body:='{}'::jsonb) as request_id;$$
);

-- 15m (every 15 minutes) — THIS WAS THE MISSING ONE CAUSING THE 30-MIN DELAY
SELECT cron.schedule('pine-engine-15m', '*/15 * * * *',
  $$select net.http_post(url:='https://wqavctxsscolwgmnnujg.supabase.co/functions/v1/pine-script-engine?action=run&timeframe=15m',headers:='{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxYXZjdHhzc2NvbHdnbW5udWpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMjc0MjAsImV4cCI6MjA4MzkwMzQyMH0.TS5XvpQ6k_7IPro44Ht7EBta4bv2FHjD88-cMqo-mkU"}'::jsonb,body:='{}'::jsonb) as request_id;$$
);

-- 30m (every 30 minutes)
SELECT cron.schedule('pine-engine-30m', '*/30 * * * *',
  $$select net.http_post(url:='https://wqavctxsscolwgmnnujg.supabase.co/functions/v1/pine-script-engine?action=run&timeframe=30m',headers:='{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxYXZjdHhzc2NvbHdnbW5udWpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMjc0MjAsImV4cCI6MjA4MzkwMzQyMH0.TS5XvpQ6k_7IPro44Ht7EBta4bv2FHjD88-cMqo-mkU"}'::jsonb,body:='{}'::jsonb) as request_id;$$
);

-- 1h (every hour)
SELECT cron.schedule('pine-engine-1h', '0 * * * *',
  $$select net.http_post(url:='https://wqavctxsscolwgmnnujg.supabase.co/functions/v1/pine-script-engine?action=run&timeframe=1h',headers:='{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxYXZjdHhzc2NvbHdnbW5udWpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMjc0MjAsImV4cCI6MjA4MzkwMzQyMH0.TS5XvpQ6k_7IPro44Ht7EBta4bv2FHjD88-cMqo-mkU"}'::jsonb,body:='{}'::jsonb) as request_id;$$
);

-- 4h (every 4 hours)
SELECT cron.schedule('pine-engine-4h', '0 */4 * * *',
  $$select net.http_post(url:='https://wqavctxsscolwgmnnujg.supabase.co/functions/v1/pine-script-engine?action=run&timeframe=4h',headers:='{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxYXZjdHhzc2NvbHdnbW5udWpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMjc0MjAsImV4cCI6MjA4MzkwMzQyMH0.TS5XvpQ6k_7IPro44Ht7EBta4bv2FHjD88-cMqo-mkU"}'::jsonb,body:='{}'::jsonb) as request_id;$$
);

-- 1d (daily at midnight UTC)
SELECT cron.schedule('pine-engine-1d', '0 0 * * *',
  $$select net.http_post(url:='https://wqavctxsscolwgmnnujg.supabase.co/functions/v1/pine-script-engine?action=run&timeframe=1d',headers:='{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxYXZjdHhzc2NvbHdnbW5udWpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMjc0MjAsImV4cCI6MjA4MzkwMzQyMH0.TS5XvpQ6k_7IPro44Ht7EBta4bv2FHjD88-cMqo-mkU"}'::jsonb,body:='{}'::jsonb) as request_id;$$
);
