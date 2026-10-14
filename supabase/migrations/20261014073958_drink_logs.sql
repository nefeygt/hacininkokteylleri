-- Drink logs (ADR-012, ADR-014, M5): a member logs a cocktail any number of
-- times, each with the recipe as made (a snapshot), the date, that evening's
-- rating and a note. Private unless the member makes a log public.

-- The recipe as made, in the shape save_cocktail takes:
-- {name, ingredients: [{name, amount, unit, icon}], instructions: [], garnish, glass}.
-- Unknown keys are refused so the snapshot stays a recipe, not a free-form blob.
-- A null anywhere means invalid (a check constraint would let null through);
-- malformed values may also raise, which refuses the write just the same.
create function private.is_valid_log_recipe(recipe jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(jsonb_typeof(recipe) = 'object'
    and octet_length(recipe::text) <= 16384
    and (select coalesce(bool_and(k in ('name', 'ingredients', 'instructions', 'garnish', 'glass')), true)
         from jsonb_object_keys(recipe) k)
    and jsonb_typeof(recipe -> 'name') = 'string'
    and char_length(recipe ->> 'name') between 1 and 100
    and jsonb_typeof(recipe -> 'ingredients') = 'array'
    and jsonb_array_length(recipe -> 'ingredients') between 1 and 30
    and (select bool_and(
               jsonb_typeof(i) = 'object'
           and (select bool_and(k in ('name', 'amount', 'unit', 'icon')) from jsonb_object_keys(i) k)
           and jsonb_typeof(i -> 'name') = 'string'
           and char_length(i ->> 'name') between 1 and 100
           and jsonb_typeof(i -> 'amount') = 'number'
           and (i ->> 'amount')::numeric > 0
           and (i ->> 'amount')::numeric <= 9999
           and jsonb_typeof(i -> 'unit') = 'string'
           and char_length(i ->> 'unit') between 1 and 20
           and (i ->> 'icon') in ('shot', 'dash', 'drop', 'slice', 'spoon', 'topup'))
         from jsonb_array_elements(recipe -> 'ingredients') i)
    and (recipe -> 'instructions' is null or (
          jsonb_typeof(recipe -> 'instructions') = 'array'
      and jsonb_array_length(recipe -> 'instructions') <= 30
      and (select coalesce(bool_and(jsonb_typeof(s) = 'string' and char_length(s #>> '{}') between 1 and 500), true)
           from jsonb_array_elements(recipe -> 'instructions') s)))
    and (recipe -> 'garnish' is null or jsonb_typeof(recipe -> 'garnish') = 'null'
         or (jsonb_typeof(recipe -> 'garnish') = 'string' and char_length(recipe ->> 'garnish') <= 200))
    and (recipe -> 'glass' is null or jsonb_typeof(recipe -> 'glass') = 'null'
         or (jsonb_typeof(recipe -> 'glass') = 'string' and char_length(recipe ->> 'glass') <= 100)), false);
$$;

-- Check constraints run as the writing role, so it must be able to execute it.
revoke execute on function private.is_valid_log_recipe(jsonb) from public;
grant execute on function private.is_valid_log_recipe(jsonb) to authenticated;

create table public.drink_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  -- The log outlives the recipe: it keeps its own copy (ADR-014).
  cocktail_id  uuid references public.cocktails (id) on delete set null,
  -- "Today" in Turkey can be tomorrow in UTC, hence the one day of slack.
  drunk_on     date not null default current_date
               check (drunk_on >= date '2000-01-01' and drunk_on <= current_date + 1),
  recipe       jsonb not null check (private.is_valid_log_recipe(recipe)),
  rating       smallint check (rating between 1 and 5),
  note         text check (note is null or char_length(note) between 1 and 2000),
  is_public    boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  hidden_at    timestamptz,
  hidden_by    uuid
);

comment on table public.drink_logs is 'A member''s log of a cocktail they made or drank: the recipe as made, the date, that evening''s rating and a note. Unlimited per cocktail (ADR-012); private unless is_public (ADR-014).';
comment on column public.drink_logs.rating is 'That evening''s rating. Never counted in the cocktail''s average; the review is the public opinion.';
comment on column public.drink_logs.recipe is 'The recipe as made, validated by private.is_valid_log_recipe().';

create index drink_logs_user_recent_idx on public.drink_logs (user_id, drunk_on desc, created_at desc);
create index drink_logs_cocktail_id_idx on public.drink_logs (cocktail_id);

-- updated_at is the author's last edit: hiding must not move it (as reviews).
create trigger drink_logs_set_updated_at
  before update of drunk_on, recipe, rating, note, is_public on public.drink_logs
  for each row execute function public.set_updated_at();

create trigger drink_logs_guard_moderation
  before insert or update on public.drink_logs
  for each row execute function private.guard_moderation();

-- Daily volume limit (ADR-014 principle 6): 50 new logs per member per day.
create function private.limit_drink_logs()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.drink_logs
      where user_id = new.user_id and created_at > now() - interval '1 day') >= 50 then
    raise exception 'Daily drink log limit reached' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

revoke execute on function private.limit_drink_logs() from public, anon, authenticated;

create trigger drink_logs_limit
  before insert on public.drink_logs
  for each row execute function private.limit_drink_logs();

-- Grants: take back the defaults; columns where members must not touch the rest.
revoke all on public.drink_logs from anon, authenticated;

grant select on public.drink_logs to anon, authenticated;
grant insert (user_id, cocktail_id, drunk_on, recipe, rating, note, is_public) on public.drink_logs to authenticated;
grant update (drunk_on, recipe, rating, note, is_public, hidden_at) on public.drink_logs to authenticated;
grant delete on public.drink_logs to authenticated;

alter table public.drink_logs enable row level security;

create policy "Anyone can read visible public logs"
  on public.drink_logs for select to anon
  using (is_public and hidden_at is null);
create policy "Signed-in users read visible public logs and their own; admins read all"
  on public.drink_logs for select to authenticated
  using ((is_public and hidden_at is null) or user_id = (select auth.uid()) or (select private.is_admin()));
create policy "Members log published cocktails"
  on public.drink_logs for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.cocktails c where c.id = cocktail_id and c.is_published)
  );
create policy "Members change their own logs; admins moderate"
  on public.drink_logs for update to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()))
  with check (user_id = (select auth.uid()) or (select private.is_admin()));
create policy "Members delete their own logs; admins delete any"
  on public.drink_logs for delete to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));
