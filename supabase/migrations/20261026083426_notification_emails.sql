-- Notification e-mails (ADR-031): a digest of unread notifications, sent by the Edge Function
-- send-notification-emails every 15 minutes through Resend. Members opt out on /account; the
-- language follows account_settings.locale (the site's translation, M9).
alter table public.account_settings
  add column email_notifications boolean not null default true,
  add column locale text not null default 'tr' check (locale in ('tr', 'en'));

comment on column public.account_settings.email_notifications is 'Whether unread notifications are e-mailed as a digest (ADR-031).';
comment on column public.account_settings.locale is 'The member''s language for e-mails: tr or en (M9 translation).';

grant update (email_notifications, locale) on public.account_settings to authenticated;

alter table public.notifications add column emailed_at timestamptz;

-- What the sender needs, in one read: members who opted in, with unread notifications that are
-- not e-mailed yet, older than 10 minutes (reading them on the site first saves the e-mail) and
-- younger than a day. Service role only: it returns e-mail addresses.
create function public.pending_notification_emails()
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
   where n.read_at is null and n.emailed_at is null
     and n.created_at < now() - interval '10 minutes'
     and n.created_at > now() - interval '1 day'
   group by n.user_id, u.email, s.locale, p.display_name;
$$;

revoke execute on function public.pending_notification_emails() from public, anon, authenticated;
grant execute on function public.pending_notification_emails() to service_role;
