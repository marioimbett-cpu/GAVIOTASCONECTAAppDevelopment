-- Consecutivo asignado por el servidor: CV-2026-0001
alter table public.certificates alter column consecutive set default '';
create or replace function public.certificates_set_consecutive()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.consecutive := 'CV-' || extract(year from now())::int || '-' || lpad(nextval('public.certificate_seq')::text, 4, '0');
  new.created_at := now();
  return new;
end $$;
create trigger certificates_set_consecutive before insert on public.certificates
  for each row execute function public.certificates_set_consecutive();

-- Campos de control protegidos en certificados
create or replace function public.certificates_guard()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.consecutive := old.consecutive;
  new.created_at := old.created_at;
  new.author_id := old.author_id;
  if not public.is_admin() then
    new.admin_comment := old.admin_comment;
    new.approved_at := old.approved_at;
  end if;
  return new;
end $$;
create trigger certificates_guard before update on public.certificates
  for each row execute function public.certificates_guard();
create policy "cert: admin borra" on public.certificates for delete to authenticated using ((select public.is_admin()));

-- Oficios: el conteo de contrataciones solo lo sube una reseña
create or replace function public.workers_guard()
returns trigger language plpgsql set search_path = '' as $$
begin
  if not public.is_admin() and current_setting('app.bump_hired', true) is distinct from 'on' then
    new.status := old.status;
    new.rejection_reason := old.rejection_reason;
    new.verified := old.verified;
    new.hired_count := old.hired_count;
  end if;
  new.author_id := old.author_id;
  return new;
end $$;

create or replace function public.reviews_bump_hired()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform set_config('app.bump_hired', 'on', true);
  update public.workers set hired_count = hired_count + 1 where id = new.worker_id;
  perform set_config('app.bump_hired', 'off', true);
  return new;
end $$;
revoke execute on function public.reviews_bump_hired() from public, anon, authenticated;
