-- Community accounts (ADR-014, M3): a private settings row with the 18+
-- confirmation, a public profile that every community table will reference,
-- the shared moderation guard, an avatar bucket, and self-service deletion.
-- Admin powers are unchanged: admins + aal2 (ADR-011).

-- Moderation (ADR-014 principle 4). Authors may update their own rows, so
-- hiding is guarded here: only an admin may set or clear hidden_at, and
-- hidden_by is always written by this trigger, never by the client.
create function private.guard_moderation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.hidden_at is not null and not (select private.is_admin()) then
      raise exception 'Only admins can hide content' using errcode = '42501';
    end if;
  elsif new.hidden_at is distinct from old.hidden_at then
    if not (select private.is_admin()) then
      raise exception 'Only admins can hide or unhide content' using errcode = '42501';
    end if;
  else
    new.hidden_by := old.hidden_by;
    return new;
  end if;

  new.hidden_by := case when new.hidden_at is null then null else (select auth.uid()) end;
  return new;
end;
$$;

revoke execute on function private.guard_moderation() from public, anon, authenticated;

-- account_settings: private, one per user. Inserting it is the 18+
-- confirmation; the time is the server's, never the client's.
create table public.account_settings (
  user_id                 uuid primary key references auth.users (id) on delete cascade,
  adult_confirmed_at      timestamptz not null default now(),
  privacy_notice_version  text not null check (char_length(privacy_notice_version) between 1 and 20),
  logs_public_default     boolean not null default false,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

comment on table public.account_settings is 'Private per-user settings. The row is created at onboarding and records the 18+ confirmation and which privacy notice was shown (ADR-014).';
comment on column public.account_settings.adult_confirmed_at is 'When the user confirmed being 18 or older. No birth date is stored.';

create trigger account_settings_set_updated_at
  before update on public.account_settings
  for each row execute function public.set_updated_at();

-- profiles: the public identity every community table hangs off.
create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  username      text not null unique
                check (username ~ '^[a-z0-9_]{3,20}$')
                check (username <> all (array[
                  'admin', 'administrator', 'yonetim', 'yonetici', 'moderator', 'mod',
                  'haci', 'hacininkokteylleri', 'kokteyl', 'kokteyller', 'vitrin', 'akis',
                  'giris', 'cikis', 'kayit', 'hesap', 'profil', 'ayarlar', 'gizlilik',
                  'hosgeldin', 'auth', 'api', 'www', 'root', 'destek', 'support',
                  'sistem', 'system', 'null', 'undefined'
                ])),
  display_name  text not null check (char_length(btrim(display_name)) between 1 and 50),
  avatar_path   text check (avatar_path is null or starts_with(avatar_path, id::text || '/')),
  bio           text check (bio is null or char_length(bio) <= 280),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  hidden_at     timestamptz,
  hidden_by     uuid
);

comment on table public.profiles is 'Public identity of a community member. Community tables reference this, so a user without a profile (onboarding unfinished) can write nothing (ADR-014).';
comment on column public.profiles.avatar_path is 'Object key in the public "avatars" bucket, always under "{id}/". Never overwrite an object in place (ADR-006).';
comment on column public.profiles.hidden_by is 'The admin who hid the row; written by private.guard_moderation().';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger profiles_guard_moderation
  before insert or update on public.profiles
  for each row execute function private.guard_moderation();

-- Grants: take back the project's defaults, give only what is needed, down
-- to the column where a user must not touch the rest.
revoke all on public.account_settings, public.profiles from anon, authenticated;

grant select on public.account_settings to authenticated;
grant insert (user_id, privacy_notice_version, logs_public_default) on public.account_settings to authenticated;
grant update (privacy_notice_version, logs_public_default) on public.account_settings to authenticated;

grant select on public.profiles to anon, authenticated;
grant insert (id, username, display_name, avatar_path, bio) on public.profiles to authenticated;
grant update (username, display_name, avatar_path, bio, hidden_at) on public.profiles to authenticated;

alter table public.account_settings enable row level security;
alter table public.profiles enable row level security;

-- account_settings: the owner only; admins may read.
create policy "Users read their own settings; admins read all"
  on public.account_settings for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));
create policy "Users create their own settings"
  on public.account_settings for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "Users change their own settings"
  on public.account_settings for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- profiles: public unless hidden; created only after the 18+ confirmation.
create policy "Anyone can read visible profiles"
  on public.profiles for select to anon
  using (hidden_at is null);
create policy "Signed-in users read visible profiles and their own; admins read all"
  on public.profiles for select to authenticated
  using (hidden_at is null or id = (select auth.uid()) or (select private.is_admin()));
create policy "Users create their own profile after confirming 18+"
  on public.profiles for insert to authenticated
  with check (
    id = (select auth.uid())
    and exists (select 1 from public.account_settings s where s.user_id = (select auth.uid()))
  );
create policy "Users change their own profile; admins moderate"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()) or (select private.is_admin()))
  with check (id = (select auth.uid()) or (select private.is_admin()));

-- Avatars: a public bucket, one folder per user ("{user_id}/..."). Users
-- manage their own folder; admins may delete any avatar (moderation).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 524288, array['image/webp', 'image/jpeg']);

create policy "Users list their own avatars"
  on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Users upload avatars to their own folder"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Users delete their own avatars; admins delete any"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or (select private.is_admin()))
  );

-- Account deletion with no secret key in the app (ADR-014). The browser
-- removes the user's files first (Supabase cannot delete an auth user who
-- owns Storage objects); deleting the auth user cascades to everything else.
-- The worker lives in `private` (not callable over HTTP); the public wrapper
-- runs with the caller's rights.
create function private.delete_account(target uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if target is null or target is distinct from (select auth.uid()) then
    raise exception 'You can only delete your own account' using errcode = '42501';
  end if;
  if exists (select 1 from public.admins where user_id = target) then
    raise exception 'Admin accounts are removed by the owner' using errcode = '42501';
  end if;
  if exists (select 1 from storage.objects where owner_id = target::text) then
    raise exception 'Delete your uploaded files first' using errcode = 'P0001';
  end if;

  delete from auth.users where id = target;
end;
$$;

revoke execute on function private.delete_account(uuid) from public, anon;
grant execute on function private.delete_account(uuid) to authenticated;

create function public.delete_my_account()
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.delete_account((select auth.uid()));
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
