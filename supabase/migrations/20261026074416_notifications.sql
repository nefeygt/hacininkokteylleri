-- Notifications (M9 package B, ADR-030): what happened to a member's things while they were away.
-- Rows are written only by triggers (security definer); a member reads, marks read and deletes their own.

create type public.notification_type as enum (
  'follow',             -- actor followed you
  'log_comment',        -- actor commented on your log
  'comment_thread',     -- actor commented on a log you commented on
  'recipe_review',      -- actor reviewed your recipe
  'showcase_approved',  -- your showcase application was approved
  'showcase_rejected',  -- your showcase application was rejected
  'content_hidden'      -- an admin hid your recipe, log, comment or review
);

create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  type        public.notification_type not null,
  actor_id    uuid references public.profiles (id) on delete cascade,
  cocktail_id uuid references public.cocktails (id) on delete cascade,
  log_id      uuid references public.drink_logs (id) on delete cascade,
  comment_id  uuid references public.log_comments (id) on delete cascade,
  review_id   uuid references public.reviews (id) on delete cascade,
  entry_id    uuid references public.showcase_entries (id) on delete cascade,
  created_at  timestamptz not null default now(),
  read_at     timestamptz
);

create index notifications_user_id_created_at_idx on public.notifications (user_id, created_at desc);
create index notifications_actor_id_idx on public.notifications (actor_id);
create index notifications_cocktail_id_idx on public.notifications (cocktail_id);
create index notifications_log_id_idx on public.notifications (log_id);
create index notifications_comment_id_idx on public.notifications (comment_id);
create index notifications_review_id_idx on public.notifications (review_id);
create index notifications_entry_id_idx on public.notifications (entry_id);

revoke all on public.notifications from anon, authenticated;
grant select, delete on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;

alter table public.notifications enable row level security;

create policy "Members read their notifications"
  on public.notifications for select to authenticated
  using (user_id = (select auth.uid()));
create policy "Members mark their notifications read"
  on public.notifications for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "Members delete their notifications"
  on public.notifications for delete to authenticated
  using (user_id = (select auth.uid()));

-- One writer for every trigger: never notify yourself; keep 90 days.
create function private.notify(
  recipient uuid,
  kind public.notification_type,
  actor uuid default null,
  cocktail uuid default null,
  log uuid default null,
  comment uuid default null,
  review uuid default null,
  entry uuid default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if recipient is null or recipient = actor then
    return;
  end if;
  delete from public.notifications
    where user_id = recipient and created_at < now() - interval '90 days';
  insert into public.notifications (user_id, type, actor_id, cocktail_id, log_id, comment_id, review_id, entry_id)
    values (recipient, kind, actor, cocktail, log, comment, review, entry);
end;
$$;

revoke execute on function private.notify(uuid, public.notification_type, uuid, uuid, uuid, uuid, uuid, uuid)
  from public, anon, authenticated;

-- ---------------------------------------------------------------- follows

create function private.notify_follow()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Unfollow and follow again: one notification, not two.
  delete from public.notifications
    where user_id = coalesce(new.followee_id, old.followee_id)
      and actor_id = coalesce(new.follower_id, old.follower_id)
      and type = 'follow';
  if tg_op = 'INSERT' then
    perform private.notify(new.followee_id, 'follow', new.follower_id);
  end if;
  return null;
end;
$$;

revoke execute on function private.notify_follow() from public, anon, authenticated;

create trigger follows_notify
  after insert or delete on public.follows
  for each row execute function private.notify_follow();

-- ---------------------------------------------------------------- log comments

create function private.notify_log_comment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner uuid;
  other uuid;
begin
  select user_id into owner from public.drink_logs where id = new.log_id;
  perform private.notify(owner, 'log_comment', new.user_id, log => new.log_id, comment => new.id);
  -- Everyone else who commented on the log (visible comments), once each.
  for other in
    select distinct c.user_id from public.log_comments c
    where c.log_id = new.log_id and c.id <> new.id and c.hidden_at is null
      and c.user_id <> new.user_id and c.user_id is distinct from owner
  loop
    perform private.notify(other, 'comment_thread', new.user_id, log => new.log_id, comment => new.id);
  end loop;
  return null;
end;
$$;

revoke execute on function private.notify_log_comment() from public, anon, authenticated;

create trigger log_comments_notify
  after insert on public.log_comments
  for each row execute function private.notify_log_comment();

-- ---------------------------------------------------------------- reviews of members' recipes

create function private.notify_recipe_review()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.notify(
    (select author_id from public.cocktails where id = new.cocktail_id),
    'recipe_review', new.user_id, cocktail => new.cocktail_id, review => new.id);
  return null;
end;
$$;

revoke execute on function private.notify_recipe_review() from public, anon, authenticated;

create trigger reviews_notify
  after insert on public.reviews
  for each row execute function private.notify_recipe_review();

-- ---------------------------------------------------------------- showcase decisions

create function private.notify_showcase_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.notifications
    where entry_id = new.id and type in ('showcase_approved', 'showcase_rejected');
  if new.status = 'approved' then
    perform private.notify(new.user_id, 'showcase_approved', cocktail => new.cocktail_id, entry => new.id);
  elsif new.status = 'rejected' then
    perform private.notify(new.user_id, 'showcase_rejected', cocktail => new.cocktail_id, entry => new.id);
  end if;
  return null;
end;
$$;

revoke execute on function private.notify_showcase_status() from public, anon, authenticated;

create trigger showcase_entries_notify
  after update of status on public.showcase_entries
  for each row when (old.status is distinct from new.status)
  execute function private.notify_showcase_status();

-- ---------------------------------------------------------------- moderation

-- Hiding tells the owner; showing again takes it back. A hidden comment's or review's
-- notifications to others go too (they would point at something nobody can read).
create function private.notify_hidden()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner uuid;
begin
  if tg_table_name = 'cocktails' then
    owner := new.author_id;
  else
    owner := new.user_id;
  end if;

  if new.hidden_at is not null and old.hidden_at is null then
    if tg_table_name = 'log_comments' then
      delete from public.notifications where comment_id = new.id;
      perform private.notify(owner, 'content_hidden', log => new.log_id, comment => new.id);
    elsif tg_table_name = 'reviews' then
      delete from public.notifications where review_id = new.id;
      perform private.notify(owner, 'content_hidden', cocktail => new.cocktail_id, review => new.id);
    elsif tg_table_name = 'drink_logs' then
      perform private.notify(owner, 'content_hidden', log => new.id);
    elsif owner is not null then
      perform private.notify(owner, 'content_hidden', cocktail => new.id);
    end if;
  elsif new.hidden_at is null and old.hidden_at is not null then
    delete from public.notifications
      where user_id = owner and type = 'content_hidden'
        and coalesce(comment_id, review_id, log_id, cocktail_id) = new.id;
  end if;
  return null;
end;
$$;

revoke execute on function private.notify_hidden() from public, anon, authenticated;

create trigger cocktails_notify_hidden
  after update of hidden_at on public.cocktails
  for each row execute function private.notify_hidden();
create trigger drink_logs_notify_hidden
  after update of hidden_at on public.drink_logs
  for each row execute function private.notify_hidden();
create trigger log_comments_notify_hidden
  after update of hidden_at on public.log_comments
  for each row execute function private.notify_hidden();
create trigger reviews_notify_hidden
  after update of hidden_at on public.reviews
  for each row execute function private.notify_hidden();
