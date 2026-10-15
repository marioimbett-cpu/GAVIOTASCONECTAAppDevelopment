// Envía un aviso (public.notifications) como notificación push a todos los
// celulares suscritos. La llama la base de datos (disparador notifications_send)
// con la clave secreta "push_hook_secret" de Vault en el encabezado x-push-secret.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
});

let config: { vapid_public: string; vapid_private: string; hook_secret: string } | null = null;
async function getConfig() {
  if (!config) {
    const { data, error } = await db.rpc("push_config").single();
    if (error || !data) throw new Error("No se pudo leer la configuración de push");
    config = data as typeof config;
    webpush.setVapidDetails("mailto:marioimbett@gmail.com", config!.vapid_public, config!.vapid_private);
  }
  return config!;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Método no permitido", { status: 405 });
  const cfg = await getConfig();
  if (req.headers.get("x-push-secret") !== cfg.hook_secret) return new Response("No autorizado", { status: 401 });

  const { id } = await req.json().catch(() => ({ id: null }));
  if (!id) return new Response("Falta id", { status: 400 });

  const { data: n } = await db.from("notifications").select("*").eq("id", id).maybeSingle();
  if (!n) return new Response("Aviso no encontrado", { status: 404 });

  const payload = JSON.stringify({
    title: n.title,
    body: n.body,
    icon: "/icon-192-v3.png",
    badge: "/icon-192-v3.png",
    tag: `aviso-${n.id}`,
    url: `/?pantalla=${n.screen}`,
  });

  let sent = 0, removed = 0, failed = 0, from = 0;
  const PAGE = 500;
  while (true) {
    const { data: subs } = await db.from("push_subscriptions").select("endpoint,p256dh,auth").range(from, from + PAGE - 1);
    if (!subs?.length) break;
    const results = await Promise.allSettled(subs.map((s) =>
      webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 60 * 60 * 24 })
    ));
    const gone: string[] = [];
    results.forEach((r, i) => {
      if (r.status === "fulfilled") sent++;
      else {
        const code = (r.reason as { statusCode?: number })?.statusCode;
        if (code === 404 || code === 410) gone.push(subs[i].endpoint); else failed++;
      }
    });
    if (gone.length) { await db.from("push_subscriptions").delete().in("endpoint", gone); removed += gone.length; }
    if (subs.length < PAGE) break;
    from += PAGE - gone.length;
  }

  return Response.json({ id: n.id, sent, removed, failed });
});
