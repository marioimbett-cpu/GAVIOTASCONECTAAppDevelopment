-- Para publicar (perdidos, oficios, certificados) hay que tener cuenta registrada.
-- Los visitantes sin cuenta solo pueden ver el contenido público.
create policy "perdidos: solo cuentas registradas" on public.lost_found as restrictive for insert to authenticated
  with check (coalesce((select (auth.jwt()->>'is_anonymous')::boolean), false) = false);
create policy "oficios: solo cuentas registradas" on public.workers as restrictive for insert to authenticated
  with check (coalesce((select (auth.jwt()->>'is_anonymous')::boolean), false) = false);
create policy "certificados: solo cuentas registradas" on public.certificates as restrictive for insert to authenticated
  with check (coalesce((select (auth.jwt()->>'is_anonymous')::boolean), false) = false);
-- Las fotos también solo las suben cuentas registradas
create policy "subidas: solo cuentas registradas" on storage.objects as restrictive for insert to authenticated
  with check (coalesce((select (auth.jwt()->>'is_anonymous')::boolean), false) = false);
