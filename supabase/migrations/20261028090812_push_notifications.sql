-- Push notifications in the app (ADR-033): Expo push tokens per device, a per-member switch, and a
-- sender (the Edge Function send-push-notifications) woken by new notifications through pg_net. The
-- function claims rows atomically and reads tokens with the service role; nothing secret reaches the app.

create table public.push_tokens (
  token text primary key check (token like 'ExponentPushToken[%' or token like 'ExpoPushToken[%'),
  user_id uuid not null references auth.users (id) on delete cascade,
  platform text not null check (platform in ('ios', 'android')),
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

comment on table public.push_tokens is 'Expo push tokens of the devices a member enabled push on (ADR-033).';

create index push_tokens_user_id_idx on public.push_tokens (user_id);

alter table public.push_tokens enable row level security;

create policy "Members read their push tokens" on public.push_tokens
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Members remove their push tokens" on public.push_tokens
  for delete to authenticated using (user_id = (select auth.uid()));

grant select, delete on public.push_tokens to authenticated;

-- A device's token belongs to whoever signed in on it last: a phone handed from one member to another
-- must not keep receiving the first member's notifications. Only the device knows its token, so the
-- caller registering it takes it over. Inserts and updates go through here only.
create function public.register_push_token(p_token text, p_platform text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;
  insert into public.push_tokens (token, user_id, platform)
  values (p_token, (select auth.uid()), p_platform)
  on conflict (token) do update
    set user_id = excluded.user_id, platform = excluded.platform, last_seen_at = now();
end;
$$;

revoke execute on function public.register_push_token(text, text) from public, anon;
grant execute on function public.register_push_token(text, text) to authenticated;

alter table public.account_settings add column push_notifications boolean not null default true;
comment on column public.account_settings.push_notifications is 'Whether new notifications are pushed to the member''s devices (ADR-033).';
grant update (push_notifications) on public.account_settings to authenticated;

alter table public.notifications add column pushed_at timestamptz;
comment on column public.notifications.pushed_at is 'When the sender claimed the row for a push; a pushed row is not e-mailed (ADR-033).';

-- The sender's one read: unread rows of the last 10 minutes not pushed yet, for members with the
-- switch on and at least one device, stamped in the same statement so two calls never push one row
-- twice. Returns what the wording needs. Service role only: it returns device tokens.
create function public.claim_push_notifications()
returns table (
  id uuid, type text, locale text, tokens text[], actor_username text,
  cocktail_id uuid, cocktail_slug text, cocktail_name text, cocktail_author uuid,
  log_id uuid, log_name text, comment_id uuid,
  review_id uuid, review_cocktail_slug text, review_cocktail_name text, review_cocktail_author uuid
)
language sql
volatile
security definer
set search_path = ''
as $$
  with claimed as (
    update public.notifications n
       set pushed_at = now()
     where n.pushed_at is null
       and n.read_at is null
       and n.created_at > now() - interval '10 minutes'
       and exists (select 1 from public.push_tokens t where t.user_id = n.user_id)
       and exists (select 1 from public.account_settings s where s.user_id = n.user_id and s.push_notifications)
    returning n.*
  )
  select c.id, c.type::text, coalesce(s.locale, 'tr'),
         (select array_agg(t.token) from public.push_tokens t where t.user_id = c.user_id),
         a.username,
         c.cocktail_id, k.slug, k.name, k.author_id,
         c.log_id, l.recipe ->> 'name', c.comment_id,
         c.review_id, rk.slug, rk.name, rk.author_id
    from claimed c
    left join public.account_settings s on s.user_id = c.user_id
    left join public.profiles a on a.id = c.actor_id
    left join public.cocktails k on k.id = c.cocktail_id
    left join public.drink_logs l on l.id = c.log_id
    left join public.reviews r on r.id = c.review_id
    left join public.cocktails rk on rk.id = r.cocktail_id;
$$;

revoke execute on function public.claim_push_notifications() from public, anon, authenticated;
grant execute on function public.claim_push_notifications() to service_role;

-- New notifications for a member with a device wake the sender. The bearer is the public legacy anon
-- key (as the e-mail schedule's); the function claims rows itself, so a stray call pushes nothing twice.
create function private.wake_push_sender()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from inserted i join public.push_tokens t on t.user_id = i.user_id) then
    perform net.http_post(
      url := 'https://qwvnhdghwycqlvsnlvlt.supabase.co/functions/v1/send-push-notifications',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3dm5oZGdod3ljcWx2c25sdmx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4OTMxMTUsImV4cCI6MjEwNzQ2OTExNX0.TIqf315BDezLGMpLklUsMryie9ea52HYzeoVzqde6dM'
      ),
      body := '{}'::jsonb
    );
  end if;
  return null;
end;
$$;

create trigger notifications_wake_push_sender
  after insert on public.notifications
  referencing new table as inserted
  for each statement execute function private.wake_push_sender();

-- A pushed notification is not e-mailed as well (ADR-033).
create or replace function public.pending_notification_emails()
returns table (user_id uuid, email text, locale text, display_name text, notification_ids uuid[], types text[])
language sql
stable
security definer
set search_path = ''
as $$
  select n.user_id, u.email::text, s.locale, p.display_name,
         array_agg(n.id order by n.created_at desc),
         array_agg(n.type::text order by n.created_at desc)
    from public.notifications n
    join public.account_settings s on s.user_id = n.user_id and s.email_notifications
    join public.profiles p on p.id = n.user_id
    join auth.users u on u.id = n.user_id and u.email is not null
   where n.read_at is null and n.emailed_at is null and n.pushed_at is null
     and n.created_at < now() - interval '10 minutes'
     and n.created_at > now() - interval '1 day'
   group by n.user_id, u.email, s.locale, p.display_name;
$$;
