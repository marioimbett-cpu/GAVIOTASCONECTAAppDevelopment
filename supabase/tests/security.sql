-- Pruebas de seguridad de la base de datos de Gaviotas Conecta.
-- Se ejecutan dentro de una transacción que se revierte: no dejan datos.
-- Uso: pegar en el SQL Editor de Supabase y ejecutar. Si alguna regla falla,
-- se detiene con "FALLA: ..."; si todo está bien, termina con "OK: n pruebas".
begin;

create temp table t_result(n int);
insert into t_result values (0);
grant all on t_result to anon, authenticated;

create or replace function pg_temp.ok(cond boolean, what text) returns void language plpgsql as $$
begin
  if not coalesce(cond, false) then raise exception 'FALLA: %', what; end if;
  update t_result set n = n + 1;
end $$;
grant execute on function pg_temp.ok(boolean, text) to anon, authenticated;

create or replace function pg_temp.as_user(uid text, anon boolean) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', uid, 'role', 'authenticated', 'is_anonymous', anon)::text, true);
  execute 'set local role authenticated';
end $$;

-- Usuarios de prueba: A y B anónimos, C con cuenta
insert into auth.users (instance_id, id, aud, role, is_anonymous, created_at, updated_at) values
 ('00000000-0000-0000-0000-000000000000','a0000000-0000-0000-0000-00000000000a','authenticated','authenticated',true, now(),now()),
 ('00000000-0000-0000-0000-000000000000','b0000000-0000-0000-0000-00000000000b','authenticated','authenticated',true, now(),now()),
 ('00000000-0000-0000-0000-000000000000','c0000000-0000-0000-0000-00000000000c','authenticated','authenticated',false,now(),now());
insert into public.workers (id, author_id, status, verified, hired_count, data)
  values ('d0000000-0000-0000-0000-00000000000d','a0000000-0000-0000-0000-00000000000a','aprobado',true,0,'{"fullName":"Original"}');

-- ── Usuario A (anónimo) ─────────────────────────────────────────────
select pg_temp.as_user('a0000000-0000-0000-0000-00000000000a', true);
select pg_temp.ok(not public.is_admin(), 'un vecino no es administrador');
insert into public.certificates (id, status, data) values ('e0000000-0000-0000-0000-00000000000e','Enviada','{"fullName":"A","docNumber":"1047123456"}');
select pg_temp.ok((select consecutive like 'CV-%' from public.certificates where id = 'e0000000-0000-0000-0000-00000000000e'), 'el servidor asigna el consecutivo');

do $$ begin
  insert into public.certificates (id, status, data) values (gen_random_uuid(),'Aprobada','{}');
  perform pg_temp.ok(false, 'un vecino no puede crear un certificado ya aprobado');
exception when others then perform pg_temp.ok(true, ''); end $$;

do $$ begin
  insert into public.content_items (collection, id, data) values ('news','hack','{}');
  perform pg_temp.ok(false, 'un vecino no puede publicar noticias');
exception when others then perform pg_temp.ok(true, ''); end $$;

update public.workers set status = 'aprobado', verified = true, hired_count = 999, data = '{"fullName":"Editado"}'
  where id = 'd0000000-0000-0000-0000-00000000000d';
select pg_temp.ok((select status = 'pendiente' and hired_count = 0 from public.workers where id = 'd0000000-0000-0000-0000-00000000000d'),
  'editar un oficio aprobado lo devuelve a revisión y no permite inflar contrataciones');

do $$ begin
  for i in 1..6 loop insert into public.lost_found (id, status, data) values (gen_random_uuid(),'activo','{}'); end loop;
  perform pg_temp.ok(false, 'límite diario de publicaciones');
exception when others then perform pg_temp.ok(sqlerrm like 'LIMITE_DIARIO%', 'límite diario de publicaciones'); end $$;

do $$ begin
  insert into public.lost_found (id, status, data) values (gen_random_uuid(),'activo', jsonb_build_object('x', repeat('a', 3500000)));
  perform pg_temp.ok(false, 'tamaño máximo por registro');
exception when others then perform pg_temp.ok(true, ''); end $$;

do $$ begin
  insert into public.reviews (worker_id, author_name, stars) values ('d0000000-0000-0000-0000-00000000000d','Anon',1);
  perform pg_temp.ok(false, 'un anónimo no puede calificar');
exception when others then perform pg_temp.ok(true, ''); end $$;

-- ── Usuario B (otro vecino anónimo) ─────────────────────────────────
reset role;
select pg_temp.as_user('b0000000-0000-0000-0000-00000000000b', true);
select pg_temp.ok((select count(*) = 0 from public.certificates), 'un vecino no ve certificados ajenos');
select pg_temp.ok((select count(*) = 0 from public.worker_private), 'un vecino no ve cédulas ajenas');
update public.certificates set status = 'Aprobada' where id = 'e0000000-0000-0000-0000-00000000000e';
reset role;
select pg_temp.ok((select status = 'Enviada' from public.certificates where id = 'e0000000-0000-0000-0000-00000000000e'), 'un vecino no puede aprobar certificados ajenos');

-- ── Visitante sin sesión ────────────────────────────────────────────
set local role anon;
select pg_temp.ok((select count(*) > 0 from public.content_items), 'el contenido público es legible');
select pg_temp.ok((select count(*) = 0 from public.certificates), 'un visitante no ve certificados');
select pg_temp.ok((select count(*) = 0 from public.admins), 'un visitante no ve administradores');
select pg_temp.ok((select count(*) = 0 from public.verify_certificate('e0000000-0000-0000-0000-00000000000e')), 'un certificado no aprobado no se verifica');
reset role;
-- como JAC
select set_config('request.jwt.claims', json_build_object('sub', (select user_id from public.admins limit 1), 'role', 'authenticated')::text, true);
update public.certificates set status = 'Aprobada', approved_at = now() where id = 'e0000000-0000-0000-0000-00000000000e';
set local role anon;
select pg_temp.ok((select doc_masked = '••••••3456' from public.verify_certificate('e0000000-0000-0000-0000-00000000000e')), 'la verificación enmascara la cédula');
reset role;

-- ── Usuario C (con cuenta) ──────────────────────────────────────────
select set_config('request.jwt.claims', json_build_object('sub', (select user_id from public.admins limit 1), 'role', 'authenticated')::text, true);
update public.workers set status = 'aprobado' where id = 'd0000000-0000-0000-0000-00000000000d';
select pg_temp.as_user('c0000000-0000-0000-0000-00000000000c', false);
insert into public.reviews (worker_id, author_name, stars, comment) values ('d0000000-0000-0000-0000-00000000000d','Vecino',5,'Bien');
select pg_temp.ok((select hired_count = 1 from public.workers where id = 'd0000000-0000-0000-0000-00000000000d'), 'una reseña con cuenta suma una contratación');
reset role;

select 'OK: ' || n || ' pruebas' as resultado from t_result;
rollback;
