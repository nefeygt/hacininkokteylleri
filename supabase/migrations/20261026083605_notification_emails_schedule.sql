-- Every 15 minutes, pg_cron asks the Edge Function send-notification-emails to send the digests
-- (ADR-031). The bearer is the legacy anon key: public by design, it only passes the function
-- gateway; the function itself uses Supabase's service key. Without RESEND_API_KEY it does nothing.
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'send-notification-emails',
  '*/15 * * * *',
  $$
  select net.http_post(
    url := 'https://qwvnhdghwycqlvsnlvlt.supabase.co/functions/v1/send-notification-emails',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3dm5oZGdod3ljcWx2c25sdmx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4OTMxMTUsImV4cCI6MjEwNzQ2OTExNX0.TIqf315BDezLGMpLklUsMryie9ea52HYzeoVzqde6dM'
    ),
    body := '{}'::jsonb
  );
  $$
);
