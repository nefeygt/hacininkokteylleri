-- English house recipes, batch 1 of 4 (rn 1–10 by sort_order): kuzu-kulagi-devrimi … b-52 (docs/glossary.md, ADR-032).
-- Cocktail names stay as written (name is null); ingredient_names are by position.
insert into public.cocktail_translations
  (cocktail_id, locale, subtitle, base_alcohol, flavor, tags, garnish, glass, note, instructions, ingredient_names)
select c.id, 'en', v.subtitle, v.base_alcohol, v.flavor, v.tags, v.garnish, v.glass, v.note, v.instructions, v.ingredient_names
from (values
  ('kuzu-kulagi-devrimi', 'Anarchic acidity from nature', 'Vodka', 'Sour',
   array['Vodka','Sorrel','Apple','Refreshing']::text[], 'Fresh sorrel leaf', 'Rocks',
   'A taste that pushes you out of the ordinary and makes you question.',
   array['Muddle the sorrel and apple well in the shaker.','Add the vodka, lemon and simple syrup.','Shake hard with ice and double-strain.']::text[],
   array['Vodka','Lemon juice','Simple syrup','Apple','Sorrel']::text[]),
  ('ferah-manifesto', 'Plain, clear and invigorating', 'Gin', 'Refreshing',
   array['Gin','Cucumber','Tonic','Refreshing']::text[], 'Cucumber ribbon', 'Highball', null,
   array['Muddle the cucumber.','Add the gin, lemon and simple syrup, then shake.','Strain into a glass over ice and top up with a little tonic.']::text[],
   array['Gin','Lemon juice','Simple syrup','Cucumber','Tonic water']::text[]),
  ('sovyet-elmasi', 'The people''s everyday refreshment', 'Vodka', 'Sweet-Sour',
   array['Vodka','Apple','Easy']::text[], 'Apple slice', 'Highball', null,
   array['Add the vodka and apple juice to a glass filled with ice.','Top lightly with Sprite and stir.']::text[],
   array['Vodka','Apple juice','Sprite']::text[]),
  ('mavi-isci', 'The dystopian break of blue-collar workers', 'Vodka', 'Sweet-Sour',
   array['Vodka','Blue','Citrus']::text[], 'Lemon peel', 'Martini / Coupe', null,
   array['Shake all the ingredients with ice and strain.']::text[],
   array['Vodka','Lemon juice','Simple syrup','Blue Curaçao']::text[]),
  ('aperol-spritz', 'In defiance of the Italian bourgeoisie', 'Aperitif', 'Bittersweet',
   array['Aperol','Sparkling wine','Refreshing','Classic']::text[], 'Orange slice', 'Wine glass', null,
   array['Fill the glass with ice.','Add the Aperol, sparkling wine and soda in that order. Stir gently.']::text[],
   array['Aperol','Sparkling wine (Prosecco)','Soda water']::text[]),
  ('hemingway-daiquiri', 'A simple masterpiece', 'Rum', 'Sour',
   array['Rum','Classic','Lime']::text[], 'Lime wheel', 'Coupe', null,
   array['Shake all the ingredients in a shaker until chilled.','Strain into a chilled glass.']::text[],
   array['White rum','Lime juice','Simple syrup']::text[]),
  ('zombie-brain', 'A cinematic massacre scene', 'Liqueur', 'Sweet',
   array['Shot','Sweet','Visual']::text[], 'None', 'Shot glass',
   'Not vegan, because it contains Baileys. As satisfying as the zombie effects in bad B movies.',
   array['Pour the peach liqueur into the shot glass first.','Slowly add the Baileys and Jägermeister so they form layers.','Finish with a few drops of grenadine on top (for the blood effect).']::text[],
   array['Peach liqueur','Baileys','Jägermeister','Grenadine']::text[]),
  ('kuba-mojito', 'Straight out of the streets of Havana', 'Rum', 'Refreshing',
   array['Rum','Mint','Classic','Refreshing']::text[], 'Mint sprig and lime', 'Highball', null,
   array['Gently muddle the mint and sugar in the glass.','Add the rum and lime juice, then fill with crushed ice.','Top up with soda and stir from the bottom.']::text[],
   array['White rum','Lime juice','Simple syrup','Fresh mint','Soda water']::text[]),
  ('rabbit-b', 'Down the rabbit hole', 'Gin', 'Sour',
   array['Gin','Cucumber','Complex']::text[], 'Cucumber roll', 'Coupe', null,
   array['Shake all the ingredients with ice in a shaker.','Serve through a fine strainer.']::text[],
   array['Gin','Sweet & sour mix','Lemon juice','Simple syrup','Cucumber juice']::text[]),
  ('b-52', 'Strategic bombing', 'Liqueur', 'Sweet',
   array['Shot','Coffee','Sweet']::text[], 'Fire (optionally flamed)', 'Shot glass', null,
   array['Layer the Kahlúa, Baileys and orange liqueur into the shot glass, in that order.']::text[],
   array['Kahlúa','Baileys','Orange liqueur']::text[])
) as v(slug, subtitle, base_alcohol, flavor, tags, garnish, glass, note, instructions, ingredient_names)
join public.cocktails c on c.slug = v.slug
on conflict (cocktail_id, locale) do update set
  subtitle = excluded.subtitle, base_alcohol = excluded.base_alcohol, flavor = excluded.flavor, tags = excluded.tags,
  garnish = excluded.garnish, glass = excluded.glass, note = excluded.note, instructions = excluded.instructions,
  ingredient_names = excluded.ingredient_names;
