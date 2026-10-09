-- Máximo 40 fotos subidas por usuario cada 24 horas (la JAC no tiene límite)
create or replace function public.uploads_last_24h()
returns int language sql stable security definer set search_path = '' as $$
  select count(*)::int from storage.objects
  where owner_id = (select auth.uid())::text and created_at > now() - interval '24 hours'
$$;
revoke execute on function public.uploads_last_24h() from public, anon;
grant execute on function public.uploads_last_24h() to authenticated;

create policy "subidas: límite diario por usuario" on storage.objects as restrictive for insert to authenticated
  with check ((select public.is_admin()) or (select public.uploads_last_24h()) < 40);
