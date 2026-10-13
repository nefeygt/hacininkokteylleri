-- Public bucket for cocktail photos (ADR-006). Public means anyone can fetch an
-- object by its URL; no SELECT policy is added, so nobody can list the bucket.
-- Uploads need the secret key or the dashboard.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cocktail-images', 'cocktail-images', true, 2097152, array['image/webp']);
