-- The user (2026-10-26): translate the Turkish cocktail names on English pages — meaningful, not literal.
-- Names that are already English (Mojito, Rabbit B, Nox…) keep the Turkish row's name (null).
update public.cocktail_translations t
set name = v.name
from public.cocktails c,
  (values
    ('kuzu-kulagi-devrimi', 'Sorrel Revolution'),
    ('ferah-manifesto', 'Fresh Manifesto'),
    ('sovyet-elmasi', 'Soviet Apple'),
    ('mavi-isci', 'Blue Collar'),
    ('cin-cilegi', 'Gin Berry'),
    ('klasik-viski-sour', 'Classic Whiskey Sour'),
    ('kuzu-kulagi-sour', 'Sorrel Sour'),
    ('tekila-sunrise', 'Tequila Sunrise'),
    ('feslegen-frozen', 'Frozen Basil'),
    ('yeni-yil', 'New Year')
  ) as v (slug, name)
where c.id = t.cocktail_id and c.slug = v.slug and t.locale = 'en';

-- The user: one Turkish row for simple syrup, "Şeker Şurubu" stays. No recipe uses "Simple Syrup";
-- its English row goes with it (on delete cascade) and "Şeker Şurubu" keeps the English "Simple syrup".
delete from public.glossary_terms where term = 'Simple Syrup';
