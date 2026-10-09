import { useState, useRef } from "react";
import {
  store,
  NewsItem, EventItem, Place, DirectoryBusiness,
  GalleryPhoto, ChatbotEntry, EmergencyLine, AppSettings,
} from "./store";
import CertificateAdmin from "./CertificateAdmin";
import LostFoundAdmin from "./LostFoundAdmin";
import OfficiosAdmin from "./OfficiosAdmin";
import EyeToggle from "./EyeToggle";

const TEAL = "#0D6E6E";
const CORAL = "#E8643A";

type AdminTab = "news" | "events" | "places" | "directory" | "gallery" | "chatbot" | "emergency" | "settings" | "certificates" | "lostfound" | "oficios";

const TABS: { id: AdminTab; emoji: string; label: string }[] = [
  { id: "news",         emoji: "📰", label: "Noticias" },
  { id: "events",       emoji: "📅", label: "Eventos" },
  { id: "places",       emoji: "🗺️", label: "Mapa" },
  { id: "directory",    emoji: "🏪", label: "Directorio" },
  { id: "gallery",      emoji: "🖼️", label: "Galería" },
  { id: "chatbot",      emoji: "🤖", label: "Chatbot" },
  { id: "emergency",    emoji: "🚨", label: "Urgencias" },
  { id: "certificates", emoji: "📋", label: "Certific." },
  { id: "lostfound",   emoji: "🐾", label: "Perdidos" },
  { id: "oficios",      emoji: "🧰", label: "Oficios" },
  { id: "settings",     emoji: "⚙️", label: "Ajustes" },
];

// ── Image uploader (file → base64, resized to max 800px) ─────────────────────
function ImageUploader({ value, onChange, label = "Imagen" }: {
  value: string | null; onChange: (v: string | null) => void; label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 800;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round((height * MAX) / width); width = MAX; }
          else { width = Math.round((width * MAX) / height); height = MAX; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
        onChange(canvas.toDataURL("image/jpeg", 0.82));
        setLoading(false);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: "#6B7A7A", textTransform: "uppercase" as const, letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>{label}</label>
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      {value ? (
        <div style={{ position: "relative" as const, borderRadius: 12, overflow: "hidden", border: "1.5px solid #E2DAD0" }}>
          <img src={value} alt="preview" style={{ width: "100%", maxHeight: 160, objectFit: "cover" as const, display: "block" }} />
          <div style={{ position: "absolute" as const, bottom: 0, left: 0, right: 0, display: "flex", gap: 8, padding: 8, background: "rgba(0,0,0,0.45)" }}>
            <button onClick={() => inputRef.current?.click()} style={{ flex: 1, padding: "7px", borderRadius: 8, background: "white", border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer", color: TEAL }}>🔄 Cambiar</button>
            <button onClick={() => onChange(null)} style={{ padding: "7px 12px", borderRadius: 8, background: "#FEE2E2", border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer", color: "#DC2626" }}>🗑</button>
          </div>
        </div>
      ) : (
        <button onClick={() => inputRef.current?.click()} disabled={loading} style={{ width: "100%", padding: "20px", borderRadius: 12, border: "2px dashed #E2DAD0", background: loading ? "#F0EBE3" : "white", cursor: loading ? "default" : "pointer", display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 28 }}>{loading ? "⏳" : "📷"}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: TEAL }}>{loading ? "Procesando..." : "Toca para subir imagen"}</span>
          <span style={{ fontSize: 11, color: "#6B7A7A" }}>PNG, JPG o WEBP · Se ajusta a 800px automáticamente</span>
        </button>
      )}
    </div>
  );
}

// ── Shared admin components ───────────────────────────────────────────────────
function AField({ label, value, onChange, type = "text", placeholder = "", multiline = false }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; multiline?: boolean;
}) {
  const [showPwd, setShowPwd] = useState(false);
  const isPwd = type === "password";
  const base: React.CSSProperties = {
    width: "100%", padding: "10px 12px", borderRadius: 10,
    border: "1.5px solid #E2DAD0", fontSize: 13,
    fontFamily: "'Outfit', sans-serif", outline: "none",
    background: "#FFFFFF", color: "#162323", boxSizing: "border-box",
  };
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: "#6B7A7A", textTransform: "uppercase" as const, letterSpacing: "0.05em", display: "block", marginBottom: 4 }}>{label}</label>
      {multiline
        ? <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3} style={{ ...base, resize: "vertical" as const }} />
        : <div style={{ position: "relative" as const }}>
            <input type={isPwd && showPwd ? "text" : type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={isPwd ? { ...base, paddingRight: 46 } : base} />
            {isPwd && <EyeToggle visible={showPwd} onToggle={() => setShowPwd((v) => !v)} />}
          </div>}
    </div>
  );
}

function ABtn({ children, onClick, color = TEAL, small = false, danger = false }: {
  children: React.ReactNode; onClick: () => void; color?: string; small?: boolean; danger?: boolean;
}) {
  return (
    <button onClick={onClick} style={{
      padding: small ? "6px 12px" : "10px 18px", borderRadius: 10,
      background: danger ? "#FEE2E2" : color, color: danger ? "#DC2626" : "white",
      border: "none", cursor: "pointer", fontSize: small ? 12 : 13, fontWeight: 700,
    }}>
      {children}
    </button>
  );
}

function ACard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: "white", borderRadius: 14, border: "1px solid #E2DAD0", padding: "14px 16px", marginBottom: 10, ...style }}>
      {children}
    </div>
  );
}

function SaveBanner({ saved }: { saved: boolean }) {
  if (!saved) return null;
  return (
    <div style={{ position: "fixed" as const, top: 70, left: "50%", transform: "translateX(-50%)", background: TEAL, color: "white", padding: "8px 20px", borderRadius: 100, fontSize: 13, fontWeight: 700, zIndex: 9999, boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
      ✅ Guardado exitosamente
    </div>
  );
}

// ── News Manager ──────────────────────────────────────────────────────────────
function NewsManager() {
  const [items, setItems] = useState<NewsItem[]>(store.getNews());
  const [editing, setEditing] = useState<NewsItem | null>(null);
  const [saved, setSaved] = useState(false);
  const empty: NewsItem = { id: 0, category: "Noticia", color: TEAL, title: "", summary: "", date: "", image: null, readTime: "" };

  function persist(list: NewsItem[]) {
    store.setNews(list);
    setItems(list);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function save() {
    if (!editing) return;
    const exists = items.find((i) => i.id === editing.id);
    if (exists) persist(items.map((i) => i.id === editing.id ? editing : i));
    else persist([{ ...editing, id: Date.now() }, ...items]);
    setEditing(null);
  }

  function del(id: number) {
    if (confirm("¿Eliminar esta noticia?")) persist(items.filter((i) => i.id !== id));
  }

  const catColor: Record<string, string> = { Noticia: TEAL, Comunicado: CORAL, Proyecto: "#7B4FBF" };

  if (editing) return (
    <div>
      <SaveBanner saved={saved} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#162323" }}>{editing.id ? "Editar" : "Nueva"} publicación</h3>
        <ABtn small onClick={() => setEditing(null)} danger>Cancelar</ABtn>
      </div>
      <AField label="Título" value={editing.title} onChange={(v) => setEditing({ ...editing, title: v })} placeholder="Título de la noticia" />
      <AField label="Resumen" value={editing.summary} onChange={(v) => setEditing({ ...editing, summary: v })} placeholder="Descripción breve" multiline />
      <div style={{ marginBottom: 10 }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: "#6B7A7A", textTransform: "uppercase" as const, letterSpacing: "0.05em", display: "block", marginBottom: 4 }}>Categoría</label>
        <div style={{ display: "flex", gap: 8 }}>
          {(["Noticia", "Comunicado", "Proyecto"] as const).map((c) => (
            <button key={c} onClick={() => setEditing({ ...editing, category: c, color: catColor[c] })} style={{ flex: 1, padding: "8px", borderRadius: 9, border: `2px solid ${editing.category === c ? catColor[c] : "#E2DAD0"}`, background: editing.category === c ? catColor[c] + "18" : "white", color: editing.category === c ? catColor[c] : "#6B7A7A", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
              {c}
            </button>
          ))}
        </div>
      </div>
      <AField label="Fecha" value={editing.date} onChange={(v) => setEditing({ ...editing, date: v })} placeholder="ej. 10 sep 2026" />
      <AField label="Tiempo de lectura" value={editing.readTime} onChange={(v) => setEditing({ ...editing, readTime: v })} placeholder="ej. 3 min" />
      <ImageUploader label="Imagen (opcional)" value={editing.image} onChange={(v) => setEditing({ ...editing, image: v })} />
      <ABtn onClick={save}>💾 Guardar publicación</ABtn>
    </div>
  );

  return (
    <div>
      <SaveBanner saved={saved} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <span style={{ fontSize: 14, color: "#6B7A7A" }}>{items.length} publicaciones</span>
        <ABtn small onClick={() => setEditing({ ...empty })}>+ Nueva</ABtn>
      </div>
      {items.map((item) => (
        <ACard key={item.id}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: item.color, background: item.color + "18", padding: "2px 8px", borderRadius: 100 }}>{item.category}</span>
              <p style={{ margin: "6px 0 2px", fontWeight: 700, fontSize: 13, color: "#162323" }}>{item.title}</p>
              <p style={{ margin: 0, fontSize: 11, color: "#6B7A7A" }}>{item.date} · {item.readTime}</p>
            </div>
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              <ABtn small onClick={() => setEditing(item)}>✏️</ABtn>
              <ABtn small danger onClick={() => del(item.id)}>🗑</ABtn>
            </div>
          </div>
        </ACard>
      ))}
    </div>
  );
}

// ── Events Manager ────────────────────────────────────────────────────────────
function EventsManager() {
  const [items, setItems] = useState<EventItem[]>(store.getEvents());
  const [editing, setEditing] = useState<EventItem | null>(null);
  const [saved, setSaved] = useState(false);
  const empty: EventItem = { id: 0, title: "", date: "", time: "", location: "", category: "", color: TEAL, emoji: "📅", spots: "", desc: "", day: "" };

  function persist(list: EventItem[]) { store.setEvents(list); setItems(list); setSaved(true); setTimeout(() => setSaved(false), 2000); }
  function save() {
    if (!editing) return;
    const exists = items.find((i) => i.id === editing.id);
    if (exists) persist(items.map((i) => i.id === editing.id ? editing : i));
    else persist([{ ...editing, id: Date.now() }, ...items]);
    setEditing(null);
  }
  function del(id: number) { if (confirm("¿Eliminar este evento?")) persist(items.filter((i) => i.id !== id)); }

  if (editing) return (
    <div>
      <SaveBanner saved={saved} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{editing.id ? "Editar" : "Nuevo"} evento</h3>
        <ABtn small danger onClick={() => setEditing(null)}>Cancelar</ABtn>
      </div>
      <AField label="Título" value={editing.title} onChange={(v) => setEditing({ ...editing, title: v })} />
      <AField label="Descripción" value={editing.desc} onChange={(v) => setEditing({ ...editing, desc: v })} multiline />
      <AField label="Fecha (texto)" value={editing.date} onChange={(v) => setEditing({ ...editing, date: v })} placeholder="ej. 14 sep 2026" />
      <AField label="Día del mes (número)" value={editing.day} onChange={(v) => setEditing({ ...editing, day: v })} placeholder="ej. 14" />
      <AField label="Hora" value={editing.time} onChange={(v) => setEditing({ ...editing, time: v })} placeholder="ej. 7:00 a.m." />
      <AField label="Lugar" value={editing.location} onChange={(v) => setEditing({ ...editing, location: v })} />
      <AField label="Categoría" value={editing.category} onChange={(v) => setEditing({ ...editing, category: v })} placeholder="ej. Deporte, Reunión" />
      <AField label="Cupos" value={editing.spots} onChange={(v) => setEditing({ ...editing, spots: v })} placeholder="ej. 20 cupos" />
      <AField label="Emoji" value={editing.emoji} onChange={(v) => setEditing({ ...editing, emoji: v })} placeholder="ej. 🌱" />
      <ABtn onClick={save}>💾 Guardar evento</ABtn>
    </div>
  );

  return (
    <div>
      <SaveBanner saved={saved} />
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
        <span style={{ fontSize: 14, color: "#6B7A7A" }}>{items.length} eventos</span>
        <ABtn small onClick={() => setEditing({ ...empty })}>+ Nuevo</ABtn>
      </div>
      {items.map((item) => (
        <ACard key={item.id}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: 13 }}>{item.emoji} {item.title}</p>
              <p style={{ margin: 0, fontSize: 11, color: "#6B7A7A" }}>{item.date} · {item.time} · {item.location}</p>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <ABtn small onClick={() => setEditing(item)}>✏️</ABtn>
              <ABtn small danger onClick={() => del(item.id)}>🗑</ABtn>
            </div>
          </div>
        </ACard>
      ))}
    </div>
  );
}

// ── Places Manager ────────────────────────────────────────────────────────────
const PLACE_CATEGORIES = [
  { id: "institucional", label: "Institucional", emoji: "🏛" },
  { id: "salud", label: "Salud", emoji: "🏥" },
  { id: "educacion", label: "Educación", emoji: "🏫" },
  { id: "deporte", label: "Deporte", emoji: "⚽" },
  { id: "comercio", label: "Comercio", emoji: "🛒" },
  { id: "religion", label: "Iglesia", emoji: "⛪" },
  { id: "parque", label: "Parque", emoji: "🌳" },
];

function PlacesManager() {
  const [items, setItems] = useState<Place[]>(store.getPlaces());
  const [editing, setEditing] = useState<Place | null>(null);
  const [saved, setSaved] = useState(false);
  const empty: Place = { id: 0, name: "", desc: "", category: "comercio", emoji: "📍", color: TEAL, lat: 10.4004, lng: -75.4893 };

  function persist(list: Place[]) { store.setPlaces(list); setItems(list); setSaved(true); setTimeout(() => setSaved(false), 2000); }
  function save() {
    if (!editing) return;
    const exists = items.find((i) => i.id === editing.id);
    if (exists) persist(items.map((i) => i.id === editing.id ? editing : i));
    else persist([{ ...editing, id: Date.now() }, ...items]);
    setEditing(null);
  }
  function del(id: number) { if (confirm("¿Eliminar este lugar?")) persist(items.filter((i) => i.id !== id)); }

  if (editing) return (
    <div>
      <SaveBanner saved={saved} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{editing.id ? "Editar" : "Nuevo"} lugar</h3>
        <ABtn small danger onClick={() => setEditing(null)}>Cancelar</ABtn>
      </div>
      <AField label="Nombre" value={editing.name} onChange={(v) => setEditing({ ...editing, name: v })} />
      <AField label="Descripción" value={editing.desc} onChange={(v) => setEditing({ ...editing, desc: v })} multiline />
      <div style={{ marginBottom: 10 }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: "#6B7A7A", textTransform: "uppercase" as const, letterSpacing: "0.05em", display: "block", marginBottom: 4 }}>Categoría</label>
        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
          {PLACE_CATEGORIES.map((c) => (
            <button key={c.id} onClick={() => setEditing({ ...editing, category: c.id, emoji: c.emoji })} style={{ padding: "6px 12px", borderRadius: 9, border: `2px solid ${editing.category === c.id ? TEAL : "#E2DAD0"}`, background: editing.category === c.id ? TEAL + "15" : "white", color: editing.category === c.id ? TEAL : "#6B7A7A", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
      </div>
      <AField label="Emoji del marcador" value={editing.emoji} onChange={(v) => setEditing({ ...editing, emoji: v })} placeholder="ej. 🛒" />
      <AField label="Teléfono (opcional)" value={editing.phone || ""} onChange={(v) => setEditing({ ...editing, phone: v })} placeholder="ej. 300 123 4567" />
      <AField label="Horario (opcional)" value={editing.hours || ""} onChange={(v) => setEditing({ ...editing, hours: v })} placeholder="ej. Lun–Vie 8 a.m.–5 p.m." />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <AField label="Latitud" value={String(editing.lat)} onChange={(v) => setEditing({ ...editing, lat: parseFloat(v) || editing.lat })} placeholder="ej. 10.4004" />
        <AField label="Longitud" value={String(editing.lng)} onChange={(v) => setEditing({ ...editing, lng: parseFloat(v) || editing.lng })} placeholder="ej. -75.4893" />
      </div>
      <div style={{ background: "#F0EBE3", borderRadius: 10, padding: "10px 12px", marginBottom: 12, fontSize: 12, color: "#6B7A7A" }}>
        💡 Para obtener coordenadas: abre Google Maps, presiona largo sobre el punto y copia las coordenadas.
      </div>
      <ImageUploader label="Foto del lugar (opcional)" value={editing.image ?? null} onChange={(v) => setEditing({ ...editing, image: v })} />
      <ABtn onClick={save}>💾 Guardar lugar</ABtn>
    </div>
  );

  return (
    <div>
      <SaveBanner saved={saved} />
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
        <span style={{ fontSize: 14, color: "#6B7A7A" }}>{items.length} lugares</span>
        <ABtn small onClick={() => setEditing({ ...empty })}>+ Nuevo</ABtn>
      </div>
      {items.map((item) => (
        <ACard key={item.id}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flex: 1 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: item.color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{item.emoji}</div>
              <div>
                <p style={{ margin: "0 0 1px", fontWeight: 700, fontSize: 13 }}>{item.name}</p>
                <p style={{ margin: 0, fontSize: 11, color: "#6B7A7A" }}>{item.category} · {item.lat.toFixed(4)}, {item.lng.toFixed(4)}</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <ABtn small onClick={() => setEditing(item)}>✏️</ABtn>
              <ABtn small danger onClick={() => del(item.id)}>🗑</ABtn>
            </div>
          </div>
        </ACard>
      ))}
    </div>
  );
}

// ── Directory Manager ─────────────────────────────────────────────────────────
function DirectoryManager() {
  const [items, setItems] = useState<DirectoryBusiness[]>(store.getDirectory());
  const [editing, setEditing] = useState<DirectoryBusiness | null>(null);
  const [saved, setSaved] = useState(false);
  const empty: DirectoryBusiness = { id: 0, name: "", category: "", phone: "", emoji: "🏪", hours: "" };

  function persist(list: DirectoryBusiness[]) { store.setDirectory(list); setItems(list); setSaved(true); setTimeout(() => setSaved(false), 2000); }
  function save() {
    if (!editing) return;
    const exists = items.find((i) => i.id === editing.id);
    if (exists) persist(items.map((i) => i.id === editing.id ? editing : i));
    else persist([{ ...editing, id: Date.now() }, ...items]);
    setEditing(null);
  }
  function del(id: number) { if (confirm("¿Eliminar este negocio?")) persist(items.filter((i) => i.id !== id)); }

  if (editing) return (
    <div>
      <SaveBanner saved={saved} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{editing.id ? "Editar" : "Nuevo"} negocio</h3>
        <ABtn small danger onClick={() => setEditing(null)}>Cancelar</ABtn>
      </div>
      <AField label="Emoji" value={editing.emoji} onChange={(v) => setEditing({ ...editing, emoji: v })} placeholder="ej. 🛒" />
      <AField label="Nombre del negocio" value={editing.name} onChange={(v) => setEditing({ ...editing, name: v })} />
      <AField label="Categoría" value={editing.category} onChange={(v) => setEditing({ ...editing, category: v })} placeholder="ej. Abarrotes, Belleza, Salud" />
      <AField label="Teléfono" value={editing.phone} onChange={(v) => setEditing({ ...editing, phone: v })} placeholder="ej. 300 123 4567" />
      <AField label="Horario" value={editing.hours} onChange={(v) => setEditing({ ...editing, hours: v })} placeholder="ej. 6 a.m. – 9 p.m." />
      <AField label="Dirección (opcional)" value={editing.address || ""} onChange={(v) => setEditing({ ...editing, address: v })} />
      <ABtn onClick={save}>💾 Guardar negocio</ABtn>
    </div>
  );

  return (
    <div>
      <SaveBanner saved={saved} />
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
        <span style={{ fontSize: 14, color: "#6B7A7A" }}>{items.length} negocios</span>
        <ABtn small onClick={() => setEditing({ ...empty })}>+ Nuevo</ABtn>
      </div>
      {items.map((item) => (
        <ACard key={item.id}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flex: 1 }}>
              <span style={{ fontSize: 22 }}>{item.emoji}</span>
              <div>
                <p style={{ margin: "0 0 1px", fontWeight: 700, fontSize: 13 }}>{item.name}</p>
                <p style={{ margin: 0, fontSize: 11, color: "#6B7A7A" }}>{item.category} · {item.phone}</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <ABtn small onClick={() => setEditing(item)}>✏️</ABtn>
              <ABtn small danger onClick={() => del(item.id)}>🗑</ABtn>
            </div>
          </div>
        </ACard>
      ))}
    </div>
  );
}

// ── Gallery Manager ───────────────────────────────────────────────────────────
function GalleryManager() {
  const [items, setItems] = useState<GalleryPhoto[]>(store.getGallery());
  const [editing, setEditing] = useState<GalleryPhoto | null>(null);
  const [saved, setSaved] = useState(false);
  const empty: GalleryPhoto = { id: "", url: "", caption: "", category: "" };

  function persist(list: GalleryPhoto[]) { store.setGallery(list); setItems(list); setSaved(true); setTimeout(() => setSaved(false), 2000); }
  function save() {
    if (!editing || !editing.url) return;
    const newItem = { ...editing, id: editing.id || String(Date.now()) };
    const exists = items.find((i) => i.id === editing.id);
    if (exists) persist(items.map((i) => i.id === editing.id ? newItem : i));
    else persist([newItem, ...items]);
    setEditing(null);
  }
  function del(id: string) { if (confirm("¿Eliminar esta foto?")) persist(items.filter((i) => i.id !== id)); }

  if (editing) return (
    <div>
      <SaveBanner saved={saved} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{editing.id ? "Editar" : "Nueva"} foto</h3>
        <ABtn small danger onClick={() => setEditing(null)}>Cancelar</ABtn>
      </div>
      <ImageUploader label="Foto" value={editing.url || null} onChange={(v) => setEditing({ ...editing, url: v || "" })} />
      <AField label="Descripción / leyenda" value={editing.caption} onChange={(v) => setEditing({ ...editing, caption: v })} placeholder="ej. Jornada de limpieza" />
      <AField label="Categoría" value={editing.category} onChange={(v) => setEditing({ ...editing, category: v })} placeholder="ej. Barrio, Deporte, Comunidad" />
      <ABtn onClick={save}>💾 Guardar foto</ABtn>
    </div>
  );

  return (
    <div>
      <SaveBanner saved={saved} />
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
        <span style={{ fontSize: 14, color: "#6B7A7A" }}>{items.length} fotos</span>
        <ABtn small onClick={() => setEditing({ ...empty })}>+ Nueva foto</ABtn>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {items.map((item) => (
          <div key={item.id} style={{ background: "white", borderRadius: 12, border: "1px solid #E2DAD0", overflow: "hidden" }}>
            <img src={item.url} alt={item.caption} style={{ width: "100%", height: 90, objectFit: "cover" as const }} onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1519689680058-324335573bb0?w=300&h=200&fit=crop"; }} />
            <div style={{ padding: "8px 10px" }}>
              <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: "#162323" }}>{item.caption || "Sin leyenda"}</p>
              <p style={{ margin: "0 0 6px", fontSize: 10, color: "#6B7A7A" }}>{item.category}</p>
              <div style={{ display: "flex", gap: 5 }}>
                <ABtn small onClick={() => setEditing(item)}>✏️</ABtn>
                <ABtn small danger onClick={() => del(item.id)}>🗑</ABtn>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Chatbot Manager ───────────────────────────────────────────────────────────
function ChatbotManager() {
  const [items, setItems] = useState<ChatbotEntry[]>(store.getChatbot());
  const [editing, setEditing] = useState<ChatbotEntry | null>(null);
  const [saved, setSaved] = useState(false);
  const empty: ChatbotEntry = { id: 0, patterns: "", answer: "" };

  function persist(list: ChatbotEntry[]) { store.setChatbot(list); setItems(list); setSaved(true); setTimeout(() => setSaved(false), 2000); }
  function save() {
    if (!editing) return;
    const exists = items.find((i) => i.id === editing.id);
    if (exists) persist(items.map((i) => i.id === editing.id ? editing : i));
    else persist([{ ...editing, id: Date.now() }, ...items]);
    setEditing(null);
  }
  function del(id: number) { if (confirm("¿Eliminar esta respuesta?")) persist(items.filter((i) => i.id !== id)); }

  if (editing) return (
    <div>
      <SaveBanner saved={saved} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{editing.id ? "Editar" : "Nueva"} respuesta</h3>
        <ABtn small danger onClick={() => setEditing(null)}>Cancelar</ABtn>
      </div>
      <AField label="Palabras clave (separadas por coma)" value={editing.patterns} onChange={(v) => setEditing({ ...editing, patterns: v })} placeholder="ej. jac, junta, reunion, asamblea" />
      <AField label="Respuesta del bot (usa *texto* para negrita)" value={editing.answer} onChange={(v) => setEditing({ ...editing, answer: v })} multiline placeholder="Escribe la respuesta que dará el bot..." />
      <div style={{ background: "#F0EBE3", borderRadius: 10, padding: "10px 12px", marginBottom: 12, fontSize: 12, color: "#6B7A7A" }}>
        💡 El bot busca si el mensaje del usuario contiene alguna de las palabras clave y responde con el texto configurado. Usa *texto* para poner en negrita.
      </div>
      <ABtn onClick={save}>💾 Guardar respuesta</ABtn>
    </div>
  );

  return (
    <div>
      <SaveBanner saved={saved} />
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
        <span style={{ fontSize: 14, color: "#6B7A7A" }}>{items.length} respuestas configuradas</span>
        <ABtn small onClick={() => setEditing({ ...empty })}>+ Nueva</ABtn>
      </div>
      {items.map((item) => (
        <ACard key={item.id}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: TEAL }}>🔑 {item.patterns}</p>
              <p style={{ margin: 0, fontSize: 12, color: "#162323", whiteSpace: "pre-line" as const, overflow: "hidden", maxHeight: 48, textOverflow: "ellipsis" }}>{item.answer.slice(0, 80)}{item.answer.length > 80 ? "…" : ""}</p>
            </div>
            <div style={{ display: "flex", gap: 6, marginLeft: 10 }}>
              <ABtn small onClick={() => setEditing(item)}>✏️</ABtn>
              <ABtn small danger onClick={() => del(item.id)}>🗑</ABtn>
            </div>
          </div>
        </ACard>
      ))}
    </div>
  );
}

// ── Emergency Manager ─────────────────────────────────────────────────────────
function EmergencyManager() {
  const [items, setItems] = useState<EmergencyLine[]>(store.getEmergency());
  const [editing, setEditing] = useState<EmergencyLine | null>(null);
  const [saved, setSaved] = useState(false);
  const empty: EmergencyLine = { id: 0, emoji: "📞", label: "", num: "", desc: "" };

  function persist(list: EmergencyLine[]) { store.setEmergency(list); setItems(list); setSaved(true); setTimeout(() => setSaved(false), 2000); }
  function save() {
    if (!editing) return;
    const exists = items.find((i) => i.id === editing.id);
    if (exists) persist(items.map((i) => i.id === editing.id ? editing : i));
    else persist([{ ...editing, id: Date.now() }, ...items]);
    setEditing(null);
  }
  function del(id: number) { if (confirm("¿Eliminar esta línea?")) persist(items.filter((i) => i.id !== id)); }

  if (editing) return (
    <div>
      <SaveBanner saved={saved} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{editing.id ? "Editar" : "Nueva"} línea</h3>
        <ABtn small danger onClick={() => setEditing(null)}>Cancelar</ABtn>
      </div>
      <AField label="Emoji" value={editing.emoji} onChange={(v) => setEditing({ ...editing, emoji: v })} placeholder="ej. 👮" />
      <AField label="Nombre del servicio" value={editing.label} onChange={(v) => setEditing({ ...editing, label: v })} placeholder="ej. Policía Nacional" />
      <AField label="Número de teléfono" value={editing.num} onChange={(v) => setEditing({ ...editing, num: v })} placeholder="ej. 123" />
      <AField label="Descripción breve" value={editing.desc} onChange={(v) => setEditing({ ...editing, desc: v })} placeholder="ej. Emergencias policiales" />
      <ABtn onClick={save}>💾 Guardar línea</ABtn>
    </div>
  );

  return (
    <div>
      <SaveBanner saved={saved} />
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
        <span style={{ fontSize: 14, color: "#6B7A7A" }}>{items.length} líneas</span>
        <ABtn small onClick={() => setEditing({ ...empty })}>+ Nueva</ABtn>
      </div>
      {items.map((item) => (
        <ACard key={item.id}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flex: 1 }}>
              <span style={{ fontSize: 22 }}>{item.emoji}</span>
              <div>
                <p style={{ margin: "0 0 1px", fontWeight: 700, fontSize: 13 }}>{item.label}</p>
                <p style={{ margin: 0, fontSize: 12, color: CORAL, fontWeight: 700 }}>{item.num} <span style={{ color: "#6B7A7A", fontWeight: 400 }}>· {item.desc}</span></p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <ABtn small onClick={() => setEditing(item)}>✏️</ABtn>
              <ABtn small danger onClick={() => del(item.id)}>🗑</ABtn>
            </div>
          </div>
        </ACard>
      ))}
    </div>
  );
}

// ── Settings Manager ──────────────────────────────────────────────────────────
function SettingsManager() {
  const [settings, setSettings] = useState<AppSettings>(store.getSettings());
  const [saved, setSaved] = useState(false);
  const [newPwd, setNewPwd] = useState("");
  const [pwdMsg, setPwdMsg] = useState("");

  async function changePassword() {
    if (newPwd.length < 8) { setPwdMsg("La contraseña debe tener mínimo 8 caracteres"); return; }
    const error = await store.changeAdminPassword(newPwd);
    setPwdMsg(error ? `No se pudo cambiar: ${error}` : "✅ Contraseña actualizada");
    if (!error) setNewPwd("");
  }

  function save() {
    store.setSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div>
      <SaveBanner saved={saved} />
      <ACard>
        <p style={{ margin: "0 0 12px", fontWeight: 700, fontSize: 14, color: "#162323" }}>🦅 Identidad de la App</p>
        <AField label="Nombre de la app" value={settings.appName} onChange={(v) => setSettings({ ...settings, appName: v })} placeholder="Gaviotas Conecta" />
        <AField label="Emoji / logo" value={settings.logoEmoji} onChange={(v) => setSettings({ ...settings, logoEmoji: v })} placeholder="🦅" />
        <div style={{ background: "#F0EBE3", borderRadius: 12, padding: "14px", textAlign: "center" as const, marginBottom: 10 }}>
          <div style={{ fontSize: 48, marginBottom: 4 }}>{settings.logoEmoji || "🦅"}</div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 16, color: TEAL }}>{settings.appName || "Gaviotas Conecta"}</p>
        </div>
        <AField label="Nombre del barrio" value={settings.neighborhood} onChange={(v) => setSettings({ ...settings, neighborhood: v })} />
        <AField label="Ciudad" value={settings.city} onChange={(v) => setSettings({ ...settings, city: v })} />
      </ACard>
      <ACard>
        <p style={{ margin: "0 0 12px", fontWeight: 700, fontSize: 14, color: "#162323" }}>📋 Certificados de vecindad</p>
        <AField label="Nombre del presidente JAC" value={settings.presidentName ?? ""} onChange={(v) => setSettings({ ...settings, presidentName: v })} placeholder="Ej: Juan Carlos Pérez" />
        <AField label="Correo del presidente" value={settings.presidentEmail ?? ""} onChange={(v) => setSettings({ ...settings, presidentEmail: v })} placeholder="jac.lasgaviotas@correo.com" />
        <AField label="Resolución No." value={settings.resolutionNumber ?? ""} onChange={(v) => setSettings({ ...settings, resolutionNumber: v })} placeholder="Ej: 001-2026" />
        <AField label="NIT" value={settings.nit ?? ""} onChange={(v) => setSettings({ ...settings, nit: v })} placeholder="Ej: 900.000.000-1" />

        <p style={{ margin: "14px 0 8px", fontWeight: 700, fontSize: 13, color: "#162323" }}>✍️ Firma digital del presidente</p>
        <ImageUploader
          label="Firma (PNG o JPG con fondo transparente o blanco)"
          value={settings.presidentSignature ?? null}
          onChange={(v) => setSettings({ ...settings, presidentSignature: v ?? "" })}
        />

        <p style={{ margin: "14px 0 8px", fontWeight: 700, fontSize: 13, color: "#162323" }}>📝 Textos del certificado</p>
        <AField
          label="Párrafo 2 — reconocimiento de vecindad"
          value={settings.certTextP2 ?? ""}
          onChange={(v) => setSettings({ ...settings, certTextP2: v })}
          multiline
          placeholder="Que, según la información y los soportes aportados..."
        />
        <AField
          label="Nota legal al pie"
          value={settings.certTextDisclaimer ?? ""}
          onChange={(v) => setSettings({ ...settings, certTextDisclaimer: v })}
          multiline
          placeholder="Este certificado se expide con base en..."
        />
      </ACard>
      <ABtn onClick={save}>💾 Guardar ajustes</ABtn>
      <ACard>
        <p style={{ margin: "0 0 12px", fontWeight: 700, fontSize: 14, color: "#162323" }}>🔐 Tu contraseña de administrador</p>
        <AField label="Nueva contraseña" type="password" value={newPwd} onChange={setNewPwd} placeholder="Mínimo 8 caracteres" />
        {pwdMsg && <p style={{ fontSize: 12, color: pwdMsg.startsWith("✅") ? "#16A34A" : "#DC2626", margin: "0 0 10px" }}>{pwdMsg}</p>}
        <ABtn onClick={changePassword}>Cambiar contraseña</ABtn>
      </ACard>
      <ACard>
        <ABtn onClick={async () => { await store.adminSignOut(); window.location.reload(); }}>🚪 Cerrar sesión de administrador</ABtn>
      </ACard>
    </div>
  );
}

// ── Admin Panel Root ──────────────────────────────────────────────────────────
interface AdminPanelProps {
  onClose: () => void;
}

export default function AdminPanel({ onClose }: AdminPanelProps) {
  const [tab, setTab] = useState<AdminTab>("news");

  const tabContent: Record<AdminTab, React.ReactNode> = {
    news:      <NewsManager />,
    events:    <EventsManager />,
    places:    <PlacesManager />,
    directory: <DirectoryManager />,
    gallery:   <GalleryManager />,
    chatbot:   <ChatbotManager />,
    emergency:    <EmergencyManager />,
    settings:     <SettingsManager />,
    certificates: <CertificateAdmin />,
    lostfound:    <LostFoundAdmin />,
    oficios:      <OfficiosAdmin />,
  };

  const current = TABS.find((t) => t.id === tab)!;

  return (
    <div style={{ position: "fixed" as const, inset: 0, zIndex: 99999, background: "#FAF6F0", display: "flex", flexDirection: "column" as const, fontFamily: "'Outfit', sans-serif" }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${TEAL}, #062E2E)`, padding: "16px 20px 14px", flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>⚙️</div>
            <div>
              <p style={{ margin: 0, color: "white", fontWeight: 700, fontSize: 16, fontFamily: "'Fraunces', serif" }}>Panel Administrativo</p>
              <p style={{ margin: 0, color: "rgba(255,255,255,0.6)", fontSize: 11 }}>Gaviotas Conecta</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 10, padding: "8px 14px", color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            ✕ Salir
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ background: "white", borderBottom: "1px solid #E2DAD0", flexShrink: 0, display: "grid", gridTemplateColumns: "repeat(6, 1fr)" }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "9px 4px", border: "none", background: tab === t.id ? TEAL + "12" : "none",
            borderBottom: `3px solid ${tab === t.id ? TEAL : "transparent"}`,
            color: tab === t.id ? TEAL : "#6B7A7A", fontWeight: 700, fontSize: 11,
            cursor: "pointer", display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 2,
          }}>
            <span style={{ fontSize: 18 }}>{t.emoji}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Section title */}
      <div style={{ padding: "14px 20px 0", flexShrink: 0 }}>
        <h2 style={{ margin: 0, fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 700, color: "#162323" }}>
          {current.emoji} {current.label}
        </h2>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto" as const, padding: "14px 20px 24px" }}>
        {tabContent[tab]}
      </div>
    </div>
  );
}
