-- Map the remaining house lines (an unpublished draft spelled them in lower case) and add
-- the two items the catalogue still lacked.
insert into public.ingredients (name, category) values
  ('Çilek Şurubu', 'sweetener'),
  ('Nar Suyu', 'juice');

update public.cocktail_ingredients ci
set ingredient_id = i.id
from public.ingredients i, public.cocktails k
where k.id = ci.cocktail_id and k.author_id is null and ci.ingredient_id is null
  and i.name = case lower(ci.name)
    when 'cin' then 'Cin'
    when 'sweet sour' then 'Sweet & Sour'
    when 'çilek şurubu' then 'Çilek Şurubu'
    when 'nar suyu' then 'Nar Suyu'
  end;
