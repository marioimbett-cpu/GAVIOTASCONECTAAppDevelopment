import { useState, useRef } from "react";
import { store, LostFoundItem, LFType, LFCategory, LFSpecies, LFSize, LFObjectCat } from "./store";

const TEAL = "#0D6E6E";
const CORAL = "#E8643A";
const RED = "#DC2626";
const GREEN = "#16A34A";

const SECTORS = [
  "Sector Norte", "Sector Sur", "Sector Este", "Sector Oeste",
  "Sector Central", "Entrada principal", "Zona comercial",
  "Cerca al parque", "Cerca a la cancha", "Cerca al salón comunal",
  "Cerca al puesto de salud", "Vía principal", "Otro sector",
];

const SPECIES: LFSpecies[] = ["Perro", "Gato", "Pájaro", "Otro"];
const SIZES: LFSize[] = ["Pequeño", "Mediano", "Grande"];
const OBJECT_CATS: LFObjectCat[] = ["Documentos", "Llaves", "Celular", "Billetera", "Ropa", "Otro"];

function daysAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Hace 1 día";
  return `Hace ${diff} días`;
}

function newId() {
  return store.newId();
}

// ── Photo uploader ────────────────────────────────────────────────────────────
function PhotoUploader({ photos, onChange, max = 4 }: {
  photos: string[]; onChange: (p: string[]) => void; max?: number;
}) {
  const ref = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 900;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round((height * MAX) / width); width = MAX; }
          else { width = Math.round((width * MAX) / height); height = MAX; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
        onChange([...photos, canvas.toDataURL("image/jpeg", 0.85)]);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
        {photos.map((p, i) => (
          <div key={i} style={{ position: "relative", width: 80, height: 80 }}>
            <img src={p} alt="" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 10, border: "1.5px solid #E2DAD0" }} />
            <button onClick={() => onChange(photos.filter((_, j) => j !== i))}
              style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", background: RED, border: "2px solid white", color: "white", fontSize: 10, fontWeight: 900, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
              ×
            </button>
          </div>
        ))}
        {photos.length < max && (
          <button onClick={() => ref.current?.click()}
            style={{ width: 80, height: 80, borderRadius: 10, border: `2px dashed ${TEAL}60`, background: TEAL + "08", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
            <span style={{ fontSize: 22 }}>📷</span>
            <span style={{ fontSize: 10, color: TEAL, fontWeight: 700 }}>Agregar</span>
          </button>
        )}
      </div>
      <input ref={ref} type="file" accept="image/*" style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
      <p style={{ fontSize: 11, color: "#6B7A7A", margin: 0 }}>Máximo {max} fotos · Se ajustan automáticamente</p>
    </div>
  );
}

// ── Shared UI ─────────────────────────────────────────────────────────────────
function Chip({ label, active, color = TEAL, onClick }: { label: string; active: boolean; color?: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: "7px 14px", borderRadius: 100, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700,
      background: active ? color : "#F0EBE3", color: active ? "white" : "#6B7A7A", transition: "all 0.15s",
    }}>{label}</button>
  );
}

function Field({ label, value, onChange, placeholder = "", type = "text", required = true }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; required?: boolean;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: "#6B7A7A", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", gap: 4, marginBottom: 6 }}>
        {label}{required && <span style={{ color: CORAL }}>*</span>}
      </label>
      <input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)}
        style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid #E2DAD0", fontSize: 14, fontFamily: "'Outfit', sans-serif", outline: "none", background: "white", color: "#162323", boxSizing: "border-box" }} />
    </div>
  );
}

function Select({ label, value, onChange, options, required = true }: {
  label: string; value: string; onChange: (v: string) => void; options: string[]; required?: boolean;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: "#6B7A7A", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", gap: 4, marginBottom: 6 }}>
        {label}{required && <span style={{ color: CORAL }}>*</span>}
      </label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid #E2DAD0", fontSize: 14, fontFamily: "'Outfit', sans-serif", outline: "none", background: "white", color: value ? "#162323" : "#9CA3AF" }}>
        <option value="">Selecciona...</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function Textarea({ label, value, onChange, placeholder = "", required = false }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: "#6B7A7A", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", gap: 4, marginBottom: 6 }}>
        {label}{required && <span style={{ color: CORAL }}>*</span>}
      </label>
      <textarea value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} rows={3}
        style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid #E2DAD0", fontSize: 14, fontFamily: "'Outfit', sans-serif", outline: "none", background: "white", color: "#162323", resize: "vertical", boxSizing: "border-box" }} />
    </div>
  );
}

function WarnBox({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "#FEF3C7", border: "1.5px solid #D97706", borderRadius: 12, padding: "10px 14px", marginBottom: 14, display: "flex", gap: 8 }}>
      <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
      <span style={{ fontSize: 12, color: "#92400E", lineHeight: 1.5 }}>{children}</span>
    </div>
  );
}

// ── Item card ─────────────────────────────────────────────────────────────────
function ItemCard({ item, onClick }: { item: LostFoundItem; onClick: () => void }) {
  const isLost = item.type === "Perdido";
  const isPet = item.category === "Mascota";
  const title = isPet ? (item.petName || `${item.species} ${item.color || ""}`.trim()) : (item.objectCat || "Objeto");
  const subtitle = item.description.slice(0, 60) + (item.description.length > 60 ? "…" : "");

  return (
    <button onClick={onClick} style={{
      background: "white", border: "1px solid #E2DAD0", borderRadius: 16, overflow: "hidden",
      display: "flex", flexDirection: "column", cursor: "pointer", textAlign: "left", width: "100%", padding: 0,
    }}>
      {/* Photo */}
      <div style={{ width: "100%", height: 160, background: "#F0EBE3", position: "relative", flexShrink: 0 }}>
        {item.photos[0] ? (
          <img src={item.photos[0]} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48 }}>
            {isPet ? "🐾" : "📦"}
          </div>
        )}
        {/* Badge */}
        <div style={{
          position: "absolute", top: 10, left: 10,
          background: isLost ? RED : GREEN, color: "white",
          fontSize: 11, fontWeight: 800, padding: "4px 10px", borderRadius: 100,
          textTransform: "uppercase", letterSpacing: "0.06em",
        }}>
          {isLost ? "🔍 Perdido" : "✅ Encontrado"}
        </div>
        <div style={{
          position: "absolute", top: 10, right: 10,
          background: "rgba(0,0,0,0.55)", color: "white",
          fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 100,
        }}>
          {isPet ? "🐾 Mascota" : "📦 Objeto"}
        </div>
      </div>
      {/* Info */}
      <div style={{ padding: "12px 14px" }}>
        <p style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 800, color: "#162323", margin: "0 0 3px" }}>{title}</p>
        <p style={{ fontSize: 13, color: "#6B7A7A", margin: "0 0 8px", lineHeight: 1.4 }}>{subtitle}</p>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, color: "#6B7A7A", display: "flex", alignItems: "center", gap: 3 }}>
            📍 {item.sector}
          </span>
          <span style={{ fontSize: 11, color: "#6B7A7A" }}>· {daysAgo(item.createdAt)}</span>
        </div>
      </div>
    </button>
  );
}

// ── Detail view ───────────────────────────────────────────────────────────────
function DetailView({ item, onBack, onResolve, isAuthor }: {
  item: LostFoundItem; onBack: () => void; onResolve: () => void; isAuthor: boolean;
}) {
  const [photoIdx, setPhotoIdx] = useState(0);
  const isLost = item.type === "Perdido";
  const isPet = item.category === "Mascota";
  const title = isPet ? (item.petName || `${item.species} ${item.color || ""}`.trim()) : (item.objectCat || "Objeto");
  const whatsappUrl = `https://wa.me/57${item.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
    `Hola, vi tu publicación en Gaviotas Conecta sobre ${isLost ? "mascota/objeto perdido" : "mascota/objeto encontrado"}: "${title}". ¿Sigue disponible?`
  )}`;
  const shareText = encodeURIComponent(
    `🔔 ${item.type.toUpperCase()}: ${title}\n📍 ${item.sector}\n📅 ${item.dateLostFound}\nContacto: ${item.phone}\n\nVisto en Gaviotas Conecta · Barrio Las Gaviotas`
  );
  const shareUrl = `https://wa.me/?text=${shareText}`;

  return (
    <div style={{ paddingBottom: 32 }}>
      <div style={{ padding: "12px 20px 0" }}>
        <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: TEAL, fontSize: 14, fontWeight: 600, cursor: "pointer", padding: "0 0 12px" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M11 6l-6 6 6 6" stroke={TEAL} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Volver
        </button>
      </div>

      {/* Photo gallery */}
      {item.photos.length > 0 && (
        <div>
          <div style={{ width: "100%", height: 240, background: "#F0EBE3", position: "relative" }}>
            <img src={item.photos[photoIdx]} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", top: 12, left: 12 }}>
              <span style={{ background: isLost ? RED : GREEN, color: "white", fontSize: 12, fontWeight: 800, padding: "5px 12px", borderRadius: 100 }}>
                {isLost ? "🔍 Perdido" : "✅ Encontrado"}
              </span>
            </div>
          </div>
          {item.photos.length > 1 && (
            <div style={{ display: "flex", gap: 8, padding: "8px 20px" }}>
              {item.photos.map((p, i) => (
                <button key={i} onClick={() => setPhotoIdx(i)} style={{ width: 56, height: 56, borderRadius: 10, overflow: "hidden", border: i === photoIdx ? `2.5px solid ${TEAL}` : "2px solid transparent", padding: 0, cursor: "pointer" }}>
                  <img src={p} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ padding: "16px 20px" }}>
        <p style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 800, color: "#162323", margin: "0 0 4px" }}>{title}</p>
        <p style={{ fontSize: 13, color: "#6B7A7A", margin: "0 0 16px" }}>📍 {item.sector} · {daysAgo(item.createdAt)}</p>

        {/* Pet info */}
        {isPet && (
          <div style={{ background: "#F0FAF5", borderRadius: 14, padding: "14px", marginBottom: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#6B7A7A", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 10px" }}>Datos de la mascota</p>
            {([
              item.species ? ["Especie", item.species] : null,
              item.breed ? ["Raza", item.breed] : null,
              item.color ? ["Color", item.color] : null,
              item.size ? ["Tamaño", item.size] : null,
              item.hasCollar !== undefined ? ["Collar", item.hasCollar ? "Sí" : "No"] : null,
              item.hasTag !== undefined ? ["Placa de identificación", item.hasTag ? "Sí" : "No"] : null,
            ] as ([string, string] | null)[]).filter((x): x is [string, string] => x !== null).map(([k, v]) => (
              <div key={k as string} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #E2DAD0" }}>
                <span style={{ fontSize: 13, color: "#6B7A7A", fontWeight: 600 }}>{k as string}</span>
                <span style={{ fontSize: 13, color: "#162323", fontWeight: 700 }}>{v as string}</span>
              </div>
            ))}
          </div>
        )}

        {/* Description */}
        {item.description && (
          <div style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#6B7A7A", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 6px" }}>
              {isPet ? "Señas particulares" : "Descripción"}
            </p>
            <p style={{ fontSize: 14, color: "#162323", lineHeight: 1.6, margin: 0 }}>{item.description}</p>
          </div>
        )}

        {/* Date lost/found */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 13, color: "#6B7A7A" }}>📅 Fecha {isLost ? "pérdida" : "hallazgo"}:</span>
          <span style={{ fontSize: 13, color: "#162323", fontWeight: 700 }}>{item.dateLostFound}</span>
        </div>

        {/* Reward warning */}
        {item.reward && (
          <WarnBox>
            <strong>Recompensa ofrecida.</strong> Nunca envíes dinero antes de ver tu mascota u objeto en persona. Si alguien te pide una transferencia primero, es una estafa.
          </WarnBox>
        )}

        {/* Documents warning in detail */}
        {isPet === false && item.objectCat === "Documentos" && (
          <WarnBox>
            Por privacidad, las fotos de documentos solo deben mostrar el <strong>nombre</strong>, nunca el número del documento.
          </WarnBox>
        )}

        {/* Resolve button (author only) */}
        {isAuthor && item.status === "activo" && (
          <button onClick={onResolve} style={{
            width: "100%", padding: "14px", borderRadius: 14, marginBottom: 12,
            background: `linear-gradient(135deg, ${GREEN}, #15803D)`, color: "white",
            fontWeight: 700, fontSize: 15, border: "none", cursor: "pointer",
          }}>
            ¡Ya apareció! 🎉 Marcar como resuelto
          </button>
        )}

        {/* WhatsApp contact */}
        {item.showWhatsApp && (
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            width: "100%", padding: "14px", borderRadius: 14, marginBottom: 12,
            background: "#25D366", color: "white", fontWeight: 700, fontSize: 15,
            textDecoration: "none", boxSizing: "border-box",
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.523 5.851L.057 23.215a.5.5 0 00.624.633l5.532-1.451A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.895 0-3.668-.527-5.177-1.439l-.371-.22-3.818 1.001 1.022-3.727-.242-.385A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
            Contactar por WhatsApp
          </a>
        )}

        {/* Phone (always visible) */}
        <a href={`tel:${item.phone}`} style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          width: "100%", padding: "13px", borderRadius: 14, marginBottom: 12,
          background: TEAL + "15", color: TEAL, fontWeight: 700, fontSize: 15,
          textDecoration: "none", border: `1.5px solid ${TEAL}40`, boxSizing: "border-box",
        }}>
          📞 Llamar: {item.phone}
        </a>

        {/* Share */}
        <a href={shareUrl} target="_blank" rel="noopener noreferrer" style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          width: "100%", padding: "13px", borderRadius: 14,
          background: "#F0EBE3", color: "#162323", fontWeight: 700, fontSize: 14,
          textDecoration: "none", boxSizing: "border-box",
        }}>
          📤 Compartir en WhatsApp
        </a>
      </div>
    </div>
  );
}

// ── Publish form ──────────────────────────────────────────────────────────────
function PublishForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [step, setStep] = useState(1);
  const [type, setType] = useState<LFType | "">("");
  const [category, setCategory] = useState<LFCategory | "">("");
  // Mascota
  const [petName, setPetName] = useState("");
  const [species, setSpecies] = useState<LFSpecies | "">("");
  const [breed, setBreed] = useState("");
  const [color, setColor] = useState("");
  const [size, setSize] = useState<LFSize | "">("");
  const [distinctive, setDistinctive] = useState("");
  const [hasCollar, setHasCollar] = useState(false);
  const [hasTag, setHasTag] = useState(false);
  const [reward, setReward] = useState(false);
  const [rewardNote, setRewardNote] = useState("");
  // Objeto
  const [objectCat, setObjectCat] = useState<LFObjectCat | "">("");
  const [description, setDescription] = useState("");
  // Shared
  const [dateLostFound, setDateLostFound] = useState(new Date().toISOString().slice(0, 10));
  const [sector, setSector] = useState("");
  // Fotos + contacto
  const [photos, setPhotos] = useState<string[]>([]);
  const [phone, setPhone] = useState("");
  const [showWhatsApp, setShowWhatsApp] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);

  function goNext() {
    const e: string[] = [];
    if (step === 1) {
      if (!type) e.push("Tipo (Perdido / Encontrado)");
      if (!category) e.push("Categoría (Mascota / Objeto)");
    }
    if (step === 2) {
      if (category === "Mascota" && !species) e.push("Especie");
      if (category === "Objeto" && !objectCat) e.push("Categoría del objeto");
      if (!description.trim() && category !== "Mascota") e.push("Descripción");
      if (!dateLostFound) e.push("Fecha");
      if (!sector) e.push("Sector");
    }
    if (step === 3) {
      if (!phone.trim()) e.push("Teléfono de contacto");
    }
    if (e.length > 0) { setErrors(e); return; }
    setErrors([]);
    if (step < 3) { setStep(step + 1); return; }
    // Save
    const item: LostFoundItem = {
      id: newId(),
      type: type as LFType,
      category: category as LFCategory,
      status: "activo",
      createdAt: new Date().toISOString(),
      authorId: store.getAuthorId(),
      sector,
      description,
      dateLostFound: new Date(dateLostFound).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" }),
      photos,
      phone,
      showWhatsApp,
      ...(category === "Mascota" ? {
        petName, species: species as LFSpecies,
        breed, color, size: size as LFSize,
        distinctive, hasCollar, hasTag, reward,
        rewardNote: reward ? rewardNote : undefined,
      } : {
        objectCat: objectCat as LFObjectCat,
      }),
    };
    store.setLostFound([item, ...store.getLostFound()]);
    onSaved();
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "white", display: "flex", flexDirection: "column", fontFamily: "'Outfit', sans-serif" }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${TEAL}, #062E2E)`, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "white", cursor: "pointer", padding: 4 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2.2" strokeLinecap="round" /></svg>
        </button>
        <div>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, margin: 0 }}>Nueva publicación</p>
          <p style={{ color: "white", fontSize: 16, fontWeight: 700, margin: 0, fontFamily: "'Fraunces', serif" }}>Perdidos y Encontrados</p>
        </div>
      </div>

      {/* Progress */}
      <div style={{ display: "flex", gap: 4, padding: "12px 20px 0", flexShrink: 0 }}>
        {[1, 2, 3].map((s) => <div key={s} style={{ flex: 1, height: 4, borderRadius: 100, background: s <= step ? TEAL : "#E2DAD0" }} />)}
      </div>
      <p style={{ fontSize: 12, color: "#6B7A7A", fontWeight: 700, padding: "6px 20px 0", flexShrink: 0, margin: 0 }}>
        Paso {step} de 3 — {step === 1 ? "¿Qué publicas?" : step === 2 ? "Detalles" : "Fotos y contacto"}
      </p>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 20px" }}>
        {errors.length > 0 && (
          <div style={{ background: "#FEE2E2", borderRadius: 12, padding: "10px 14px", marginBottom: 14 }}>
            {errors.map((e) => <p key={e} style={{ fontSize: 12, color: "#B91C1C", margin: "2px 0" }}>• {e}</p>)}
          </div>
        )}

        {step === 1 && (
          <div>
            <p style={{ fontWeight: 700, fontSize: 14, color: "#162323", marginBottom: 10 }}>¿Es Perdido o Encontrado?</p>
            <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
              {(["Perdido", "Encontrado"] as LFType[]).map((t) => (
                <button key={t} onClick={() => setType(t)} style={{
                  flex: 1, padding: "18px 10px", borderRadius: 14, cursor: "pointer", fontWeight: 700, fontSize: 15,
                  background: type === t ? (t === "Perdido" ? RED : GREEN) : "#F0EBE3",
                  color: type === t ? "white" : "#6B7A7A", border: "none",
                }}>
                  {t === "Perdido" ? "🔍 Perdido" : "✅ Encontrado"}
                </button>
              ))}
            </div>
            <p style={{ fontWeight: 700, fontSize: 14, color: "#162323", marginBottom: 10 }}>¿Mascota u Objeto?</p>
            <div style={{ display: "flex", gap: 10 }}>
              {(["Mascota", "Objeto"] as LFCategory[]).map((c) => (
                <button key={c} onClick={() => setCategory(c)} style={{
                  flex: 1, padding: "18px 10px", borderRadius: 14, cursor: "pointer", fontWeight: 700, fontSize: 15,
                  background: category === c ? TEAL : "#F0EBE3", color: category === c ? "white" : "#6B7A7A", border: "none",
                }}>
                  {c === "Mascota" ? "🐾 Mascota" : "📦 Objeto"}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && category === "Mascota" && (
          <div>
            <Field label="Nombre de la mascota" value={petName} onChange={setPetName} placeholder="Ej: Luna" required={false} />
            <Select label="Especie" value={species} onChange={(v) => setSpecies(v as LFSpecies)} options={SPECIES} />
            <Field label="Raza" value={breed} onChange={setBreed} placeholder="Ej: Labrador, mestizo…" required={false} />
            <Field label="Color / pelaje" value={color} onChange={setColor} placeholder="Ej: Café con blanco" required={false} />
            <Select label="Tamaño" value={size} onChange={(v) => setSize(v as LFSize)} options={SIZES} required={false} />
            <Textarea label="Señas particulares" value={distinctive} onChange={setDistinctive} placeholder="Cicatrices, manchas, comportamiento…" />
            <div style={{ display: "flex", gap: 14, marginBottom: 14 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#162323" }}>
                <input type="checkbox" checked={hasCollar} onChange={(e) => setHasCollar(e.target.checked)} style={{ width: 18, height: 18, accentColor: TEAL }} />
                Tenía collar
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#162323" }}>
                <input type="checkbox" checked={hasTag} onChange={(e) => setHasTag(e.target.checked)} style={{ width: 18, height: 18, accentColor: TEAL }} />
                Tenía placa
              </label>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#162323", marginBottom: 10 }}>
              <input type="checkbox" checked={reward} onChange={(e) => setReward(e.target.checked)} style={{ width: 18, height: 18, accentColor: TEAL }} />
              Ofrece recompensa
            </label>
            {reward && (
              <>
                <WarnBox>
                  <strong>Aviso importante:</strong> Nunca envíes dinero antes de ver tu mascota en persona. Si alguien te la pide, es una estafa.
                </WarnBox>
                <Field label="Nota sobre la recompensa (opcional)" value={rewardNote} onChange={setRewardNote} placeholder="Ej: Al recuperar a Luna sana y salva" required={false} />
              </>
            )}
            <Select label="Sector donde se perdió / encontró" value={sector} onChange={setSector} options={SECTORS} />
            <Field label="Fecha" value={dateLostFound} onChange={setDateLostFound} type="date" />
          </div>
        )}

        {step === 2 && category === "Objeto" && (
          <div>
            <Select label="Categoría del objeto" value={objectCat} onChange={(v) => setObjectCat(v as LFObjectCat)} options={OBJECT_CATS} />
            {objectCat === "Documentos" && (
              <WarnBox>
                Si subes foto del documento, <strong>cubre el número</strong> y muestra solo el nombre. Protegemos la privacidad de todos.
              </WarnBox>
            )}
            <Textarea label="Descripción" value={description} onChange={setDescription} placeholder="Describe el objeto con detalle para que el dueño lo identifique…" required />
            <Select label="Sector donde se perdió / encontró" value={sector} onChange={setSector} options={SECTORS} />
            <Field label="Fecha" value={dateLostFound} onChange={setDateLostFound} type="date" />
          </div>
        )}

        {step === 2 && category === "Mascota" && (
          <Textarea label="Descripción adicional" value={description} onChange={setDescription} placeholder="Cualquier dato extra que ayude a identificarla…" />
        )}

        {step === 3 && (
          <div>
            <p style={{ fontWeight: 700, fontSize: 14, color: "#162323", marginBottom: 10 }}>Fotos (máximo 4)</p>
            {category === "Objeto" && objectCat === "Documentos" && (
              <WarnBox>Recuerda: muestra solo el nombre en la foto del documento, nunca el número.</WarnBox>
            )}
            <div style={{ marginBottom: 20 }}>
              <PhotoUploader photos={photos} onChange={setPhotos} max={4} />
            </div>
            <Field label="Teléfono de contacto" value={phone} onChange={setPhone} type="tel" placeholder="Ej: 300 000 0000" />
            <p style={{ fontSize: 12, color: "#6B7A7A", margin: "-4px 0 12px", lineHeight: 1.5 }}>Este teléfono será visible para todos en la publicación, para que puedan contactarte.</p>
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#162323", marginBottom: 8 }}>
              <input type="checkbox" checked={showWhatsApp} onChange={(e) => setShowWhatsApp(e.target.checked)} style={{ width: 18, height: 18, accentColor: TEAL }} />
              Mostrar botón de WhatsApp en la publicación
            </label>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: "12px 20px 24px", flexShrink: 0, borderTop: "1px solid #E2DAD0" }}>
        <button onClick={goNext} style={{
          width: "100%", padding: "15px", borderRadius: 14,
          background: `linear-gradient(135deg, ${TEAL}, #0A4F4F)`,
          color: "white", fontWeight: 700, fontSize: 16, border: "none", cursor: "pointer",
        }}>
          {step < 3 ? "Siguiente →" : "✅ Publicar"}
        </button>
      </div>
    </div>
  );
}

// ── Resolved card (happy ending) ──────────────────────────────────────────────
function ResolvedCard({ item }: { item: LostFoundItem }) {
  const isPet = item.category === "Mascota";
  const title = isPet ? (item.petName || item.species || "Mascota") : (item.objectCat || "Objeto");
  return (
    <div style={{ background: "#DCFCE7", border: "1.5px solid #86EFAC", borderRadius: 14, padding: "12px 14px", display: "flex", gap: 12, alignItems: "center" }}>
      <div style={{ width: 56, height: 56, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: "#F0EBE3" }}>
        {item.photos[0]
          ? <img src={item.photos[0]} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>{isPet ? "🐾" : "📦"}</div>}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontFamily: "'Fraunces', serif", fontSize: 15, fontWeight: 800, color: "#166534", margin: "0 0 2px" }}>🎉 {title}</p>
        <p style={{ fontSize: 12, color: "#16A34A", margin: 0 }}>{item.sector} · {daysAgo(item.createdAt)}</p>
      </div>
    </div>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
type MainTab = "Perdidos" | "Encontrados" | "Finales felices";
type FilterCat = "Todos" | LFCategory;

export default function LostFoundScreen({ onBack }: { onBack: () => void }) {
  const [items, setItems] = useState<LostFoundItem[]>(() => store.getLostFound().filter((i) => i.status === "activo" || i.status === "resuelto"));
  const [tab, setTab] = useState<MainTab>("Perdidos");
  const [filter, setFilter] = useState<FilterCat>("Todos");
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<LostFoundItem | null>(null);
  const authorId = store.getAuthorId();

  function refresh() {
    setItems(store.getLostFound().filter((i) => i.status === "activo" || i.status === "resuelto"));
  }

  function handleResolve() {
    if (!selected) return;
    const all = store.getLostFound().map((i) =>
      i.id === selected.id ? { ...i, status: "resuelto" as const, resolvedAt: new Date().toISOString() } : i
    );
    store.setLostFound(all);
    refresh();
    setSelected(null);
  }

  const active = items.filter((i) => i.status === "activo");
  const resolved = items.filter((i) => i.status === "resuelto");

  const visibleActive = active.filter((i) => {
    const matchTab = tab === "Perdidos" ? i.type === "Perdido" : tab === "Encontrados" ? i.type === "Encontrado" : true;
    const matchFilter = filter === "Todos" || i.category === filter;
    return matchTab && matchFilter;
  });

  if (selected) {
    return (
      <DetailView
        item={selected}
        onBack={() => setSelected(null)}
        onResolve={handleResolve}
        isAuthor={selected.authorId === authorId}
      />
    );
  }

  if (showForm) {
    return (
      <PublishForm
        onClose={() => setShowForm(false)}
        onSaved={() => { setShowForm(false); refresh(); }}
      />
    );
  }

  return (
    <div style={{ paddingBottom: 100, position: "relative" }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${TEAL}, #062E2E)`, padding: "20px 20px 16px" }}>
        <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "rgba(255,255,255,0.8)", fontSize: 14, fontWeight: 600, cursor: "pointer", padding: "0 0 12px" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M11 6l-6 6 6 6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Volver
        </button>
        <h1 style={{ fontFamily: "'Fraunces', serif", color: "white", fontSize: 26, fontWeight: 800, margin: "0 0 4px" }}>Perdidos y Encontrados</h1>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, margin: 0 }}>Mascotas y objetos · Barrio Las Gaviotas</p>
      </div>

      {/* Tabs */}
      <div style={{ background: "white", borderBottom: "1px solid #E2DAD0", padding: "0 16px", display: "flex", gap: 0 }}>
        {(["Perdidos", "Encontrados", "Finales felices"] as MainTab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: "13px 4px", border: "none", background: "none", cursor: "pointer",
            fontSize: 12, fontWeight: 700, color: tab === t ? TEAL : "#6B7A7A",
            borderBottom: tab === t ? `2.5px solid ${TEAL}` : "2.5px solid transparent",
          }}>{t}</button>
        ))}
      </div>

      <div style={{ padding: "14px 16px" }}>
        {tab !== "Finales felices" && (
          <>
            {/* Filters */}
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              {(["Todos", "Mascota", "Objeto"] as FilterCat[]).map((f) => (
                <Chip key={f} label={f === "Todos" ? "Todos" : f === "Mascota" ? "🐾 Mascota" : "📦 Objeto"} active={filter === f} onClick={() => setFilter(f)} />
              ))}
            </div>

            {visibleActive.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <p style={{ fontSize: 48, marginBottom: 12 }}>{tab === "Perdidos" ? "🔍" : "✅"}</p>
                <p style={{ fontSize: 15, color: "#6B7A7A" }}>No hay publicaciones de {tab.toLowerCase()} actualmente.</p>
                <p style={{ fontSize: 13, color: "#6B7A7A", marginTop: 4 }}>¡Sé el primero en publicar!</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {visibleActive.map((item) => (
                  <ItemCard key={item.id} item={item} onClick={() => setSelected(item)} />
                ))}
              </div>
            )}
          </>
        )}

        {tab === "Finales felices" && (
          <div>
            {resolved.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <p style={{ fontSize: 48, marginBottom: 12 }}>🎉</p>
                <p style={{ fontSize: 15, color: "#6B7A7A" }}>Aún no hay casos resueltos. ¡Pronto habrá buenas noticias!</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <p style={{ fontSize: 13, color: "#6B7A7A", marginBottom: 4, fontWeight: 600 }}>🎉 {resolved.length} {resolved.length === 1 ? "final feliz" : "finales felices"} en el barrio</p>
                {resolved.map((item) => (
                  <button key={item.id} onClick={() => setSelected(item)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}>
                    <ResolvedCard item={item} />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* FAB */}
      {tab !== "Finales felices" && (
        <button onClick={() => setShowForm(true)} style={{
          position: "fixed", bottom: 88, right: 20,
          width: 56, height: 56, borderRadius: "50%",
          background: `linear-gradient(135deg, ${CORAL}, #C0522C)`,
          color: "white", fontSize: 24, fontWeight: 900, border: "none", cursor: "pointer",
          boxShadow: "0 6px 24px rgba(232,100,58,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50,
        }}>
          +
        </button>
      )}
    </div>
  );
}
