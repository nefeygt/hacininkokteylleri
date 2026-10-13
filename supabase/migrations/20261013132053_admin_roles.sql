-- Admins (ADR-007): people who sign in to admin.hacininkokteylleri.tech and edit
-- content. Being signed in is not enough — a user must have a row here. The
-- owner (the site's maintainer) and editors (Hacı) have the same content rights
-- today; the role exists so owner-only screens can be added without a migration.

create type public.admin_role as enum ('owner', 'editor');

create table public.admins (
  user_id       uuid primary key references auth.users (id) on delete cascade,
  role          public.admin_role not null default 'editor',
  display_name  text not null,
  created_at    timestamptz not null default now()
);

comment on table public.admins is 'Who may edit content. Rows are added by hand (SQL or dashboard) after the user is created in Authentication.';

-- Helpers live in a schema the Data API does not expose, so nobody can call
-- them over HTTP; policies still can.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

create function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;

revoke execute on function private.is_admin() from public;
grant execute on function private.is_admin() to anon, authenticated;

-- admins: an admin can see who the admins are; nobody writes over the API.
alter table public.admins enable row level security;
revoke all on public.admins from anon, authenticated;
grant select on public.admins to authenticated;

create policy "Admins can see the admin list"
  on public.admins for select
  to authenticated
  using ((select private.is_admin()));

-- Content: anon keeps reading published rows; a signed-in admin reads
-- everything and writes everything. One policy per role and action, so no two
-- permissive policies overlap.
drop policy "Published cocktails are public" on public.cocktails;
drop policy "Ingredients of published cocktails are public" on public.cocktail_ingredients;
drop policy "Glossary is public" on public.glossary_terms;

grant insert, update, delete on public.cocktails, public.cocktail_ingredients, public.glossary_terms to authenticated;

-- cocktails
create policy "Anyone can read published cocktails"
  on public.cocktails for select to anon
  using (is_published);
create policy "Signed-in users read published cocktails, admins read all"
  on public.cocktails for select to authenticated
  using (is_published or (select private.is_admin()));
create policy "Admins can add cocktails"
  on public.cocktails for insert to authenticated
  with check ((select private.is_admin()));
create policy "Admins can change cocktails"
  on public.cocktails for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));
create policy "Admins can delete cocktails"
  on public.cocktails for delete to authenticated
  using ((select private.is_admin()));

-- cocktail_ingredients
create policy "Anyone can read ingredients of published cocktails"
  on public.cocktail_ingredients for select to anon
  using (exists (select 1 from public.cocktails c where c.id = cocktail_id and c.is_published));
create policy "Signed-in users read ingredients of published cocktails, admins read all"
  on public.cocktail_ingredients for select to authenticated
  using (
    (select private.is_admin())
    or exists (select 1 from public.cocktails c where c.id = cocktail_id and c.is_published)
  );
create policy "Admins can add ingredients"
  on public.cocktail_ingredients for insert to authenticated
  with check ((select private.is_admin()));
create policy "Admins can change ingredients"
  on public.cocktail_ingredients for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));
create policy "Admins can delete ingredients"
  on public.cocktail_ingredients for delete to authenticated
  using ((select private.is_admin()));

-- glossary_terms
create policy "Anyone can read the glossary"
  on public.glossary_terms for select to anon, authenticated
  using (true);
create policy "Admins can add glossary terms"
  on public.glossary_terms for insert to authenticated
  with check ((select private.is_admin()));
create policy "Admins can change glossary terms"
  on public.glossary_terms for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));
create policy "Admins can delete glossary terms"
  on public.glossary_terms for delete to authenticated
  using ((select private.is_admin()));

-- Images: admins upload, replace and delete. The bucket is public, so reading
-- an object by URL needs no policy; this SELECT is what lets an admin list the
-- bucket and overwrite (upsert) an object.
create policy "Admins can list cocktail images"
  on storage.objects for select to authenticated
  using (bucket_id = 'cocktail-images' and (select private.is_admin()));
create policy "Admins can upload cocktail images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'cocktail-images' and (select private.is_admin()));
create policy "Admins can replace cocktail images"
  on storage.objects for update to authenticated
  using (bucket_id = 'cocktail-images' and (select private.is_admin()))
  with check (bucket_id = 'cocktail-images' and (select private.is_admin()));
create policy "Admins can delete cocktail images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'cocktail-images' and (select private.is_admin()));

-- Browsers that cannot encode WebP (older Safari) upload JPEG instead.
update storage.buckets
set allowed_mime_types = array['image/webp', 'image/jpeg']
where id = 'cocktail-images';

-- Saving a cocktail and its ingredient list is one transaction. Runs with the
-- caller's rights, so the policies above still decide.
create function public.save_cocktail(cocktail jsonb, ingredients jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid := nullif(cocktail ->> 'id', '')::uuid;
begin
  if not (select private.is_admin()) then
    raise exception 'Only admins can save cocktails' using errcode = '42501';
  end if;

  if v_id is null then
    insert into public.cocktails (
      slug, name, subtitle, base_alcohol, flavor, tags, color, image_path,
      instructions, garnish, glass, vegan, note, sort_order, is_published
    ) values (
      cocktail ->> 'slug',
      cocktail ->> 'name',
      coalesce(cocktail ->> 'subtitle', ''),
      cocktail ->> 'base_alcohol',
      cocktail ->> 'flavor',
      array(select jsonb_array_elements_text(coalesce(cocktail -> 'tags', '[]'))),
      cocktail ->> 'color',
      nullif(cocktail ->> 'image_path', ''),
      array(select jsonb_array_elements_text(coalesce(cocktail -> 'instructions', '[]'))),
      coalesce(cocktail ->> 'garnish', ''),
      coalesce(cocktail ->> 'glass', ''),
      coalesce((cocktail ->> 'vegan')::boolean, false),
      nullif(cocktail ->> 'note', ''),
      coalesce((cocktail ->> 'sort_order')::integer, 0),
      coalesce((cocktail ->> 'is_published')::boolean, true)
    )
    returning id into v_id;
  else
    update public.cocktails set
      slug = cocktail ->> 'slug',
      name = cocktail ->> 'name',
      subtitle = coalesce(cocktail ->> 'subtitle', ''),
      base_alcohol = cocktail ->> 'base_alcohol',
      flavor = cocktail ->> 'flavor',
      tags = array(select jsonb_array_elements_text(coalesce(cocktail -> 'tags', '[]'))),
      color = cocktail ->> 'color',
      image_path = nullif(cocktail ->> 'image_path', ''),
      instructions = array(select jsonb_array_elements_text(coalesce(cocktail -> 'instructions', '[]'))),
      garnish = coalesce(cocktail ->> 'garnish', ''),
      glass = coalesce(cocktail ->> 'glass', ''),
      vegan = coalesce((cocktail ->> 'vegan')::boolean, false),
      note = nullif(cocktail ->> 'note', ''),
      sort_order = coalesce((cocktail ->> 'sort_order')::integer, 0),
      is_published = coalesce((cocktail ->> 'is_published')::boolean, true)
    where id = v_id
    returning id into v_id;

    if v_id is null then
      raise exception 'Cocktail not found' using errcode = 'P0002';
    end if;
  end if;

  delete from public.cocktail_ingredients where cocktail_id = v_id;

  insert into public.cocktail_ingredients (cocktail_id, position, name, amount, unit, icon)
  select v_id, t.ord::smallint, t.item ->> 'name', (t.item ->> 'amount')::numeric,
         t.item ->> 'unit', (t.item ->> 'icon')::public.ingredient_icon
  from jsonb_array_elements(coalesce(ingredients, '[]')) with ordinality as t (item, ord);

  return v_id;
end;
$$;

revoke execute on function public.save_cocktail(jsonb, jsonb) from public, anon;
grant execute on function public.save_cocktail(jsonb, jsonb) to authenticated;
