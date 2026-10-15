-- Members link their recipe lines to the ingredient catalogue too (amends ADR-029):
-- save_recipe now keeps each line's ingredient_id, like save_cocktail. The link is
-- optional for members (a line may name something the catalogue lacks); the foreign
-- key refuses an id that is not in the catalogue. Everything else is unchanged.
create or replace function public.save_recipe(recipe jsonb, ingredients jsonb)
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

  insert into public.cocktail_ingredients (cocktail_id, position, name, amount, unit, icon, ingredient_id)
  select v_id, t.ord::smallint, t.item ->> 'name', (t.item ->> 'amount')::numeric,
         t.item ->> 'unit', (t.item ->> 'icon')::public.ingredient_icon,
         nullif(t.item ->> 'ingredient_id', '')::uuid
  from jsonb_array_elements(ingredients) with ordinality as t (item, ord);

  return v_id;
end;
$$;
