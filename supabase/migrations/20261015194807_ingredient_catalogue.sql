-- The ingredient catalogue (M9, ADR-029): one row per thing a visitor can have at home.
-- House recipe lines point at it through cocktail_ingredients.ingredient_id; the line keeps
-- its own wording ("Kahve Likörü (Kahlua)"). Members' recipes stay free text for now.

create type public.ingredient_category as enum
  ('spirit', 'liqueur', 'juice', 'sweetener', 'mixer', 'fresh', 'other');

create table public.ingredients (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60 and name = btrim(name)),
  category public.ingredient_category not null,
  -- Counted as present without being picked (water).
  always_at_hand boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index ingredients_name_key on public.ingredients (lower(name));

alter table public.ingredients enable row level security;
revoke all on public.ingredients from anon, authenticated;
grant select on public.ingredients to anon, authenticated;
grant insert, update, delete on public.ingredients to authenticated;

create policy "Anyone can read the ingredient catalogue"
  on public.ingredients for select to anon, authenticated using (true);
create policy "Admins add catalogue ingredients"
  on public.ingredients for insert to authenticated with check ((select private.is_admin()));
create policy "Admins change catalogue ingredients"
  on public.ingredients for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Admins delete catalogue ingredients"
  on public.ingredients for delete to authenticated using ((select private.is_admin()));

alter table public.cocktail_ingredients
  add column ingredient_id uuid references public.ingredients (id) on delete restrict;
create index cocktail_ingredients_ingredient_id_idx on public.cocktail_ingredients (ingredient_id);

-- The catalogue and the house recipes' spellings that map onto it.
with catalogue (name, category, always_at_hand, spellings) as (values
  ('Votka', 'spirit', false, array['Vodka', 'Votka']),
  ('Cin', 'spirit', false, array['Cin']),
  ('Rom', 'spirit', false, array['Rom', 'Beyaz Rom']),
  ('Tekila', 'spirit', false, array['Tekila']),
  ('Viski', 'spirit', false, array['Viski', 'İrlanda Viskisi']),
  ('Aperol', 'liqueur', false, array['Aperol']),
  ('Baileys', 'liqueur', false, array['Baileys']),
  ('Blue Curaçao', 'liqueur', false, array['Blue Curaçao']),
  ('Jägermeister', 'liqueur', false, array['Jägermeister']),
  ('Kahve Likörü', 'liqueur', false, array['Kahlua', 'Kahve Likörü', 'Kahve Likörü (Kahlua)']),
  ('Malibu', 'liqueur', false, array['Malibu']),
  ('Portakal Likörü', 'liqueur', false, array['Portakal Likörü']),
  ('Şeftali Likörü', 'liqueur', false, array['Şeftali Likörü']),
  ('Prosecco', 'liqueur', false, array['Şampanya (Prosecco)']),
  ('Ananas Suyu', 'juice', false, array['Ananas Suyu']),
  ('Cranberry Suyu', 'juice', false, array['Cranberry Suyu']),
  ('Elma Suyu', 'juice', false, array['Elma Suyu']),
  ('Greyfurt Suyu', 'juice', false, array['Greyfurt Suyu']),
  ('Portakal Suyu', 'juice', false, array['Portakal Suyu']),
  ('Şeker Şurubu', 'sweetener', false, array['Şeker Şurubu']),
  ('Bal', 'sweetener', false, array['Bal']),
  ('Esmer Şeker', 'sweetener', false, array['Esmer Şeker']),
  ('Grenadine', 'sweetener', false, array['Grenadine']),
  ('Frambuaz Şurubu', 'sweetener', false, array['Frambuaz Şurubu']),
  ('Blue Curaçao Şurubu', 'sweetener', false, array['Blue Curaçao Şurubu']),
  ('Sweet & Sour', 'sweetener', false, array['Sweet & Sour']),
  ('Çilek Püresi', 'sweetener', false, array['Çilek Püresi']),
  ('Soda', 'mixer', false, array['Soda']),
  ('Tonik', 'mixer', false, array['Tonik']),
  ('Kola', 'mixer', false, array['Kola']),
  ('Sprite', 'mixer', false, array['Sprite']),
  ('Zencefilli Gazoz', 'mixer', false, array['Zencefilli Gazoz']),
  ('Kahve', 'mixer', false, array['Espresso', 'Sıcak Kahve']),
  ('Çay', 'mixer', false, array['Poşet Çay']),
  ('Hibiskus Çayı', 'mixer', false, array['Hibiskus Çayı']),
  ('Süt', 'mixer', false, array['Süt']),
  ('Krema', 'mixer', false, array['Krema', 'Krema/Süt']),
  ('Limon', 'fresh', false, array['Limon', 'Limon Suyu']),
  ('Lime', 'fresh', false, array['Lime (Dilimlenmiş)', 'Lime Suyu']),
  ('Nane', 'fresh', false, array['Nane', 'Taze Nane']),
  ('Fesleğen', 'fresh', false, array['Fesleğen']),
  ('Adaçayı', 'fresh', false, array['Taze Adaçayı']),
  ('Kuzu Kulağı', 'fresh', false, array['Kuzu Kulağı']),
  ('Salatalık', 'fresh', false, array['Salatalık', 'Salatalık Suyu']),
  ('Çilek', 'fresh', false, array['Çilek']),
  ('Böğürtlen', 'fresh', false, array['Böğürtlen']),
  ('Elma', 'fresh', false, array['Elma']),
  ('Yumurta', 'fresh', false, array['Yumurta Akı']),
  ('Aquafaba', 'other', false, array['Aquafaba']),
  ('Su', 'other', true, array['Sıcak Su'])
),
inserted as (
  insert into public.ingredients (name, category, always_at_hand)
  select name, category::public.ingredient_category, always_at_hand from catalogue
  returning id, name
)
update public.cocktail_ingredients ci
set ingredient_id = i.id
from inserted i
join catalogue c on c.name = i.name
join public.cocktails k on true
where k.id = ci.cocktail_id and k.author_id is null and ci.name = any (c.spellings);

-- House recipes must name a catalogue ingredient on every line.
create or replace function public.save_cocktail(cocktail jsonb, ingredients jsonb)
 returns uuid
 language plpgsql
 set search_path to ''
as $function$
declare
  v_id uuid := nullif(cocktail ->> 'id', '')::uuid;
begin
  if not (select private.is_admin()) then
    raise exception 'Only admins can save cocktails' using errcode = '42501';
  end if;

  if exists (
    select 1 from jsonb_array_elements(coalesce(ingredients, '[]')) as t (item)
    where nullif(t.item ->> 'ingredient_id', '') is null
  ) and not exists (
    select 1 from public.cocktails where id = v_id and author_id is not null
  ) then
    raise exception 'Every ingredient of a house recipe needs a catalogue ingredient' using errcode = '23514';
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

  insert into public.cocktail_ingredients (cocktail_id, position, name, amount, unit, icon, ingredient_id)
  select v_id, t.ord::smallint, t.item ->> 'name', (t.item ->> 'amount')::numeric,
         t.item ->> 'unit', (t.item ->> 'icon')::public.ingredient_icon,
         nullif(t.item ->> 'ingredient_id', '')::uuid
  from jsonb_array_elements(coalesce(ingredients, '[]')) with ordinality as t (item, ord);

  return v_id;
end;
$function$;
