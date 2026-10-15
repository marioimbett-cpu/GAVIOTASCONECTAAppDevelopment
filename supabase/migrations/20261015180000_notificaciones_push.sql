-- ===== Notificaciones push =====
-- Cada noticia, comunicado, proyecto, evento o publicación de Perdidos y
-- Encontrados nueva crea un aviso en public.notifications. Al crearse, la base
-- de datos llama a la función "enviar-push", que lo envía a todos los celulares
-- suscritos.
--
-- Valores secretos (se guardan en Vault, NUNCA en este archivo):
--   push_vapid_public, push_vapid_private  → claves para firmar los push
--   push_hook_secret                       → clave que la base de datos envía a la función

create extension if not exists pg_net;

-- Avisos que ve la app (campanita) y que se envían al celular
create table public.notifications (
  id bigint generated always as identity primary key,
  kind text not null check (kind in ('noticia','comunicado','proyecto','evento','perdidos')),
  icon text not null,
  title text not null check (char_length(title) <= 120),
  body text not null default '' check (char_length(body) <= 200),
  screen text not null check (screen in ('news','events','lostfound')),
  ref_id text not null,
  created_at timestamptz not null default now()
);
create index on public.notifications (created_at desc);
create index on public.notifications (screen, ref_id);
alter table public.notifications enable row level security;
create policy "avisos: lectura pública" on public.notifications for select to anon, authenticated using (true);
-- Nadie los escribe directamente: solo los disparadores de abajo.

-- Celulares que aceptaron recibir avisos
create table public.push_subscriptions (
  endpoint text primary key check (endpoint like 'https://%' and char_length(endpoint) <= 1000),
  p256dh text not null check (char_length(p256dh) <= 200),
  auth text not null check (char_length(auth) <= 100),
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;
-- Sin políticas: solo se usa por las funciones de abajo y por la función de envío.

create or replace function public.push_subscribe(p_endpoint text, p_p256dh text, p_auth text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.push_subscriptions) >= 20000
     and not exists (select 1 from public.push_subscriptions where endpoint = p_endpoint) then
    raise exception 'LIMITE_SUSCRIPCIONES';
  end if;
  insert into public.push_subscriptions (endpoint, p256dh, auth, user_id)
  values (p_endpoint, p_p256dh, p_auth, auth.uid())
  on conflict (endpoint) do update set p256dh = excluded.p256dh, auth = excluded.auth,
    user_id = coalesce(excluded.user_id, public.push_subscriptions.user_id);
end $$;

create or replace function public.push_unsubscribe(p_endpoint text)
returns void language sql security definer set search_path = '' as $$
  delete from public.push_subscriptions where endpoint = p_endpoint;
$$;

revoke execute on function public.push_subscribe(text, text, text) from public;
revoke execute on function public.push_unsubscribe(text) from public;
grant execute on function public.push_subscribe(text, text, text) to anon, authenticated;
grant execute on function public.push_unsubscribe(text) to anon, authenticated;

-- Claves para la función de envío (solo el rol de servicio)
create or replace function public.push_config()
returns table (vapid_public text, vapid_private text, hook_secret text)
language sql stable security definer set search_path = '' as $$
  select
    (select decrypted_secret from vault.decrypted_secrets where name = 'push_vapid_public'),
    (select decrypted_secret from vault.decrypted_secrets where name = 'push_vapid_private'),
    (select decrypted_secret from vault.decrypted_secrets where name = 'push_hook_secret');
$$;
revoke execute on function public.push_config() from public, anon, authenticated;
grant execute on function public.push_config() to service_role;

-- ===== Crear avisos automáticamente =====
create or replace function public.notify_content()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  cat text;
  t text := left(btrim(coalesce(new.data->>'title', '')), 90);
begin
  if t = '' then return new; end if;
  if new.collection = 'news' then
    cat := coalesce(new.data->>'category', 'Noticia');
    insert into public.notifications (kind, icon, title, body, screen, ref_id) values (
      case cat when 'Comunicado' then 'comunicado' when 'Proyecto' then 'proyecto' else 'noticia' end,
      case cat when 'Comunicado' then '📢' when 'Proyecto' then '🏗' else '📰' end,
      case cat when 'Comunicado' then 'Nuevo comunicado' when 'Proyecto' then 'Nuevo proyecto' else 'Nueva noticia' end || ': ' || t,
      left(coalesce(new.data->>'summary', ''), 200), 'news', new.id);
  elsif new.collection = 'events' then
    insert into public.notifications (kind, icon, title, body, screen, ref_id) values (
      'evento', coalesce(nullif(new.data->>'emoji', ''), '📅'), 'Nuevo evento: ' || t,
      left(concat_ws(' · ', nullif(new.data->>'date', ''), nullif(new.data->>'time', ''), nullif(new.data->>'location', '')), 200),
      'events', new.id);
  end if;
  return new;
end $$;
revoke execute on function public.notify_content() from public, anon, authenticated;
create trigger notify_content after insert on public.content_items
  for each row when (new.collection in ('news', 'events')) execute function public.notify_content();

create or replace function public.notify_content_removed()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  delete from public.notifications
  where screen = case old.collection when 'news' then 'news' else 'events' end and ref_id = old.id;
  return old;
end $$;
revoke execute on function public.notify_content_removed() from public, anon, authenticated;
create trigger notify_content_removed after delete on public.content_items
  for each row when (old.collection in ('news', 'events')) execute function public.notify_content_removed();

create or replace function public.notify_lost_found()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  is_pet boolean := new.data->>'category' = 'Mascota';
  what text;
  detail text;
begin
  if tg_op = 'UPDATE' then
    if new.status in ('oculto', 'archivado') then
      delete from public.notifications where screen = 'lostfound' and ref_id = new.id::text;
    end if;
    return new;
  end if;
  if new.status <> 'activo' then return new; end if;
  what := case when is_pet then 'Mascota' else 'Objeto' end || ' '
    || case when new.data->>'type' = 'Encontrado' then 'encontrad' else 'perdid' end
    || case when is_pet then 'a' else 'o' end;
  detail := case when is_pet
    then coalesce(nullif(new.data->>'petName', ''), nullif(new.data->>'species', ''), '')
    else coalesce(nullif(new.data->>'objectCat', ''), '') end;
  insert into public.notifications (kind, icon, title, body, screen, ref_id) values (
    'perdidos', case when is_pet then '🐾' else '🔎' end,
    left(what || case when detail <> '' then ': ' || detail else '' end, 120),
    left(concat_ws(' · ', nullif(new.data->>'sector', ''), nullif(left(new.data->>'description', 140), '')), 200),
    'lostfound', new.id::text);
  return new;
end $$;
revoke execute on function public.notify_lost_found() from public, anon, authenticated;
create trigger notify_lost_found after insert or update of status on public.lost_found
  for each row execute function public.notify_lost_found();

-- ===== Enviar cada aviso nuevo a los celulares =====
create or replace function public.notifications_send()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_secret text := (select decrypted_secret from vault.decrypted_secrets where name = 'push_hook_secret');
begin
  if v_secret is null then return new; end if;
  perform net.http_post(
    url := 'https://zaxivsggncaimskheukn.supabase.co/functions/v1/enviar-push',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-push-secret', v_secret),
    body := jsonb_build_object('id', new.id),
    timeout_milliseconds := 10000
  );
  return new;
end $$;
revoke execute on function public.notifications_send() from public, anon, authenticated;
create trigger notifications_send after insert on public.notifications
  for each row execute function public.notifications_send();
