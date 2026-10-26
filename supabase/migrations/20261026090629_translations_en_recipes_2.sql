-- English house recipes, batch 2 of 4 (rn 11–20 by sort_order): caipiroska … black-russian (docs/glossary.md, ADR-032).
insert into public.cocktail_translations
  (cocktail_id, locale, subtitle, base_alcohol, flavor, tags, garnish, glass, note, instructions, ingredient_names)
select c.id, 'en', v.subtitle, v.base_alcohol, v.flavor, v.tags, v.garnish, v.glass, v.note, v.instructions, v.ingredient_names
from (values
  ('caipiroska', 'Russian roulette, Brazilian style', 'Vodka', 'Sour-Sweet',
   array['Vodka','Lime','Classic']::text[], 'Lime', 'Rocks', null,
   array['Muddle the lime and sugar well in the glass.','Add crushed ice, pour in the vodka and stir.']::text[],
   array['Vodka','Lime (sliced)','Brown sugar']::text[]),
  ('cosmopolitan', 'A small concession to pop culture', 'Vodka', 'Fruity',
   array['Vodka','Cranberry','Classic']::text[], 'Flamed orange peel', 'Martini', null,
   array['Shake all the ingredients with ice and strain into the glass.']::text[],
   array['Vodka','Orange liqueur','Lime juice','Cranberry juice']::text[]),
  ('cuba-libre', 'Viva la Revolución!', 'Rum', 'Sweet',
   array['Rum','Cola','Classic']::text[], 'Lime slice', 'Highball', null,
   array['Add the rum and lime to a glass with ice.','Top up with cola.']::text[],
   array['Rum','Cola','Lime juice']::text[]),
  ('moscow-mule', 'A Soviet wind in a copper mug', 'Vodka', 'Spiced',
   array['Vodka','Ginger','Lime','Classic']::text[], 'Fresh mint and lime', 'Copper mug', null,
   array['Add ice to the copper mug and pour in the ingredients.','Top up with ginger soda and stir gently.']::text[],
   array['Vodka','Lime juice','Ginger soda','Mint']::text[]),
  ('blue-hawaii', 'Capitalism''s neon dream', 'Vodka', 'Tropical',
   array['Vodka','Rum','Pineapple','Blue']::text[], 'Pineapple slice and cherry', 'Hurricane / Highball', null,
   array['Shake with ice and strain into a tall glass.']::text[],
   array['Vodka','White rum','Blue curaçao syrup','Pineapple juice']::text[]),
  ('cin-cilegi', 'From the field to the glass', 'Gin', 'Fruity',
   array['Gin','Strawberry','Refreshing']::text[], 'Strawberry slice', 'Highball', null,
   array['Muddle the strawberries in the shaker.','Add the gin, lemon and simple syrup, then shake.','Strain into a glass over ice and top up with soda.']::text[],
   array['Gin','Strawberry','Lemon juice','Simple syrup','Soda water']::text[]),
  ('sea-breeze', 'An ocean breeze', 'Vodka', 'Sour-Sweet',
   array['Vodka','Grapefruit','Fruity']::text[], 'Grapefruit slice', 'Highball', null,
   array['Add the ingredients in order to a glass filled with ice and stir.']::text[],
   array['Vodka','Cranberry juice','Grapefruit juice']::text[]),
  ('espresso-martini', 'The only cure for medical school exams', 'Vodka', 'Coffee',
   array['Vodka','Coffee','Energy']::text[], '3 coffee beans', 'Martini / Coupe',
   'The ideal balance of caffeine and alcohol before the gym or while pulling an all-nighter before exams.',
   array['Shake all the ingredients very hard in a shaker with plenty of ice (for the foam).','Strain into a chilled glass.']::text[],
   array['Vodka','Coffee liqueur (Kahlúa)','Espresso']::text[]),
  ('bees-knees', 'The labor of the working-class bees', 'Gin', 'Sweet-Sour',
   array['Gin','Sweet','Classic']::text[], 'Lemon peel', 'Coupe', null,
   array['Shake with ice in a shaker and strain into the glass.']::text[],
   array['Gin','Lemon juice','Simple syrup']::text[]),
  ('black-russian', 'A dark reflection on the silver screen', 'Vodka', 'Sweet',
   array['Vodka','Coffee','Milk']::text[], 'None', 'Rocks',
   'Not vegan, because it contains milk. Best sipped while watching The Big Lebowski.',
   array['Add the vodka and liqueur to a glass with ice.','Slowly pour the milk on top.']::text[],
   array['Vodka','Coffee liqueur','Milk']::text[])
) as v(slug, subtitle, base_alcohol, flavor, tags, garnish, glass, note, instructions, ingredient_names)
join public.cocktails c on c.slug = v.slug
on conflict (cocktail_id, locale) do update set
  subtitle = excluded.subtitle, base_alcohol = excluded.base_alcohol, flavor = excluded.flavor, tags = excluded.tags,
  garnish = excluded.garnish, glass = excluded.glass, note = excluded.note, instructions = excluded.instructions,
  ingredient_names = excluded.ingredient_names;
