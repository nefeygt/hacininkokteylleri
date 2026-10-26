-- Editing a comment (M9 Icebox round): the commenter changes the text of their own visible comment;
-- the thread shows "düzenlendi". hidden_at stays admins' only (private.guard_moderation).
alter table public.log_comments add column edited_at timestamptz;

create function private.stamp_comment_edit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.body is distinct from old.body then
    new.edited_at := now();
  end if;
  return new;
end;
$$;

revoke execute on function private.stamp_comment_edit() from public, anon, authenticated;

create trigger log_comments_stamp_edit
  before update of body on public.log_comments
  for each row execute function private.stamp_comment_edit();

grant update (body) on public.log_comments to authenticated;

create policy "Commenters edit their visible comments"
  on public.log_comments for update to authenticated
  using (user_id = (select auth.uid()) and hidden_at is null)
  with check (user_id = (select auth.uid()) and hidden_at is null);
