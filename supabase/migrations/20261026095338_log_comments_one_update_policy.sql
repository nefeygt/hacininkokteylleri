-- The advisor's "multiple permissive policies" WARN: two UPDATE policies for authenticated on log_comments.
-- One policy with the two conditions OR-ed is the same rule (permissive policies are OR-ed anyway).
drop policy "Admins moderate comments" on public.log_comments;
drop policy "Commenters edit their visible comments" on public.log_comments;
create policy "Commenters edit their visible comments; admins moderate"
  on public.log_comments for update to authenticated
  using ((select private.is_admin()) or (user_id = (select auth.uid()) and hidden_at is null))
  with check ((select private.is_admin()) or (user_id = (select auth.uid()) and hidden_at is null));
