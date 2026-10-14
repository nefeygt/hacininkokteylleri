-- A review's updated_at is the time its author last wrote it: it is shown
-- publicly and counted by the daily limit, so hiding or unhiding (an admin's
-- update of hidden_at) must not move it.
drop trigger reviews_set_updated_at on public.reviews;

create trigger reviews_set_updated_at
  before update of rating, body on public.reviews
  for each row execute function public.set_updated_at();
