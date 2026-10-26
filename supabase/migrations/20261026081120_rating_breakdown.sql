-- Rating breakdown (M9 Icebox round): how many reviews gave each half star. One more column at the
-- end of cocktail_ratings, so the static pages keep a single read (ADR-005). Index i holds the
-- reviews rated (i + 1) / 2: [0] = 0.5 stars … [9] = 5 stars.
create or replace view public.cocktail_ratings with (security_invoker = on) as
  select r.cocktail_id,
         count(*)::integer as review_count,
         round(avg(r.rating), 2)::numeric(3,2) as average_rating,
         array[
           count(*) filter (where r.rating = 0.5), count(*) filter (where r.rating = 1),
           count(*) filter (where r.rating = 1.5), count(*) filter (where r.rating = 2),
           count(*) filter (where r.rating = 2.5), count(*) filter (where r.rating = 3),
           count(*) filter (where r.rating = 3.5), count(*) filter (where r.rating = 4),
           count(*) filter (where r.rating = 4.5), count(*) filter (where r.rating = 5)
         ]::integer[] as half_star_counts
    from public.reviews r
    join public.profiles p on p.id = r.user_id
   where r.hidden_at is null and p.hidden_at is null
   group by r.cocktail_id;

comment on view public.cocktail_ratings is
  'Average rating, review count and per-half-star counts per cocktail, visible reviews by visible profiles only.';
