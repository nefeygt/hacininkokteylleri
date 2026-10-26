-- pg_net belongs in the extensions schema (advisor 0014); its functions stay in the net schema, so the
-- cron job's net.http_post call is unchanged.
drop extension if exists pg_net;
create extension pg_net with schema extensions;
