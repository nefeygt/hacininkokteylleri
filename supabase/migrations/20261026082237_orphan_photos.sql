-- Orphaned photos (M9 Icebox round): uploads no row points at, older than a day (a form may still be
-- open), per bucket. Only the service role runs it: the Edge Function cleanup-orphan-photos removes
-- the files through the Storage API (SQL may not delete storage objects).
create function public.orphan_photos(min_age interval default interval '1 day', max_rows integer default 500)
returns table (bucket_id text, name text)
language sql
stable
security definer
set search_path = ''
as $$
  select o.bucket_id, o.name
    from storage.objects o
   where o.created_at < now() - min_age
     and o.name not like '%.emptyFolderPlaceholder'
     and case o.bucket_id
           when 'avatars' then not exists (select 1 from public.profiles p where p.avatar_path = o.name)
           when 'recipe-images' then not exists (
             select 1 from public.cocktails c where c.author_id is not null and c.image_path = o.name)
           when 'cocktail-images' then not exists (
             select 1 from public.cocktails c where c.author_id is null and c.image_path = o.name)
           else false
         end
   order by o.created_at
   limit max_rows;
$$;

revoke execute on function public.orphan_photos(interval, integer) from public, anon, authenticated;
grant execute on function public.orphan_photos(interval, integer) to service_role;
