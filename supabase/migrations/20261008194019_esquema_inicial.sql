-- ===== Administradores =====
create table public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.admins where user_id = (select auth.uid())) $$;

create policy "admins: ver propio o admin" on public.admins for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

-- ===== Contenido público (noticias, eventos, lugares, directorio, galería, chatbot, emergencias) =====
create table public.content_items (
  collection text not null check (collection in ('news','events','places','directory','gallery','chatbot','emergency')),
  id text not null,
  sort_order int not null default 0,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (collection, id)
);
alter table public.content_items enable row level security;
create policy "contenido: lectura pública" on public.content_items for select to anon, authenticated using (true);
create policy "contenido: admin inserta" on public.content_items for insert to authenticated with check ((select public.is_admin()));
create policy "contenido: admin edita" on public.content_items for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "contenido: admin borra" on public.content_items for delete to authenticated using ((select public.is_admin()));

-- ===== Configuración =====
create table public.app_settings (
  id int primary key default 1 check (id = 1),
  data jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.app_settings enable row level security;
create policy "config: lectura pública" on public.app_settings for select to anon, authenticated using (true);
create policy "config: admin edita" on public.app_settings for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- ===== Certificados de vecindad (datos personales: solo dueño y admin) =====
create sequence public.certificate_seq;
create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  consecutive text not null default lpad(nextval('public.certificate_seq')::text, 4, '0'),
  author_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  status text not null default 'Enviada' check (status in ('Enviada','En revisión','Aprobada','Requiere corrección','Rechazada')),
  admin_comment text,
  approved_at timestamptz,
  data jsonb not null,
  created_at timestamptz not null default now()
);
create index on public.certificates (author_id);
alter table public.certificates enable row level security;
create policy "cert: dueño o admin ve" on public.certificates for select to authenticated
  using (author_id = (select auth.uid()) or (select public.is_admin()));
create policy "cert: vecino crea la suya" on public.certificates for insert to authenticated
  with check (author_id = (select auth.uid()) and status = 'Enviada');
create policy "cert: admin actualiza" on public.certificates for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "cert: dueño corrige si se le pide" on public.certificates for update to authenticated
  using (author_id = (select auth.uid()) and status = 'Requiere corrección')
  with check (author_id = (select auth.uid()) and status in ('Requiere corrección','Enviada'));

-- ===== Perdidos y encontrados =====
create table public.lost_found (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  status text not null default 'activo' check (status in ('activo','resuelto','archivado','oculto')),
  data jsonb not null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index on public.lost_found (author_id);
alter table public.lost_found enable row level security;
create policy "lf: públicos, propios o admin" on public.lost_found for select to anon, authenticated
  using (status in ('activo','resuelto') or author_id = (select auth.uid()) or (select public.is_admin()));
create policy "lf: vecino publica" on public.lost_found for insert to authenticated
  with check (author_id = (select auth.uid()) and status = 'activo');
create policy "lf: dueño marca resuelto" on public.lost_found for update to authenticated
  using (author_id = (select auth.uid())) with check (author_id = (select auth.uid()) and status in ('activo','resuelto'));
create policy "lf: admin modera" on public.lost_found for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "lf: admin borra" on public.lost_found for delete to authenticated using ((select public.is_admin()));

-- ===== Oficios del barrio =====
create table public.workers (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  status text not null default 'pendiente' check (status in ('pendiente','aprobado','pausado','rechazado')),
  rejection_reason text,
  verified boolean not null default false,
  hired_count int not null default 0,
  data jsonb not null,   -- datos públicos del perfil (sin cédula)
  created_at timestamptz not null default now()
);
create index on public.workers (author_id);
alter table public.workers enable row level security;
create policy "oficios: aprobados, propio o admin" on public.workers for select to anon, authenticated
  using (status = 'aprobado' or author_id = (select auth.uid()) or (select public.is_admin()));
create policy "oficios: vecino se inscribe" on public.workers for insert to authenticated
  with check (author_id = (select auth.uid()) and status = 'pendiente' and verified = false and hired_count = 0);
create policy "oficios: dueño edita su perfil" on public.workers for update to authenticated
  using (author_id = (select auth.uid())) with check (author_id = (select auth.uid()));
create policy "oficios: admin modera" on public.workers for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "oficios: admin borra" on public.workers for delete to authenticated using ((select public.is_admin()));

-- El dueño no puede auto-aprobarse, verificarse ni inflar contrataciones
create or replace function public.workers_guard()
returns trigger language plpgsql set search_path = '' as $$
begin
  if not public.is_admin() then
    new.status := old.status;
    new.rejection_reason := old.rejection_reason;
    new.verified := old.verified;
    new.hired_count := old.hired_count;
    new.author_id := old.author_id;
  end if;
  return new;
end $$;
create trigger workers_guard before update on public.workers for each row execute function public.workers_guard();

-- Cédula del trabajador: solo el dueño y la JAC
create table public.worker_private (
  worker_id uuid primary key references public.workers(id) on delete cascade,
  cedula text not null
);
alter table public.worker_private enable row level security;
create policy "cedula: dueño o admin ve" on public.worker_private for select to authenticated
  using ((select public.is_admin()) or exists (select 1 from public.workers w where w.id = worker_id and w.author_id = (select auth.uid())));
create policy "cedula: dueño registra" on public.worker_private for insert to authenticated
  with check (exists (select 1 from public.workers w where w.id = worker_id and w.author_id = (select auth.uid())));

-- ===== Reseñas =====
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.workers(id) on delete cascade,
  author_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  author_name text not null,
  stars int not null check (stars between 1 and 5),
  comment text not null default '',
  created_at timestamptz not null default now(),
  unique (worker_id, author_id)
);
create index on public.reviews (worker_id);
alter table public.reviews enable row level security;
create policy "reseñas: lectura pública" on public.reviews for select to anon, authenticated using (true);
create policy "reseñas: vecino califica" on public.reviews for insert to authenticated
  with check (author_id = (select auth.uid())
    and not exists (select 1 from public.workers w where w.id = worker_id and w.author_id = (select auth.uid())));
create policy "reseñas: admin borra" on public.reviews for delete to authenticated using ((select public.is_admin()));

-- Cada reseña suma una contratación
create or replace function public.reviews_bump_hired()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.workers set hired_count = hired_count + 1 where id = new.worker_id;
  return new;
end $$;
revoke execute on function public.reviews_bump_hired() from public, anon, authenticated;
create trigger reviews_bump_hired after insert on public.reviews for each row execute function public.reviews_bump_hired();

-- ===== Almacenamiento de fotos =====
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('publico', 'publico', true, 5242880, array['image/jpeg','image/png','image/webp']),
  ('certificados', 'certificados', false, 5242880, array['image/jpeg','image/png','image/webp','application/pdf']);

-- público: cualquiera ve; cada usuario sube en su carpeta {uid}/...; admin todo
create policy "publico: subir en carpeta propia" on storage.objects for insert to authenticated
  with check (bucket_id = 'publico' and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_admin())));
create policy "publico: borrar propio o admin" on storage.objects for delete to authenticated
  using (bucket_id = 'publico' and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_admin())));

-- certificados (cédulas, recibos): privado, solo dueño y admin
create policy "certificados: subir en carpeta propia" on storage.objects for insert to authenticated
  with check (bucket_id = 'certificados' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "certificados: ver propio o admin" on storage.objects for select to authenticated
  using (bucket_id = 'certificados' and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_admin())));
create policy "certificados: admin borra" on storage.objects for delete to authenticated
  using (bucket_id = 'certificados' and (select public.is_admin()));
