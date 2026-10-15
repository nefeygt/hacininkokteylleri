-- Half-star ratings (2026-10-15, the user's request): reviews and drink logs
-- take 0.5 to 5 in steps of 0.5. The view and the updated_at triggers depend
-- on the column, so they are dropped and recreated unchanged around the type change.

drop view public.cocktail_ratings;
drop trigger reviews_set_updated_at on public.reviews;
drop trigger drink_logs_set_updated_at on public.drink_logs;

alter table public.reviews drop constraint reviews_rating_check;
alter table public.drink_logs drop constraint drink_logs_rating_check;

alter table public.reviews alter column rating type numeric(2,1);
alter table public.drink_logs alter column rating type numeric(2,1);

alter table public.reviews add constraint reviews_rating_check
  check (rating between 0.5 and 5 and rating * 2 = trunc(rating * 2));
alter table public.drink_logs add constraint drink_logs_rating_check
  check (rating between 0.5 and 5 and rating * 2 = trunc(rating * 2));

create trigger reviews_set_updated_at
  before update of rating, body on public.reviews
  for each row execute function public.set_updated_at();
create trigger drink_logs_set_updated_at
  before update of drunk_on, recipe, rating, note, is_public on public.drink_logs
  for each row execute function public.set_updated_at();

create view public.cocktail_ratings with (security_invoker = on) as
  select r.cocktail_id,
         count(*)::integer as review_count,
         round(avg(r.rating), 2)::numeric(3,2) as average_rating
    from public.reviews r
    join public.profiles p on p.id = r.user_id
   where r.hidden_at is null and p.hidden_at is null
   group by r.cocktail_id;

comment on view public.cocktail_ratings is
  'Average rating and review count per cocktail, visible reviews by visible profiles only.';
revoke all on public.cocktail_ratings from anon, authenticated;
grant select on public.cocktail_ratings to anon, authenticated;
