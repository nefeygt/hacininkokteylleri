-- The final check of the English content against docs/glossary.md (ADR-032).
-- B-52's garnish "Ateş (İsteğe bağlı yakılır)": the flame is the garnish, lighting it is optional.
update public.cocktail_translations t
set garnish = 'Flame (optional: light it)'
from public.cocktails c
where c.id = t.cocktail_id and c.slug = 'b-52' and t.locale = 'en';
