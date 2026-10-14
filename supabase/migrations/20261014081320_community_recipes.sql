-- Community recipes, follows and log comments (ADR-014, ADR-018, M6).
-- Members write recipes into the same cocktails table (author_id set; null =
-- a house recipe), follow each other, and comment on public drink logs.

-- Reports can now point at a comment. The new value is not used in this
-- transaction, which is what Postgres requires.
alter type public.report_target add value if not exists 'log_comment';

-- ---------------------------------------------------------------- cocktails

alter table public.cocktails
  add column author_id uuid references public.profiles (id) on delete cascade,
  add column hidden_at timestamptz,
  add column hidden_by uuid;

comment on column public.cocktails.author_id is 'The member who wrote the recipe; null = a house recipe (Hacı''s). House recipes are written only by admins (ADR-014).';

create index cocktails_author_recent_idx on public.cocktails (author_id, created_at desc) where author_id is not null;

-- Members' recipes have limits; house recipes keep the panel's freedom.
-- Members' photos live in their own folder of the recipe-images bucket.
alter table public.cocktails add constraint cocktails_community_limits check (
  author_id is null or (
        char_length(name) between 1 and 100
    and char_length(subtitle) <= 200
    and char_length(base_alcohol) between 1 and 50
    and char_length(flavor) between 1 and 50
    and cardinality(tags) <= 10
    and char_length(array_to_string(tags, ',')) <= 300
    and cardinality(instructions) between 1 and 30
    and char_length(array_to_string(instructions, '')) <= 15000
    and char_length(garnish) <= 200
    and char_length(glass) <= 100
    and (note is null or char_length(note) <= 2000)
    and (image_path is null or starts_with(image_path, author_id::text || '/'))
  )
);

alter table public.cocktail_ingredients
  add constraint cocktail_ingredients_name_length check (char_length(name) between 1 and 100),
  add constraint cocktail_ingredients_unit_length check (char_length(unit) between 1 and 20);

-- updated_at is the author's last edit: hiding must not move it (as reviews, logs).
drop trigger cocktails_set_updated_at on public.cocktails;
create trigger cocktails_set_updated_at
  before update of slug, name, subtitle, base_alcohol, flavor, tags, color, image_path,
                   instructions, garnish, glass, vegan, note, sort_order, is_published
  on public.cocktails
  for each row execute function public.set_updated_at();

create trigger cocktails_guard_moderation
  before insert or update on public.cocktails
  for each row execute function private.guard_moderation();

-- Daily volume limit (ADR-014 principle 6): 10 new recipes per member per day.
create function private.limit_recipes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.author_id is not null and (select count(*) from public.cocktails
      where author_id = new.author_id and created_at > now() - interval '1 day') >= 10 then
    raise exception 'Daily recipe limit reached' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

revoke execute on function private.limit_recipes() from public, anon, authenticated;

create trigger cocktails_limit
  before insert on public.cocktails
  for each row execute function private.limit_recipes();

-- Policies: one per role and action. Members write only their own recipes and
-- can never write a house recipe (author_id must be theirs); admins write all.
drop policy "Anyone can read published cocktails" on public.cocktails;
drop policy "Signed-in users read published cocktails, admins read all" on public.cocktails;
drop policy "Admins can add cocktails" on public.cocktails;
drop policy "Admins can change cocktails" on public.cocktails;
drop policy "Admins can delete cocktails" on public.cocktails;

create policy "Anyone can read visible published cocktails"
  on public.cocktails for select to anon
  using (is_published and hidden_at is null);
create policy "Signed-in users read visible published cocktails and their own; admins read all"
  on public.cocktails for select to authenticated
  using ((is_published and hidden_at is null) or author_id = (select auth.uid()) or (select private.is_admin()));
create policy "Members add their own recipes; admins add any"
  on public.cocktails for insert to authenticated
  with check (author_id = (select auth.uid()) or (select private.is_admin()));
create policy "Members change their own recipes; admins change any"
  on public.cocktails for update to authenticated
  using (author_id = (select auth.uid()) or (select private.is_admin()))
  with check (author_id = (select auth.uid()) or (select private.is_admin()));
create policy "Members delete their own recipes; admins delete any"
  on public.cocktails for delete to authenticated
  using (author_id = (select auth.uid()) or (select private.is_admin()));

drop policy "Anyone can read ingredients of published cocktails" on public.cocktail_ingredients;
drop policy "Signed-in users read ingredients of published cocktails, admins read all" on public.cocktail_ingredients;
drop policy "Admins can add ingredients" on public.cocktail_ingredients;
drop policy "Admins can change ingredients" on public.cocktail_ingredients;
drop policy "Admins can delete ingredients" on public.cocktail_ingredients;

create policy "Anyone can read ingredients of visible published cocktails"
  on public.cocktail_ingredients for select to anon
  using (exists (select 1 from public.cocktails c
                 where c.id = cocktail_id and c.is_published and c.hidden_at is null));
create policy "Signed-in users read ingredients of cocktails they can read"
  on public.cocktail_ingredients for select to authenticated
  using (
    (select private.is_admin())
    or exists (select 1 from public.cocktails c
               where c.id = cocktail_id
                 and ((c.is_published and c.hidden_at is null) or c.author_id = (select auth.uid())))
  );
create policy "Members add ingredients to their own recipes; admins to any"
  on public.cocktail_ingredients for insert to authenticated
  with check (
    (select private.is_admin())
    or exists (select 1 from public.cocktails c where c.id = cocktail_id and c.author_id = (select auth.uid()))
  );
create policy "Members change ingredients of their own recipes; admins of any"
  on public.cocktail_ingredients for update to authenticated
  using (
    (select private.is_admin())
    or exists (select 1 from public.cocktails c where c.id = cocktail_id and c.author_id = (select auth.uid()))
  )
  with check (
    (select private.is_admin())
    or exists (select 1 from public.cocktails c where c.id = cocktail_id and c.author_id = (select auth.uid()))
  );
create policy "Members delete ingredients of their own recipes; admins of any"
  on public.cocktail_ingredients for delete to authenticated
  using (
    (select private.is_admin())
    or exists (select 1 from public.cocktails c where c.id = cocktail_id and c.author_id = (select auth.uid()))
  );

-- save_cocktail stays the panel's (house recipes). Members save through
-- save_recipe: one transaction for the recipe and its ingredients, always as
-- their own recipe, with the caller's rights so the policies above decide.
-- The slug is set once at creation, so a shared link keeps working.
create function public.save_recipe(recipe jsonb, ingredients jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_id  uuid := nullif(recipe ->> 'id', '')::uuid;
begin
  if v_uid is null then
    raise exception 'Sign in to save a recipe' using errcode = '42501';
  end if;
  if jsonb_typeof(ingredients) is distinct from 'array' or jsonb_array_length(ingredients) not between 1 and 30 then
    raise exception 'A recipe has 1 to 30 ingredients' using errcode = '23514';
  end if;

  if v_id is null then
    insert into public.cocktails (
      author_id, slug, name, subtitle, base_alcohol, flavor, tags, color, image_path,
      instructions, garnish, glass, vegan, note, sort_order, is_published
    ) values (
      v_uid,
      recipe ->> 'slug',
      recipe ->> 'name',
      coalesce(recipe ->> 'subtitle', ''),
      recipe ->> 'base_alcohol',
      recipe ->> 'flavor',
      array(select jsonb_array_elements_text(coalesce(recipe -> 'tags', '[]'))),
      recipe ->> 'color',
      nullif(recipe ->> 'image_path', ''),
      array(select jsonb_array_elements_text(coalesce(recipe -> 'instructions', '[]'))),
      coalesce(recipe ->> 'garnish', ''),
      coalesce(recipe ->> 'glass', ''),
      coalesce((recipe ->> 'vegan')::boolean, false),
      nullif(recipe ->> 'note', ''),
      0,
      coalesce((recipe ->> 'is_published')::boolean, true)
    )
    returning id into v_id;
  else
    update public.cocktails set
      name = recipe ->> 'name',
      subtitle = coalesce(recipe ->> 'subtitle', ''),
      base_alcohol = recipe ->> 'base_alcohol',
      flavor = recipe ->> 'flavor',
      tags = array(select jsonb_array_elements_text(coalesce(recipe -> 'tags', '[]'))),
      color = recipe ->> 'color',
      image_path = nullif(recipe ->> 'image_path', ''),
      instructions = array(select jsonb_array_elements_text(coalesce(recipe -> 'instructions', '[]'))),
      garnish = coalesce(recipe ->> 'garnish', ''),
      glass = coalesce(recipe ->> 'glass', ''),
      vegan = coalesce((recipe ->> 'vegan')::boolean, false),
      note = nullif(recipe ->> 'note', ''),
      is_published = coalesce((recipe ->> 'is_published')::boolean, true)
    where id = v_id and author_id = v_uid
    returning id into v_id;

    if v_id is null then
      raise exception 'Recipe not found' using errcode = 'P0002';
    end if;
  end if;

  delete from public.cocktail_ingredients where cocktail_id = v_id;

  insert into public.cocktail_ingredients (cocktail_id, position, name, amount, unit, icon)
  select v_id, t.ord::smallint, t.item ->> 'name', (t.item ->> 'amount')::numeric,
         t.item ->> 'unit', (t.item ->> 'icon')::public.ingredient_icon
  from jsonb_array_elements(ingredients) with ordinality as t (item, ord);

  return v_id;
end;
$$;

revoke execute on function public.save_recipe(jsonb, jsonb) from public, anon;
grant execute on function public.save_recipe(jsonb, jsonb) to authenticated;

-- Members' recipe photos: a public bucket, one folder per member, 1 MB a file
-- (the browser resizes to 1600 px WebP first). Never overwritten (ADR-006).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('recipe-images', 'recipe-images', true, 1048576, array['image/webp', 'image/jpeg']);

create policy "Members list their own recipe images"
  on storage.objects for select to authenticated
  using (bucket_id = 'recipe-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Members upload recipe images to their own folder"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'recipe-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Members delete their own recipe images; admins delete any"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'recipe-images'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or (select private.is_admin()))
  );

-- "Popular" on the feed: visible reviews and favourites of the last 30 days
-- per published community recipe. Security invoker, so the caller's policies
-- apply; hidden content and hidden profiles are left out explicitly.
create view public.recipe_popularity
with (security_invoker = on) as
select c.id as cocktail_id,
       r.n as recent_reviews,
       f.n as recent_favorites,
       r.n + f.n as score
from public.cocktails c
cross join lateral (
  select count(*)::integer as n
  from public.reviews rv
  join public.profiles p on p.id = rv.user_id
  where rv.cocktail_id = c.id and rv.hidden_at is null and p.hidden_at is null
    and rv.updated_at > now() - interval '30 days'
) r
cross join lateral (
  select count(*)::integer as n
  from public.favorites fv
  join public.profiles p on p.id = fv.user_id
  where fv.cocktail_id = c.id and p.hidden_at is null
    and fv.created_at > now() - interval '30 days'
) f
where c.author_id is not null and c.is_published and c.hidden_at is null;

comment on view public.recipe_popularity is 'Recent activity (reviews + favourites, last 30 days) per visible community recipe, for the feed.';

revoke all on public.recipe_popularity from anon, authenticated;
grant select on public.recipe_popularity to anon, authenticated;

-- ---------------------------------------------------------------- follows

create table public.follows (
  follower_id  uuid not null references public.profiles (id) on delete cascade,
  followee_id  uuid not null references public.profiles (id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);

comment on table public.follows is 'Who follows whom; public, as on Letterboxd (ADR-018). The feed shows the public logs of the people a member follows.';

create index follows_followee_id_idx on public.follows (followee_id);

-- 200 new follows per member per day.
create function private.limit_follows()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.follows
      where follower_id = new.follower_id and created_at > now() - interval '1 day') >= 200 then
    raise exception 'Daily follow limit reached' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

revoke execute on function private.limit_follows() from public, anon, authenticated;

create trigger follows_limit
  before insert on public.follows
  for each row execute function private.limit_follows();

revoke all on public.follows from anon, authenticated;
grant select on public.follows to anon, authenticated;
grant insert (follower_id, followee_id) on public.follows to authenticated;
grant delete on public.follows to authenticated;

alter table public.follows enable row level security;

create policy "Anyone can read follows"
  on public.follows for select to anon, authenticated
  using (true);
-- The followee must be a profile the member can see (hidden ones cannot be followed).
create policy "Members follow visible profiles"
  on public.follows for insert to authenticated
  with check (
    follower_id = (select auth.uid())
    and exists (select 1 from public.profiles p where p.id = followee_id and p.hidden_at is null)
  );
create policy "Members unfollow"
  on public.follows for delete to authenticated
  using (follower_id = (select auth.uid()));

-- ---------------------------------------------------------------- log comments

create table public.log_comments (
  id          uuid primary key default gen_random_uuid(),
  log_id      uuid not null references public.drink_logs (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  body        text not null check (char_length(btrim(body)) between 1 and 1000),
  created_at  timestamptz not null default now(),
  hidden_at   timestamptz,
  hidden_by   uuid
);

comment on table public.log_comments is 'A flat comment thread under a public drink log; the log''s author replies in the same thread (ADR-018).';

create index log_comments_log_idx on public.log_comments (log_id, created_at);
create index log_comments_user_id_idx on public.log_comments (user_id);

create trigger log_comments_guard_moderation
  before insert or update on public.log_comments
  for each row execute function private.guard_moderation();

-- 100 comments per member per day.
create function private.limit_log_comments()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.log_comments
      where user_id = new.user_id and created_at > now() - interval '1 day') >= 100 then
    raise exception 'Daily comment limit reached' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

revoke execute on function private.limit_log_comments() from public, anon, authenticated;

create trigger log_comments_limit
  before insert on public.log_comments
  for each row execute function private.limit_log_comments();

revoke all on public.log_comments from anon, authenticated;
grant select on public.log_comments to anon, authenticated;
grant insert (log_id, user_id, body) on public.log_comments to authenticated;
grant update (hidden_at) on public.log_comments to authenticated;
grant delete on public.log_comments to authenticated;

alter table public.log_comments enable row level security;

-- A comment is readable only while its log is (the subquery runs under the
-- drink_logs policies: public and visible, or the reader's own).
create policy "Anyone can read visible comments on public logs"
  on public.log_comments for select to anon
  using (
    hidden_at is null
    and exists (select 1 from public.drink_logs l where l.id = log_id and l.is_public and l.hidden_at is null)
  );
create policy "Signed-in users read comments on logs they can read"
  on public.log_comments for select to authenticated
  using (
    (hidden_at is null or user_id = (select auth.uid()) or (select private.is_admin()))
    and exists (select 1 from public.drink_logs l where l.id = log_id)
  );
create policy "Members comment on visible public logs"
  on public.log_comments for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.drink_logs l where l.id = log_id and l.is_public and l.hidden_at is null)
  );
create policy "Admins moderate comments"
  on public.log_comments for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));
-- The commenter, the log's author (on their own log) and admins delete.
create policy "Commenters and log authors delete comments; admins delete any"
  on public.log_comments for delete to authenticated
  using (
    user_id = (select auth.uid())
    or (select private.is_admin())
    or exists (select 1 from public.drink_logs l where l.id = log_id and l.user_id = (select auth.uid()))
  );
