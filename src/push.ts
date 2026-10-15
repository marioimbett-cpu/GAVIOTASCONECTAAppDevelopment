// ── Notificaciones push (avisos al celular) ────────────────────────────────────
// El celular se suscribe con la clave pública VAPID y la suscripción se guarda en
// Supabase (push_subscribe). Cuando la JAC publica algo, la función "enviar-push"
// manda el aviso a todos los suscritos.

import { supabase } from "./supabase";

// Clave pública (va en el navegador; la privada está guardada en Supabase Vault).
const VAPID_PUBLIC_KEY = "BPfcBUifkr8DrzA8Z1mrWUGQ3PHcu4Tlj0ta7CCvI5dWPjlUDX7ESwlMVybnlOyXuZ_wYNdWKry_3oAVXQ9hUoA";

export type PushStatus =
  | "activo"         // este celular recibe avisos
  | "inactivo"       // se puede activar con un toque
  | "bloqueado"      // el usuario negó el permiso en el navegador
  | "instalar-ios"   // iPhone: primero hay que agregar la app a la pantalla de inicio
  | "no-soportado";  // navegador sin soporte

const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const isStandalone = () =>
  window.matchMedia?.("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
const supported = () => "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

async function registration(): Promise<ServiceWorkerRegistration | null> {
  try {
    const existing = await navigator.serviceWorker.getRegistration();
    if (existing) return existing;
    return await navigator.serviceWorker.register("/sw.js");
  } catch { return null; }
}

export async function getPushStatus(): Promise<PushStatus> {
  if (isIOS() && !isStandalone()) return "instalar-ios";
  if (!supported()) return "no-soportado";
  if (Notification.permission === "denied") return "bloqueado";
  const reg = await registration();
  const sub = await reg?.pushManager.getSubscription();
  return sub && Notification.permission === "granted" ? "activo" : "inactivo";
}

/** Pide permiso y suscribe este celular. Debe llamarse desde un toque del usuario. */
export async function enablePush(): Promise<PushStatus> {
  // Sin "await" antes de pedir el permiso: Safari solo lo muestra si viene directo del toque.
  if (isIOS() && !isStandalone()) return "instalar-ios";
  if (!supported()) return "no-soportado";
  if (Notification.permission === "denied") return "bloqueado";
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return permission === "denied" ? "bloqueado" : "inactivo";
  const reg = await registration();
  if (!reg) return "no-soportado";
  await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription())
    ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) }));
  const json = sub.toJSON();
  const { error } = await supabase.rpc("push_subscribe", {
    p_endpoint: sub.endpoint, p_p256dh: json.keys?.p256dh ?? "", p_auth: json.keys?.auth ?? "",
  });
  if (error) { console.error("[Gaviotas] suscribir push:", error.message); return "inactivo"; }
  return "activo";
}

/** Deja de recibir avisos en este celular. */
export async function disablePush(): Promise<void> {
  if (!supported()) return;
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (!sub) return;
  await supabase.rpc("push_unsubscribe", { p_endpoint: sub.endpoint });
  await sub.unsubscribe().catch(() => {});
}

// ── Lista de avisos (campanita) ───────────────────────────────────────────────
export interface AppNotification {
  id: number;
  icon: string;
  title: string;
  body: string;
  screen: "news" | "events" | "lostfound";
  createdAt: string;
}

export async function fetchNotifications(): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("id,icon,title,body,screen,created_at")
    .order("created_at", { ascending: false })
    .limit(30);
  if (error || !data) return [];
  return data.map((n) => ({ id: n.id, icon: n.icon, title: n.title, body: n.body, screen: n.screen, createdAt: n.created_at }));
}

const READ_KEY = "gc:avisos-leidos";
export function readIds(): Set<number> {
  try { return new Set(JSON.parse(localStorage.getItem(READ_KEY) || "[]")); } catch { return new Set(); }
}
export function saveReadIds(ids: Set<number>) {
  try { localStorage.setItem(READ_KEY, JSON.stringify([...ids].sort((a, b) => b - a).slice(0, 200))); } catch { /* sin almacenamiento */ }
}

export function timeAgo(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "Hace un momento";
  const m = Math.floor(s / 60);
  if (m < 60) return `Hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Hace ${h} hora${h > 1 ? "s" : ""}`;
  const d = Math.floor(h / 24);
  if (d === 1) return "Ayer";
  if (d < 7) return `Hace ${d} días`;
  return new Date(iso).toLocaleDateString("es-CO", { day: "numeric", month: "short" });
}
