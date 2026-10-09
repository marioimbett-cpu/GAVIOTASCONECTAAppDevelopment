-- 1) Tamaño máximo por registro (evita llenar la base de datos)
alter table public.content_items add constraint content_items_data_size check (octet_length(data::text) <= 3000000);
alter table public.app_settings  add constraint app_settings_data_size  check (octet_length(data::text) <= 2000000);
alter table public.lost_found    add constraint lost_found_data_size    check (octet_length(data::text) <= 3000000);
alter table public.certificates  add constraint certificates_data_size  check (octet_length(data::text) <= 6000000);
alter table public.workers       add constraint workers_data_size       check (octet_length(data::text) <= 4000000);
alter table public.reviews       add constraint reviews_author_name_len check (char_length(author_name) between 1 and 80);
alter table public.reviews       add constraint reviews_comment_len     check (char_length(comment) <= 1000);
alter table public.worker_private add constraint worker_private_cedula_len check (char_length(cedula) <= 20);

-- 2) Máximo de registros nuevos por usuario cada 24 horas (la JAC no tiene límite)
create or replace function public.enforce_daily_limit()
returns trigger language plpgsql security definer set search_path = '' as $$
declare lim int := tg_argv[0]::int; n int;
begin
  if public.is_admin() then return new; end if;
  execute format('select count(*) from %I.%I where author_id = $1 and created_at > now() - interval ''24 hours''',
                 tg_table_schema, tg_table_name)
    into n using new.author_id;
  if n >= lim then
    raise exception 'LIMITE_DIARIO: alcanzaste el máximo de % por día', lim using errcode = 'P0001';
  end if;
  return new;
end $$;
revoke execute on function public.enforce_daily_limit() from public, anon, authenticated;

create trigger lost_found_daily_limit   before insert on public.lost_found   for each row execute function public.enforce_daily_limit('5');
create trigger certificates_daily_limit before insert on public.certificates for each row execute function public.enforce_daily_limit('3');
create trigger workers_daily_limit      before insert on public.workers      for each row execute function public.enforce_daily_limit('2');
create trigger reviews_daily_limit      before insert on public.reviews      for each row execute function public.enforce_daily_limit('10');

-- 3) Reseñas solo de vecinos con cuenta (no anónimos)
create policy "reseñas: solo cuentas registradas" on public.reviews as restrictive for insert to authenticated
  with check (coalesce((select (auth.jwt()->>'is_anonymous')::boolean), false) = false);

-- 4) Si un trabajador aprobado cambia su perfil, vuelve a revisión de la JAC
--    (cambiar solo "disponible hoy" no requiere revisión)
create or replace function public.workers_guard()
returns trigger language plpgsql set search_path = '' as $$
begin
  if not public.is_admin() and current_setting('app.bump_hired', true) is distinct from 'on'
     and current_setting('app.claim', true) is distinct from 'on' then
    new.status := old.status;
    new.rejection_reason := old.rejection_reason;
    new.verified := old.verified;
    new.hired_count := old.hired_count;
    if old.status = 'aprobado'
       and (new.data - 'availableToday') is distinct from (old.data - 'availableToday') then
      new.status := 'pendiente';
    end if;
  end if;
  if current_setting('app.claim', true) is distinct from 'on' then
    new.author_id := old.author_id;
  end if;
  return new;
end $$;

-- 5) Índices sugeridos por el asesor de rendimiento
create index if not exists reviews_author_id_idx on public.reviews (author_id);
create index if not exists claim_codes_anon_uid_idx on public.claim_codes (anon_uid);
