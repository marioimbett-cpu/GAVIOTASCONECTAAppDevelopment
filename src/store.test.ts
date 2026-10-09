// Pruebas del almacén de datos con un Supabase simulado (sin red).
// Verifican que las fotos no se guarden dentro de la base de datos y que los
// documentos privados nunca se guarden con enlaces públicos.
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

type Call = { table: string; op: string; payload?: unknown };
const calls: Call[] = [];
const uploads: { bucket: string; path: string }[] = [];

function query(table: string) {
  const q: Record<string, unknown> = {};
  const self = () => q;
  Object.assign(q, {
    select: self, order: self, limit: self, eq: self, in: self, maybeSingle: self,
    insert: (payload: unknown) => { calls.push({ table, op: "insert", payload }); return q; },
    update: (payload: unknown) => { calls.push({ table, op: "update", payload }); return q; },
    upsert: (payload: unknown) => { calls.push({ table, op: "upsert", payload }); return q; },
    delete: () => { calls.push({ table, op: "delete" }); return q; },
    single: () => {
      const last = [...calls].reverse().find((c) => c.table === table && c.op === "insert");
      const p = (last?.payload ?? {}) as Record<string, unknown>;
      return Promise.resolve({ data: { ...p, consecutive: "CV-2026-0001", created_at: "2026-10-08T00:00:00Z", author_id: "u1" }, error: null });
    },
    then: (res: (v: unknown) => unknown) => Promise.resolve({ data: [], error: null }).then(res),
  });
  return q;
}

vi.mock("./supabase", () => ({
  openedFromRecoveryLink: false,
  supabase: {
    from: (t: string) => query(t),
    rpc: async (fn: string) => ({ data: fn === "is_admin" ? false : null, error: null }),
    auth: {
      getSession: async () => ({ data: { session: { user: { id: "u1", is_anonymous: true } } } }),
      signInAnonymously: async () => ({ data: { user: { id: "u1", is_anonymous: true } }, error: null }),
    },
    storage: {
      from: (bucket: string) => ({
        upload: async (path: string) => { uploads.push({ bucket, path }); return { error: null }; },
        getPublicUrl: (path: string) => ({ data: { publicUrl: `https://cdn.test/public/${path}` } }),
        createSignedUrls: async (paths: string[]) => ({ data: paths.map((p) => ({ path: p, signedUrl: `https://cdn.test/signed/${p}?token=x` })) }),
      }),
    },
  },
}));

const alerts: string[] = [];
(globalThis as Record<string, unknown>).alert = (m: string) => { alerts.push(m); };
const { store } = await import("./store");
const flush = () => new Promise((r) => setTimeout(r, 20));
const json = (v: unknown) => JSON.stringify(v);

beforeEach(async () => {
  calls.length = 0;
  uploads.length = 0;
  alerts.length = 0;
  await store.init();
  calls.length = 0;
});

describe("fotos fuera de la base de datos", () => {
  it("perdidos y encontrados: sube la foto al almacenamiento público y guarda solo el enlace", async () => {
    store.setLostFound([{ id: "lf1", photos: [PNG], status: "activo", description: "perro" } as never]);
    await flush();
    const insert = calls.find((c) => c.table === "lost_found" && c.op === "insert");
    expect(uploads).toEqual([expect.objectContaining({ bucket: "publico" })]);
    expect(json(insert?.payload)).not.toContain("data:image");
    expect(json(insert?.payload)).toContain("https://cdn.test/public/u1/");
  });

  it("certificado: fotos al almacenamiento privado, la base de datos guarda referencias privadas", async () => {
    const saved = await store.addCertificate({ id: "c1", photoCedulaFront: PNG, photoRecibo: PNG, fullName: "Ana" } as never);
    const insert = calls.find((c) => c.table === "certificates" && c.op === "insert");
    expect(uploads.every((u) => u.bucket === "certificados")).toBe(true);
    expect(uploads).toHaveLength(2);
    expect(json(insert?.payload)).not.toContain("data:image");
    expect(json(insert?.payload)).not.toContain("https://");
    expect(json(insert?.payload)).toContain("storage://certificados/u1/");
    // en pantalla se ve con enlace firmado
    expect(saved?.photoCedulaFront).toMatch(/^https:\/\/cdn\.test\/signed\//);
  });

  it("al actualizar un certificado no se guardan los enlaces firmados (vencen)", async () => {
    const saved = await store.addCertificate({ id: "c2", photoCedulaFront: PNG, fullName: "Ana" } as never);
    calls.length = 0;
    store.setCertificates(store.getCertificates().map((c) => (c.id === saved!.id ? { ...c, status: "Aprobada" } : c)));
    await flush();
    const update = calls.find((c) => c.table === "certificates" && c.op === "update");
    expect(update).toBeDefined();
    expect(json(update?.payload)).not.toContain("signed");
    expect(json(update?.payload)).toContain("storage://certificados/");
  });

  it("noticias del administrador: la imagen se sube y el contenido guarda el enlace", async () => {
    store.setNews([{ id: 99, title: "Prueba", image: PNG } as never]);
    await flush();
    const upsert = calls.find((c) => c.table === "content_items" && c.op === "upsert");
    expect(json(upsert?.payload)).not.toContain("data:image");
    expect(json(upsert?.payload)).toContain("https://cdn.test/public/");
  });

  it("firma del presidente: va al almacenamiento privado, no al público", async () => {
    store.setSettings({ ...store.getSettings(), presidentSignature: PNG });
    await flush();
    const update = calls.find((c) => c.table === "app_settings" && c.op === "update");
    expect(uploads).toEqual([expect.objectContaining({ bucket: "certificados" })]);
    expect(json(update?.payload)).toContain("storage://certificados/");
    expect(json(update?.payload)).not.toContain("data:image");
  });
});

afterEach(() => { expect(alerts, "la app no debe mostrar errores").toEqual([]); });

describe("cuenta y datos sensibles", () => {
  it("la cédula del trabajador no va en los datos públicos del perfil", async () => {
    store.setWorkers([{ id: "w1", cedula: "1047123456", fullName: "Carlos", workPhotos: [], status: "pendiente", verified: false, hiredCount: 0 } as never]);
    await flush();
    const insert = calls.find((c) => c.table === "workers" && c.op === "insert");
    const priv = calls.find((c) => c.table === "worker_private" && c.op === "insert");
    expect(json(insert?.payload)).not.toContain("1047123456");
    expect(json(priv?.payload)).toContain("1047123456");
  });

  it("los ajustes nunca guardan la contraseña antigua de administrador", async () => {
    store.setSettings({ ...store.getSettings(), adminPassword: "admin2026" });
    await flush();
    const update = calls.find((c) => c.table === "app_settings" && c.op === "update");
    expect(json(update?.payload)).not.toContain("admin2026");
  });
});
