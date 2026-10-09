-- Pasar lo que un vecino publicó como anónimo a su cuenta real al registrarse o iniciar sesión.
create table public.claim_codes (
  code text primary key,
  anon_uid uuid not null references auth.users(id) on delete cascade,
  used boolean not null default false,
  expires_at timestamptz not null default now() + interval '15 minutes'
);
alter table public.claim_codes enable row level security; -- sin políticas: solo vía funciones

create or replace function public.start_claim()
returns text language plpgsql security definer set search_path = '' as $$
declare c text;
begin
  if auth.uid() is null or coalesce((auth.jwt()->>'is_anonymous')::boolean, false) is false then
    return null;
  end if;
  c := encode(extensions.gen_random_bytes(18), 'hex');
  insert into public.claim_codes (code, anon_uid) values (c, auth.uid());
  return c;
end $$;

create or replace function public.finish_claim(claim_code text)
returns void language plpgsql security definer set search_path = '' as $$
declare old_uid uuid; new_uid uuid := auth.uid();
begin
  if new_uid is null or coalesce((auth.jwt()->>'is_anonymous')::boolean, false) then return; end if;
  update public.claim_codes set used = true
    where code = claim_code and not used and expires_at > now()
    returning anon_uid into old_uid;
  if old_uid is null or old_uid = new_uid then return; end if;
  if not exists (select 1 from auth.users where id = old_uid and is_anonymous) then return; end if;

  perform set_config('app.claim', 'on', true);
  update public.certificates set author_id = new_uid where author_id = old_uid;
  update public.lost_found  set author_id = new_uid where author_id = old_uid;
  update public.workers     set author_id = new_uid where author_id = old_uid;
  update public.reviews r   set author_id = new_uid where r.author_id = old_uid
    and not exists (select 1 from public.reviews x where x.worker_id = r.worker_id and x.author_id = new_uid);
  perform set_config('app.claim', 'off', true);
end $$;

revoke execute on function public.start_claim() from public, anon;
revoke execute on function public.finish_claim(text) from public, anon;
grant execute on function public.start_claim() to authenticated;
grant execute on function public.finish_claim(text) to authenticated;

-- Los guardias permiten cambiar el dueño solo durante el traspaso
create or replace function public.workers_guard()
returns trigger language plpgsql set search_path = '' as $$
begin
  if not public.is_admin() and current_setting('app.bump_hired', true) is distinct from 'on'
     and current_setting('app.claim', true) is distinct from 'on' then
    new.status := old.status;
    new.rejection_reason := old.rejection_reason;
    new.verified := old.verified;
    new.hired_count := old.hired_count;
  end if;
  if current_setting('app.claim', true) is distinct from 'on' then
    new.author_id := old.author_id;
  end if;
  return new;
end $$;

create or replace function public.certificates_guard()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.consecutive := old.consecutive;
  new.created_at := old.created_at;
  if current_setting('app.claim', true) is distinct from 'on' then
    new.author_id := old.author_id;
  end if;
  if not public.is_admin() then
    new.admin_comment := old.admin_comment;
    new.approved_at := old.approved_at;
  end if;
  return new;
end $$;
