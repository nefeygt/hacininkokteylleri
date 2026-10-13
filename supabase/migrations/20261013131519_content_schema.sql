-- Content schema: cocktails, their ingredients, and the glossary of terms the
-- site explains with a tooltip. Read-only for the public; written only from the
-- dashboard or with the secret key (see ADR-004).

create type public.ingredient_icon as enum ('shot', 'dash', 'drop', 'slice', 'spoon', 'topup');

create table public.cocktails (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name          text not null,
  subtitle      text not null default '',
  base_alcohol  text not null,
  flavor        text not null,
  tags          text[] not null default '{}',
  color         text not null check (color ~ '^#[0-9a-fA-F]{6}$'),
  -- Object key inside the "cocktail-images" storage bucket, e.g. "southside.webp".
  image_path    text,
  instructions  text[] not null default '{}',
  garnish       text not null default '',
  glass         text not null default '',
  vegan         boolean not null default false,
  note          text,
  sort_order    integer not null default 0,
  is_published  boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.cocktails is 'One recipe. The slug is the public, URL-safe name; the id is what other tables reference.';
comment on column public.cocktails.image_path is 'Object key in the public "cocktail-images" bucket. Never overwrite an object in place: upload under a new name and update this column.';
comment on column public.cocktails.sort_order is 'Display order, ascending.';

create index cocktails_published_order_idx on public.cocktails (sort_order) where is_published;

create table public.cocktail_ingredients (
  id           uuid primary key default gen_random_uuid(),
  cocktail_id  uuid not null references public.cocktails (id) on delete cascade,
  position     smallint not null check (position > 0),
  name         text not null,
  amount       numeric(6, 2) not null check (amount > 0),
  unit         text not null,
  icon         public.ingredient_icon not null,
  unique (cocktail_id, position)
);

comment on table public.cocktail_ingredients is 'Ingredients of a cocktail, in the order they are listed (position starts at 1).';

create table public.glossary_terms (
  term        text primary key,
  definition  text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.glossary_terms is 'Terms the clients underline in ingredient names and steps, with the explanation shown in a tooltip.';

-- updated_at bookkeeping
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.set_updated_at() from public, anon, authenticated;

create trigger cocktails_set_updated_at
  before update on public.cocktails
  for each row execute function public.set_updated_at();

create trigger glossary_terms_set_updated_at
  before update on public.glossary_terms
  for each row execute function public.set_updated_at();

-- Access: the public reads published content and nothing else. The project's
-- default privileges grant anon and authenticated everything on new tables, so
-- take that back explicitly and grant only SELECT.
revoke all on public.cocktails, public.cocktail_ingredients, public.glossary_terms from anon, authenticated;
grant select on public.cocktails, public.cocktail_ingredients, public.glossary_terms to anon, authenticated;

alter table public.cocktails enable row level security;
alter table public.cocktail_ingredients enable row level security;
alter table public.glossary_terms enable row level security;

create policy "Published cocktails are public"
  on public.cocktails for select
  to anon, authenticated
  using (is_published);

create policy "Ingredients of published cocktails are public"
  on public.cocktail_ingredients for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.cocktails c
      where c.id = cocktail_id and c.is_published
    )
  );

create policy "Glossary is public"
  on public.glossary_terms for select
  to anon, authenticated
  using (true);
