-- Admin rights need two-factor authentication (ADR-011). A session that signed
-- in with a password alone (aal1) is an ordinary signed-in user; only after a
-- TOTP code (aal2) does private.is_admin() — and with it every write policy and
-- every storage policy — say yes. Ordinary users (M3 onwards) are unaffected.

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select auth.jwt() ->> 'aal'), 'aal1') = 'aal2'
     and exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;

-- An admin who has not passed the second step yet must still be able to see
-- their own row, so the panel can send them to the code screen instead of
-- telling them they are not an admin.
drop policy "Admins can see the admin list" on public.admins;

create policy "Users see their own admin row; admins see all"
  on public.admins for select
  to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));
