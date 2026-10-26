-- English house recipes, batch 4 of 4 (rn 31–38 by sort_order): kuzu-kulagi-sour … yeni-yil (docs/glossary.md, ADR-032).
insert into public.cocktail_translations
  (cocktail_id, locale, subtitle, base_alcohol, flavor, tags, garnish, glass, note, instructions, ingredient_names)
select c.id, 'en', v.subtitle, v.base_alcohol, v.flavor, v.tags, v.garnish, v.glass, v.note, v.instructions, v.ingredient_names
from (values
  ('kuzu-kulagi-sour', 'Nature''s green manifesto, act two', 'Vodka', 'Sour',
   array['Vodka','Sorrel','Complex']::text[], 'Sorrel leaf', 'Rocks', null,
   array['Muddle the sorrel leaves.','Shake all the ingredients with ice and pass through a fine strainer.']::text[],
   array['Vodka','Orange liqueur','Sweet & sour mix','Lemon juice','Simple syrup','Sorrel']::text[]),
  ('tekila-sunrise', 'A new rebellion in Mexico', 'Tequila', 'Sweet',
   array['Tequila','Orange','Visual']::text[], 'Orange slice and cherry', 'Highball', null,
   array['Pour the tequila and orange juice into a glass with ice.','Finally, slowly drizzle the grenadine over the top to create the sunrise effect.']::text[],
   array['Tequila','Orange juice','Grenadine']::text[]),
  ('feslegen-frozen', 'A botanical brain freeze', 'Tequila', 'Sour-Refreshing',
   array['Tequila','Basil','Frozen']::text[], 'Basil leaf', 'Margarita glass',
   'A medical student favorite: the sudden cold stimulates the frontal lobe.',
   array['Put all the ingredients in the blender with plenty of crushed ice.','Blend until it is snow-like (frozen).']::text[],
   array['Tequila','Lemon juice','Simple syrup','Basil']::text[]),
  ('ruzzle-dazzle', 'Fruity dialectic within the chaos', 'Vodka', 'Fruity',
   array['Vodka','Blackberry','Cranberry']::text[], 'Blackberry and mint', 'Highball', null,
   array['Gently muddle the blackberries and mint in the shaker.','Add the remaining liquids, shake with ice and strain.']::text[],
   array['Vodka','Lime juice','Cranberry juice','Blackberry','Mint']::text[]),
  ('kiki-42', 'The red revolution of hibiscus', 'Gin', 'Floral-Sour',
   array['Gin','Hibiscus','Strawberry']::text[], 'Dried hibiscus petal', 'Highball', null,
   array['Shake all the ingredients with ice.','Strain through a fine strainer into the glass.']::text[],
   array['Gin','Hibiscus tea','Strawberry purée','Lime juice']::text[]),
  ('raspberry-dream', 'Sweet dreams and creamy illusions', 'Gin', 'Sweet-Sour',
   array['Gin','Raspberry','Cream']::text[], 'Fresh raspberry', 'Coupe',
   'Not vegan, because it contains an animal dairy product (cream).',
   array['Shake all the ingredients hard, first without ice (dry shake), then with ice.']::text[],
   array['Gin','Lemon juice','Raspberry syrup','Cream']::text[]),
  ('southside', 'A staple of mobster films', 'Gin', 'Refreshing',
   array['Gin','Mint','Classic']::text[], 'Mint leaf', 'Coupe / Martini', null,
   array['Shake the ingredients with the mint.','Strain into the glass and top up with a little soda.']::text[],
   array['Gin','Lemon juice','Simple syrup','Mint','Soda water']::text[]),
  ('yeni-yil', '', 'Gin', 'Sour-Sweet',
   array[]::text[], 'Place a sprig of fresh rosemary on the rim of the glass and drop 4–5 pomegranate seeds on top.', 'Highball / Collins', null,
   array['Add the ingredients, ice and shake: fill the shaker to the brim with hard, large ice cubes. Close the lid and shake hard for about 12–15 seconds.','Discard the resting ice from the glass you chilled. Strain the mixture from the shaker into the glass through both its own strainer and a fine mesh strainer.']::text[],
   array['Pomegranate juice','Sweet & sour mix','Strawberry syrup','Gin']::text[])
) as v(slug, subtitle, base_alcohol, flavor, tags, garnish, glass, note, instructions, ingredient_names)
join public.cocktails c on c.slug = v.slug
on conflict (cocktail_id, locale) do update set
  subtitle = excluded.subtitle, base_alcohol = excluded.base_alcohol, flavor = excluded.flavor, tags = excluded.tags,
  garnish = excluded.garnish, glass = excluded.glass, note = excluded.note, instructions = excluded.instructions,
  ingredient_names = excluded.ingredient_names;
