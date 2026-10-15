// Service worker de Gaviotas Conecta: permite instalar la app y abrirla aunque falle la conexión.
// Siempre intenta la red primero, así cada publicación nueva se ve de inmediato.
// También muestra los avisos push (noticias, eventos, perdidos) que envía la JAC.
const CACHE = "gaviotas-v4";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match("/"))),
  );
});

// ── Avisos push ──────────────────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { title: "Gaviotas Conecta", body: event.data ? event.data.text() : "" }; }
  event.waitUntil(
    self.registration.showNotification(data.title || "Gaviotas Conecta", {
      body: data.body || "",
      icon: data.icon || "/icon-192-v3.png",
      badge: data.badge || "/icon-192-v3.png",
      tag: data.tag,
      data: { url: data.url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL((event.notification.data && event.notification.data.url) || "/", self.location.origin);
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      const open = list.find((c) => new URL(c.url).origin === url.origin);
      if (open) {
        open.postMessage({ tipo: "abrir", pantalla: url.searchParams.get("pantalla") });
        return open.focus();
      }
      return self.clients.openWindow(url.href);
    }),
  );
});
