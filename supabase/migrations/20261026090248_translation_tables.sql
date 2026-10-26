-- Translations of the house content, one row per language (ADR-032). Turkish stays in the base tables;
-- a missing row or an empty field falls back to Turkish in the loaders. Only admins write; readers see
-- what they could already read in the base table.

create table public.cocktail_translations (
  cocktail_id uuid not null references public.cocktails (id) on delete cascade,
  locale text not null check (locale ~ '^[a-z]{2}(-[A-Za-z]{2,4})?$' and locale <> 'tr'),
  name text check (name is null or char_length(name) between 1 and 100),
  subtitle text not null default '' check (char_length(subtitle) <= 200),
  base_alcohol text not null default '' check (char_length(base_alcohol) <= 60),
  flavor text not null default '' check (char_length(flavor) <= 60),
  tags text[] not null default '{}',
  garnish text not null default '' check (char_length(garnish) <= 400),
  glass text not null default '' check (char_length(glass) <= 100),
  note text check (note is null or char_length(note) <= 2000),
  instructions text[] not null default '{}',
  ingredient_names text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (cocktail_id, locale)
);
comment on table public.cocktail_translations is
  'A house recipe in another language. Empty fields and missing positions fall back to the Turkish row (ADR-032). ingredient_names are by position (cocktail_ingredients.position, from 1).';

create table public.glossary_term_translations (
  term text not null references public.glossary_terms (term) on delete cascade on update cascade,
  locale text not null check (locale ~ '^[a-z]{2}(-[A-Za-z]{2,4})?$' and locale <> 'tr'),
  translated_term text not null check (char_length(translated_term) between 1 and 100),
  definition text not null check (char_length(definition) between 1 and 1000),
  primary key (term, locale)
);
comment on table public.glossary_term_translations is
  'A glossary term in another language: the word to underline (translated_term) and its tooltip.';

create table public.ingredient_translations (
  ingredient_id uuid not null references public.ingredients (id) on delete cascade,
  locale text not null check (locale ~ '^[a-z]{2}(-[A-Za-z]{2,4})?$' and locale <> 'tr'),
  name text not null check (char_length(name) between 1 and 60 and name = btrim(name)),
  primary key (ingredient_id, locale)
);
comment on table public.ingredient_translations is 'A catalogue ingredient''s name in another language.';

create trigger cocktail_translations_set_updated_at before update on public.cocktail_translations
  for each row execute function public.set_updated_at();

revoke all on public.cocktail_translations, public.glossary_term_translations, public.ingredient_translations
  from anon, authenticated;
grant select on public.cocktail_translations, public.glossary_term_translations, public.ingredient_translations
  to anon, authenticated;
grant insert, update, delete on public.cocktail_translations, public.glossary_term_translations,
  public.ingredient_translations to authenticated;

alter table public.cocktail_translations enable row level security;
alter table public.glossary_term_translations enable row level security;
alter table public.ingredient_translations enable row level security;

create policy "Anyone can read translations of visible published cocktails"
  on public.cocktail_translations for select to anon
  using (exists (select 1 from public.cocktails c
    where c.id = cocktail_translations.cocktail_id and c.is_published and c.hidden_at is null));
create policy "Signed-in users read translations of cocktails they can read"
  on public.cocktail_translations for select to authenticated
  using ((select private.is_admin()) or exists (select 1 from public.cocktails c
    where c.id = cocktail_translations.cocktail_id and c.is_published and c.hidden_at is null));
create policy "Admins add cocktail translations"
  on public.cocktail_translations for insert to authenticated with check ((select private.is_admin()));
create policy "Admins change cocktail translations"
  on public.cocktail_translations for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Admins delete cocktail translations"
  on public.cocktail_translations for delete to authenticated using ((select private.is_admin()));

create policy "Anyone can read glossary translations"
  on public.glossary_term_translations for select to anon, authenticated using (true);
create policy "Admins add glossary translations"
  on public.glossary_term_translations for insert to authenticated with check ((select private.is_admin()));
create policy "Admins change glossary translations"
  on public.glossary_term_translations for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Admins delete glossary translations"
  on public.glossary_term_translations for delete to authenticated using ((select private.is_admin()));

create policy "Anyone can read ingredient translations"
  on public.ingredient_translations for select to anon, authenticated using (true);
create policy "Admins add ingredient translations"
  on public.ingredient_translations for insert to authenticated with check ((select private.is_admin()));
create policy "Admins change ingredient translations"
  on public.ingredient_translations for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Admins delete ingredient translations"
  on public.ingredient_translations for delete to authenticated using ((select private.is_admin()));
