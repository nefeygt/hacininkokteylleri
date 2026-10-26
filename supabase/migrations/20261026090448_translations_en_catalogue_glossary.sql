-- English names of the 52 catalogue ingredients and the 4 glossary terms (docs/glossary.md, ADR-032).
insert into public.ingredient_translations (ingredient_id, locale, name)
select i.id, 'en', v.en
from (values
  ('Adaçayı','Sage'), ('Böğürtlen','Blackberry'), ('Çilek','Strawberry'), ('Elma','Apple'), ('Fesleğen','Basil'),
  ('Kuzu Kulağı','Sorrel'), ('Lime','Lime'), ('Limon','Lemon'), ('Nane','Mint'), ('Salatalık','Cucumber'),
  ('Yumurta','Egg'),
  ('Ananas Suyu','Pineapple juice'), ('Cranberry Suyu','Cranberry juice'), ('Elma Suyu','Apple juice'),
  ('Greyfurt Suyu','Grapefruit juice'), ('Nar Suyu','Pomegranate juice'), ('Portakal Suyu','Orange juice'),
  ('Aperol','Aperol'), ('Baileys','Baileys'), ('Blue Curaçao','Blue Curaçao'), ('Jägermeister','Jägermeister'),
  ('Kahve Likörü','Coffee liqueur'), ('Malibu','Malibu'), ('Portakal Likörü','Orange liqueur'),
  ('Prosecco','Prosecco'), ('Şeftali Likörü','Peach liqueur'),
  ('Çay','Tea'), ('Hibiskus Çayı','Hibiscus tea'), ('Kahve','Coffee'), ('Kola','Cola'), ('Krema','Cream'),
  ('Soda','Soda water'), ('Sprite','Sprite'), ('Süt','Milk'), ('Tonik','Tonic water'),
  ('Zencefilli Gazoz','Ginger soda'),
  ('Aquafaba','Aquafaba'), ('Su','Water'),
  ('Cin','Gin'), ('Rom','Rum'), ('Tekila','Tequila'), ('Viski','Whiskey'), ('Votka','Vodka'),
  ('Bal','Honey'), ('Blue Curaçao Şurubu','Blue curaçao syrup'), ('Çilek Püresi','Strawberry purée'),
  ('Çilek Şurubu','Strawberry syrup'), ('Esmer Şeker','Brown sugar'), ('Frambuaz Şurubu','Raspberry syrup'),
  ('Grenadine','Grenadine'), ('Şeker Şurubu','Simple syrup'), ('Sweet & Sour','Sweet & sour mix')
) as v(tr, en)
join public.ingredients i on i.name = v.tr;

insert into public.glossary_term_translations (term, locale, translated_term, definition) values
  ('Aquafaba', 'en', 'Aquafaba', 'Vegan-friendly! Chickpea water used instead of egg white to give a cocktail foam.'),
  ('Şeker Şurubu', 'en', 'Simple syrup', 'The base syrup made by boiling 1 part sugar with 1 part water.'),
  ('Simple Syrup', 'en', 'Simple syrup', 'The base syrup made by boiling 1 part sugar with 1 part water.'),
  ('Top up', 'en', 'Top up', 'Fill the rest of the glass with this drink.');
