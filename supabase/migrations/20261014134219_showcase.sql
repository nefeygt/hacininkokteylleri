-- The showcase (vitrin), M7 (ADR-014, ADR-019). Admins open periods (a week or
-- a month, chosen each time); members apply with one of their own published
-- recipes that has a photo, and a pitch; any admin approves; members upvote
-- approved entries while the period is open, once each, their own included.
-- The winner is derived (the most-voted approved entry of the latest period
-- that has ended), never stored.

-- ---------------------------------------------------------------- periods

create table public.showcase_periods (
  id          uuid primary key default gen_random_uuid(),
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  created_at  timestamptz not null default now(),
  check (ends_at > starts_at),
  -- Periods never overlap (a plain range needs no btree_gist).
  constraint showcase_periods_no_overlap exclude using gist (tstzrange(starts_at, ends_at, '[)') with &&)
);

comment on table public.showcase_periods is 'Showcase voting periods; an admin picks a week or a month each time (ADR-019). Applications are open until a period ends, votes only while it is open.';

create index showcase_periods_ends_at_idx on public.showcase_periods (ends_at desc);

revoke all on public.showcase_periods from anon, authenticated;
grant select on public.showcase_periods to anon, authenticated;
grant insert (starts_at, ends_at) on public.showcase_periods to authenticated;
grant delete on public.showcase_periods to authenticated;

alter table public.showcase_periods enable row level security;

create policy "Anyone can read showcase periods"
  on public.showcase_periods for select to anon, authenticated
  using (true);
create policy "Admins open showcase periods"
  on public.showcase_periods for insert to authenticated
  with check ((select private.is_admin()));
create policy "Admins delete showcase periods"
  on public.showcase_periods for delete to authenticated
  using ((select private.is_admin()));

-- ---------------------------------------------------------------- entries

create type public.showcase_status as enum ('pending', 'approved', 'rejected');

create table public.showcase_entries (
  id           uuid primary key default gen_random_uuid(),
  period_id    uuid not null references public.showcase_periods (id) on delete cascade,
  cocktail_id  uuid not null references public.cocktails (id) on delete cascade,
  user_id      uuid not null references public.profiles (id) on delete cascade,
  pitch        text not null check (char_length(btrim(pitch)) between 1 and 500),
  status       public.showcase_status not null default 'pending',
  reviewed_by  uuid,
  reviewed_at  timestamptz,
  vote_count   integer not null default 0 check (vote_count >= 0),
  created_at   timestamptz not null default now(),
  hidden_at    timestamptz,
  hidden_by    uuid,
  -- One application per member per period (ADR-014).
  unique (period_id, user_id)
);

comment on table public.showcase_entries is 'Applications to the showcase: the applicant''s own published recipe with a photo, and a pitch. Admins approve; vote_count is kept by a trigger on showcase_votes (ADR-014, ADR-019).';
comment on column public.showcase_entries.vote_count is 'Cached total of showcase_votes, kept by private.count_showcase_vote(); votes themselves stay private.';

create index showcase_entries_cocktail_id_idx on public.showcase_entries (cocktail_id);
create index showcase_entries_user_id_idx on public.showcase_entries (user_id);

create trigger showcase_entries_guard_moderation
  before insert or update on public.showcase_entries
  for each row execute function private.guard_moderation();

-- Who approved or rejected, and when, is written here, never by the client.
create function private.stamp_showcase_review()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    new.reviewed_by := case when new.status = 'pending' then null else (select auth.uid()) end;
    new.reviewed_at := case when new.status = 'pending' then null else now() end;
  end if;
  return new;
end;
$$;

revoke execute on function private.stamp_showcase_review() from public, anon, authenticated;

create trigger showcase_entries_stamp_review
  before update of status on public.showcase_entries
  for each row execute function private.stamp_showcase_review();

revoke all on public.showcase_entries from anon, authenticated;
grant select on public.showcase_entries to anon, authenticated;
grant insert (period_id, cocktail_id, user_id, pitch) on public.showcase_entries to authenticated;
grant update (status, hidden_at) on public.showcase_entries to authenticated;
grant delete on public.showcase_entries to authenticated;

alter table public.showcase_entries enable row level security;

create policy "Anyone can read approved visible entries"
  on public.showcase_entries for select to anon
  using (status = 'approved' and hidden_at is null);
create policy "Signed-in users read approved visible entries and their own; admins read all"
  on public.showcase_entries for select to authenticated
  using ((status = 'approved' and hidden_at is null) or user_id = (select auth.uid()) or (select private.is_admin()));
-- The recipe must be the applicant's own, published, visible and with a photo;
-- the period must not have ended. Status starts pending (no column grant).
create policy "Members apply with their own published recipe"
  on public.showcase_entries for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.cocktails c
      where c.id = cocktail_id and c.author_id = (select auth.uid())
        and c.is_published and c.hidden_at is null and c.image_path is not null
    )
    and exists (select 1 from public.showcase_periods p where p.id = period_id and p.ends_at > now())
  );
create policy "Admins review and moderate entries"
  on public.showcase_entries for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));
create policy "Applicants withdraw their entries; admins delete any"
  on public.showcase_entries for delete to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));

-- ---------------------------------------------------------------- votes

create table public.showcase_votes (
  entry_id    uuid not null references public.showcase_entries (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (entry_id, user_id)
);

comment on table public.showcase_votes is 'Upvotes: one per member per entry, self-votes allowed (ADR-014). Private: a voter reads only their own; totals live in showcase_entries.vote_count.';

create index showcase_votes_user_id_idx on public.showcase_votes (user_id);

-- Keeps vote_count in step. Security definer: voters cannot update entries.
create function private.count_showcase_vote()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.showcase_entries set vote_count = vote_count + 1 where id = new.entry_id;
  else
    update public.showcase_entries set vote_count = greatest(vote_count - 1, 0) where id = old.entry_id;
  end if;
  return null;
end;
$$;

revoke execute on function private.count_showcase_vote() from public, anon, authenticated;

create trigger showcase_votes_count
  after insert or delete on public.showcase_votes
  for each row execute function private.count_showcase_vote();

revoke all on public.showcase_votes from anon, authenticated;
grant select on public.showcase_votes to authenticated;
grant insert (entry_id, user_id) on public.showcase_votes to authenticated;
grant delete on public.showcase_votes to authenticated;

alter table public.showcase_votes enable row level security;

create policy "Members read their own votes"
  on public.showcase_votes for select to authenticated
  using (user_id = (select auth.uid()));
-- Votes go only to approved, visible entries of an open period whose recipe is
-- still published and visible; taking a vote back follows the same rule.
create policy "Members vote while the period is open"
  on public.showcase_votes for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.showcase_entries e
      join public.showcase_periods p on p.id = e.period_id
      join public.cocktails c on c.id = e.cocktail_id
      where e.id = entry_id and e.status = 'approved' and e.hidden_at is null
        and now() >= p.starts_at and now() < p.ends_at
        and c.is_published and c.hidden_at is null
    )
  );
create policy "Members take back votes while the period is open"
  on public.showcase_votes for delete to authenticated
  using (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.showcase_entries e
      join public.showcase_periods p on p.id = e.period_id
      where e.id = entry_id and now() >= p.starts_at and now() < p.ends_at
    )
  );
