-- Add cron jobs for new timeframes

-- 2m (every 2 minutes)
SELECT cron.schedule('pine-engine-2m', '*/2 * * * *',
  $$select net.http_post(url:='https://wqavctxsscolwgmnnujg.supabase.co/functions/v1/pine-script-engine?action=run&timeframe=2m',headers:='{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxYXZjdHhzc2NvbHdnbW5udWpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMjc0MjAsImV4cCI6MjA4MzkwMzQyMH0.TS5XvpQ6k_7IPro44Ht7EBta4bv2FHjD88-cMqo-mkU"}'::jsonb,body:='{}'::jsonb) as request_id;$$
);

-- 3m (every 3 minutes)
SELECT cron.schedule('pine-engine-3m', '*/3 * * * *',
  $$select net.http_post(url:='https://wqavctxsscolwgmnnujg.supabase.co/functions/v1/pine-script-engine?action=run&timeframe=3m',headers:='{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxYXZjdHhzc2NvbHdnbW5udWpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMjc0MjAsImV4cCI6MjA4MzkwMzQyMH0.TS5XvpQ6k_7IPro44Ht7EBta4bv2FHjD88-cMqo-mkU"}'::jsonb,body:='{}'::jsonb) as request_id;$$
);

-- 10m (every 10 minutes)
SELECT cron.schedule('pine-engine-10m', '*/10 * * * *',
  $$select net.http_post(url:='https://wqavctxsscolwgmnnujg.supabase.co/functions/v1/pine-script-engine?action=run&timeframe=10m',headers:='{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxYXZjdHhzc2NvbHdnbW5udWpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMjc0MjAsImV4cCI6MjA4MzkwMzQyMH0.TS5XvpQ6k_7IPro44Ht7EBta4bv2FHjD88-cMqo-mkU"}'::jsonb,body:='{}'::jsonb) as request_id;$$
);

-- 45m (every 45 minutes)
SELECT cron.schedule('pine-engine-45m', '*/45 * * * *',
  $$select net.http_post(url:='https://wqavctxsscolwgmnnujg.supabase.co/functions/v1/pine-script-engine?action=run&timeframe=45m',headers:='{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxYXZjdHhzc2NvbHdnbW5udWpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMjc0MjAsImV4cCI6MjA4MzkwMzQyMH0.TS5XvpQ6k_7IPro44Ht7EBta4bv2FHjD88-cMqo-mkU"}'::jsonb,body:='{}'::jsonb) as request_id;$$
);

-- 2h (every 2 hours)
SELECT cron.schedule('pine-engine-2h', '0 */2 * * *',
  $$select net.http_post(url:='https://wqavctxsscolwgmnnujg.supabase.co/functions/v1/pine-script-engine?action=run&timeframe=2h',headers:='{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxYXZjdHhzc2NvbHdnbW5udWpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMjc0MjAsImV4cCI6MjA4MzkwMzQyMH0.TS5XvpQ6k_7IPro44Ht7EBta4bv2FHjD88-cMqo-mkU"}'::jsonb,body:='{}'::jsonb) as request_id;$$
);

-- 3h (every 3 hours)
SELECT cron.schedule('pine-engine-3h', '0 */3 * * *',
  $$select net.http_post(url:='https://wqavctxsscolwgmnnujg.supabase.co/functions/v1/pine-script-engine?action=run&timeframe=3h',headers:='{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxYXZjdHhzc2NvbHdnbW5udWpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMjc0MjAsImV4cCI6MjA4MzkwMzQyMH0.TS5XvpQ6k_7IPro44Ht7EBta4bv2FHjD88-cMqo-mkU"}'::jsonb,body:='{}'::jsonb) as request_id;$$
);

-- 1w (weekly on Monday)
SELECT cron.schedule('pine-engine-1w', '0 0 * * 1',
  $$select net.http_post(url:='https://wqavctxsscolwgmnnujg.supabase.co/functions/v1/pine-script-engine?action=run&timeframe=1w',headers:='{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxYXZjdHhzc2NvbHdnbW5udWpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMjc0MjAsImV4cCI6MjA4MzkwMzQyMH0.TS5XvpQ6k_7IPro44Ht7EBta4bv2FHjD88-cMqo-mkU"}'::jsonb,body:='{}'::jsonb) as request_id;$$
);

-- 1M (monthly on 1st)
SELECT cron.schedule('pine-engine-1M', '0 0 1 * *',
  $$select net.http_post(url:='https://wqavctxsscolwgmnnujg.supabase.co/functions/v1/pine-script-engine?action=run&timeframe=1M',headers:='{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxYXZjdHhzc2NvbHdnbW5udWpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMjc0MjAsImV4cCI6MjA4MzkwMzQyMH0.TS5XvpQ6k_7IPro44Ht7EBta4bv2FHjD88-cMqo-mkU"}'::jsonb,body:='{}'::jsonb) as request_id;$$
);