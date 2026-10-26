-- English house recipes, batch 3 of 4 (rn 21–30 by sort_order): klasik-viski-sour … sex-on-the-beach (docs/glossary.md, ADR-032).
insert into public.cocktail_translations
  (cocktail_id, locale, subtitle, base_alcohol, flavor, tags, garnish, glass, note, instructions, ingredient_names)
select c.id, 'en', v.subtitle, v.base_alcohol, v.flavor, v.tags, v.garnish, v.glass, v.note, v.instructions, v.ingredient_names
from (values
  ('klasik-viski-sour', 'Traditional and uncompromising', 'Whiskey', 'Sour',
   array['Whiskey','Classic','Egg']::text[], 'Drops of Angostura', 'Rocks',
   'The original recipe. Sometimes you have to leave the classics as they are.',
   array['Put all the ingredients in the shaker without ice and dry shake.','Add ice and shake again.','Strain into the glass.']::text[],
   array['Whiskey','Lemon juice','Simple syrup','Egg white']::text[]),
  ('irish-coffee', 'Hot, strong and literary', 'Whiskey', 'Coffee',
   array['Whiskey','Coffee','Hot','Sweet']::text[], 'Coffee bean', 'Toddy / Mug', null,
   array['Add the coffee, sugar and whiskey to a warmed glass.','Top up with cream or milk.']::text[],
   array['Irish whiskey','Simple syrup','Hot coffee','Cream / milk']::text[]),
  ('irish-whistea', 'For enlightenment meetings', 'Whiskey', 'Complex',
   array['Whiskey','Tea','Party size']::text[], 'Mint and cucumber', 'Carafe / Pitcher',
   'This is a party (pitcher) size. Made when people gather to enlighten society. Contains honey.',
   array['Dissolve the honey in the hot water and brew the teas.','Put ice in a large container, then add all the ingredients and the chopped fruit.','Stir well and serve.']::text[],
   array['Irish whiskey','Apple juice','Lemon','Tea bags','Honey','Hot water','Cucumber']::text[]),
  ('hecho-en-mexico', 'Cool across the border', 'Tequila', 'Sour-Spiced',
   array['Tequila','Mint','Tonic']::text[], 'Mint sprig', 'Highball', null,
   array['Shake with the mint, strain into a glass and top up with tonic.']::text[],
   array['Tequila','Lemon juice','Simple syrup','Mint','Tonic water']::text[]),
  ('nox', 'The navy blue of the night', 'Vodka', 'Sour',
   array['Vodka','Blue','Foamy','Vegan']::text[], 'Lemon peel', 'Coupe', null,
   array['Shake all the ingredients without ice (dry shake), then with ice.','Strain into the glass.']::text[],
   array['Vodka','Orange liqueur','Sweet & sour mix','Blue Curaçao','Aquafaba']::text[]),
  ('smokey-sage', 'Smoked minds', 'Gin', 'Herbal',
   array['Gin','Sage','Complex']::text[], 'Smoked sage leaf', 'Rocks', null,
   array['Lightly muddle the sage and shake it with the other ingredients.']::text[],
   array['Gin','Sweet & sour mix','Fresh sage']::text[]),
  ('ramos-gin-fizz', 'A test of patience and arm muscles', 'Gin', 'Sweet-Sour',
   array['Gin','Cream','Egg','Complex']::text[], 'None', 'Highball / Collins',
   'Anyone who doesn''t work out can''t shake this properly. Contains dairy and egg.',
   array['Dry shake all the ingredients (except the soda) for a full 1–2 minutes (call it a workout for the foam).','Add ice and shake again for a long time.','Strain into a tall glass and top up with soda to lift the foam.']::text[],
   array['Gin','Lemon juice','Simple syrup','Cream','Egg white','Soda water']::text[]),
  ('white-lady', 'Elegance straight out of a noir film', 'Gin', 'Sour',
   array['Gin','Classic','Egg']::text[], 'Lemon peel', 'Coupe', null,
   array['Dry shake first, then shake with ice, and strain.']::text[],
   array['Gin','Orange liqueur','Lemon juice','Simple syrup','Egg white']::text[]),
  ('malibu-bay-breeze', 'The plastic freshness of capitalist holidays', 'Rum', 'Sweet',
   array['Malibu','Pineapple','Tropical']::text[], 'Pineapple slice', 'Highball', null,
   array['Pour in order into a glass with ice and stir lightly.']::text[],
   array['Malibu','Cranberry juice','Pineapple juice']::text[]),
  ('sex-on-the-beach', 'Pop culture''s sweet captivity', 'Vodka', 'Sweet-Fruity',
   array['Vodka','Tequila','Peach','Classic']::text[], 'Orange slice', 'Highball', null,
   array['Shake with ice and strain into a tall glass.']::text[],
   array['Tequila','Vodka','Peach liqueur','Orange juice','Cranberry juice']::text[])
) as v(slug, subtitle, base_alcohol, flavor, tags, garnish, glass, note, instructions, ingredient_names)
join public.cocktails c on c.slug = v.slug
on conflict (cocktail_id, locale) do update set
  subtitle = excluded.subtitle, base_alcohol = excluded.base_alcohol, flavor = excluded.flavor, tags = excluded.tags,
  garnish = excluded.garnish, glass = excluded.glass, note = excluded.note, instructions = excluded.instructions,
  ingredient_names = excluded.ingredient_names;
