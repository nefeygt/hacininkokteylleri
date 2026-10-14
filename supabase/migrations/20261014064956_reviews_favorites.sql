-- Reviews and favourites (ADR-012, ADR-014, M4): one review per person per
-- cocktail, public favourites, the cocktail_ratings view the static pages read,
-- reports (the first feature users write to), and daily volume limits.

-- The reserved usernames gain the English route words (ADR-015). No existing
-- profile uses any of them (checked before this migration).
alter table public.profiles drop constraint profiles_username_check1;
alter table public.profiles add constraint profiles_username_reserved check (username <> all (array[
  'admin', 'administrator', 'yonetim', 'yonetici', 'moderator', 'mod',
  'haci', 'hacininkokteylleri', 'kokteyl', 'kokteyller', 'vitrin', 'akis',
  'giris', 'cikis', 'kayit', 'hesap', 'profil', 'ayarlar', 'gizlilik',
  'hosgeldin', 'auth', 'api', 'www', 'root', 'destek', 'support',
  'sistem', 'system', 'null', 'undefined',
  'cocktails', 'cocktail', 'login', 'logout', 'signin', 'signup', 'register',
  'account', 'welcome', 'privacy', 'reset_password', 'profile', 'settings',
  'feed', 'showcase', 'reviews', 'favorites', 'favourites', 'logs', 'glossary',
  'verify', 'setup_2fa', 'about', 'help', 'contact', 'terms', 'haci_official'
]));

-- reviews: 1–5 stars and optional text, public, one per person per cocktail.
create table public.reviews (
  id           uuid primary key default gen_random_uuid(),
  cocktail_id  uuid not null references public.cocktails (id) on delete cascade,
  user_id      uuid not null references public.profiles (id) on delete cascade,
  rating       smallint not null check (rating between 1 and 5),
  body         text check (body is null or char_length(body) between 1 and 2000),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  hidden_at    timestamptz,
  hidden_by    uuid,
  unique (cocktail_id, user_id)
);

comment on table public.reviews is 'A member''s public rating (1–5) and optional text for a cocktail; one per person per cocktail, writing again edits it (ADR-012).';

create index reviews_user_id_idx on public.reviews (user_id);
create index reviews_cocktail_recent_idx on public.reviews (cocktail_id, updated_at desc);

create trigger reviews_set_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();

create trigger reviews_guard_moderation
  before insert or update on public.reviews
  for each row execute function private.guard_moderation();

-- favorites: public, as the user chose (ADR-014).
create table public.favorites (
  user_id      uuid not null references public.profiles (id) on delete cascade,
  cocktail_id  uuid not null references public.cocktails (id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (user_id, cocktail_id)
);

comment on table public.favorites is 'Cocktails a member saved to their public list.';

create index favorites_cocktail_id_idx on public.favorites (cocktail_id);

-- reports: anyone with a profile reports content; only admins read them.
create type public.report_target as enum ('profile', 'cocktail', 'review', 'drink_log', 'showcase_entry');

create table public.reports (
  id           uuid primary key default gen_random_uuid(),
  reporter_id  uuid not null references public.profiles (id) on delete cascade,
  target_type  public.report_target not null,
  target_id    uuid not null,
  reason       text check (reason is null or char_length(reason) <= 500),
  created_at   timestamptz not null default now(),
  resolved_at  timestamptz,
  resolved_by  uuid,
  unique (reporter_id, target_type, target_id)
);

comment on table public.reports is 'Reports of content by members; read and resolved only by admins (ADR-014).';

create index reports_open_idx on public.reports (created_at desc) where resolved_at is null;
create index reports_target_idx on public.reports (target_type, target_id);

-- Daily volume limits (ADR-014 principle 6): 20 reviews written or rewritten
-- and 20 reports per member per day. Security definer because members cannot
-- read their own reports; the functions are not callable over HTTP.
create function private.limit_reviews()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.rating = old.rating and new.body is not distinct from old.body then
    return new;
  end if;
  if (select count(*) from public.reviews
      where user_id = new.user_id and updated_at > now() - interval '1 day') >= 20 then
    raise exception 'Daily review limit reached' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create function private.limit_reports()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.reports
      where reporter_id = new.reporter_id and created_at > now() - interval '1 day') >= 20 then
    raise exception 'Daily report limit reached' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

revoke execute on function private.limit_reviews(), private.limit_reports() from public, anon, authenticated;

create trigger reviews_limit
  before insert or update on public.reviews
  for each row execute function private.limit_reviews();

create trigger reports_limit
  before insert on public.reports
  for each row execute function private.limit_reports();

-- Resolving a report records who did it; the client never writes resolved_by.
create function private.stamp_report_resolution()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.resolved_by := case when new.resolved_at is null then null else (select auth.uid()) end;
  return new;
end;
$$;

revoke execute on function private.stamp_report_resolution() from public, anon, authenticated;

create trigger reports_stamp_resolution
  before update on public.reports
  for each row execute function private.stamp_report_resolution();

-- Grants: take back the defaults; columns where users must not touch the rest.
revoke all on public.reviews, public.favorites, public.reports from anon, authenticated;

grant select on public.reviews to anon, authenticated;
grant insert (cocktail_id, user_id, rating, body) on public.reviews to authenticated;
grant update (rating, body, hidden_at) on public.reviews to authenticated;
grant delete on public.reviews to authenticated;

grant select on public.favorites to anon, authenticated;
grant insert (user_id, cocktail_id) on public.favorites to authenticated;
grant delete on public.favorites to authenticated;

grant select on public.reports to authenticated;
grant insert (reporter_id, target_type, target_id, reason) on public.reports to authenticated;
grant update (resolved_at) on public.reports to authenticated;

alter table public.reviews enable row level security;
alter table public.favorites enable row level security;
alter table public.reports enable row level security;

-- reviews
create policy "Anyone can read visible reviews"
  on public.reviews for select to anon
  using (hidden_at is null);
create policy "Signed-in users read visible reviews and their own; admins read all"
  on public.reviews for select to authenticated
  using (hidden_at is null or user_id = (select auth.uid()) or (select private.is_admin()));
create policy "Members review published cocktails"
  on public.reviews for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.cocktails c where c.id = cocktail_id and c.is_published)
  );
create policy "Members change their own reviews; admins moderate"
  on public.reviews for update to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()))
  with check (user_id = (select auth.uid()) or (select private.is_admin()));
create policy "Members delete their own reviews; admins delete any"
  on public.reviews for delete to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));

-- favorites
create policy "Anyone can read favourites"
  on public.favorites for select to anon, authenticated
  using (true);
create policy "Members save published cocktails"
  on public.favorites for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.cocktails c where c.id = cocktail_id and c.is_published)
  );
create policy "Members remove their own favourites"
  on public.favorites for delete to authenticated
  using (user_id = (select auth.uid()));

-- reports
create policy "Admins read reports"
  on public.reports for select to authenticated
  using ((select private.is_admin()));
create policy "Members file their own reports"
  on public.reports for insert to authenticated
  with check (reporter_id = (select auth.uid()));
create policy "Admins resolve reports"
  on public.reports for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- Averages and counts for the static pages (ADR-005). Security invoker, so
-- the caller's policies apply; hidden reviews and hidden profiles are left
-- out explicitly, so the numbers are the same for everyone.
create view public.cocktail_ratings
with (security_invoker = on) as
select r.cocktail_id,
       count(*)::integer                    as review_count,
       round(avg(r.rating), 2)::numeric(3,2) as average_rating
from public.reviews r
join public.profiles p on p.id = r.user_id
where r.hidden_at is null and p.hidden_at is null
group by r.cocktail_id;

comment on view public.cocktail_ratings is 'Average rating and review count per cocktail, visible reviews by visible profiles only.';

revoke all on public.cocktail_ratings from anon, authenticated;
grant select on public.cocktail_ratings to anon, authenticated;
