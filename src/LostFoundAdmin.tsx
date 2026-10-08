import { useState, useEffect } from "react";
import { store, LostFoundItem, LFStatus, LFType, LFCategory } from "./store";

const TEAL = "#0D6E6E";
const RED = "#DC2626";
const GREEN = "#16A34A";
const ORANGE = "#D97706";

const STATUS_META: Record<LFStatus, { color: string; bg: string; label: string }> = {
  activo:    { color: TEAL,   bg: TEAL + "18",   label: "Activo" },
  resuelto:  { color: GREEN,  bg: "#DCFCE7",      label: "Resuelto" },
  archivado: { color: "#6B7A7A", bg: "#F0EBE3",   label: "Archivado" },
  oculto:    { color: RED,    bg: "#FEE2E2",      label: "Oculto" },
};

function daysAgo(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

export default function LostFoundAdmin() {
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [filterType, setFilterType] = useState<LFType | "Todos">("Todos");
  const [filterCat, setFilterCat] = useState<LFCategory | "Todos">("Todos");
  const [filterStatus, setFilterStatus] = useState<LFStatus | "Todos">("Todos");
  const [selected, setSelected] = useState<LostFoundItem | null>(null);
  const [photoIdx, setPhotoIdx] = useState(0);

  useEffect(() => {
    setItems(store.getLostFound().slice().reverse());
  }, []);

  function refresh() {
    const fresh = store.getLostFound().slice().reverse();
    setItems(fresh);
    if (selected) setSelected(fresh.find((i) => i.id === selected.id) ?? null);
  }

  function updateStatus(status: LFStatus) {
    if (!selected) return;
    const all = store.getLostFound().map((i) =>
      i.id === selected.id ? { ...i, status } : i
    );
    store.setLostFound(all);
    refresh();
  }

  const old30 = items.filter((i) => i.status === "activo" && daysAgo(i.createdAt) >= 30);

  const filtered = items.filter((i) => {
    if (filterType !== "Todos" && i.type !== filterType) return false;
    if (filterCat !== "Todos" && i.category !== filterCat) return false;
    if (filterStatus !== "Todos" && i.status !== filterStatus) return false;
    return true;
  });

  if (selected) {
    const meta = STATUS_META[selected.status];
    const days = daysAgo(selected.createdAt);
    const isPet = selected.category === "Mascota";
    const title = isPet ? (selected.petName || selected.species || "Mascota") : (selected.objectCat || "Objeto");

    return (
      <div>
        <button onClick={() => { setSelected(null); setPhotoIdx(0); }}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: TEAL, fontSize: 14, fontWeight: 600, cursor: "pointer", padding: "0 0 14px" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M11 6l-6 6 6 6" stroke={TEAL} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Lista
        </button>

        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: selected.type === "Perdido" ? RED : GREEN, background: selected.type === "Perdido" ? "#FEE2E2" : "#DCFCE7", padding: "4px 12px", borderRadius: 100 }}>
            {selected.type === "Perdido" ? "🔍 Perdido" : "✅ Encontrado"}
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: TEAL, background: TEAL + "18", padding: "4px 12px", borderRadius: 100 }}>
            {isPet ? "🐾 Mascota" : "📦 Objeto"}
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: meta.color, background: meta.bg, padding: "4px 12px", borderRadius: 100 }}>
            {meta.label}
          </span>
          {days >= 30 && selected.status === "activo" && (
            <span style={{ fontSize: 12, fontWeight: 700, color: ORANGE, background: "#FEF3C7", padding: "4px 12px", borderRadius: 100 }}>
              ⏰ +30 días
            </span>
          )}
        </div>

        <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 800, color: "#162323", margin: "0 0 12px" }}>{title}</h3>

        {/* Photos */}
        {selected.photos.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <img src={selected.photos[photoIdx]} alt={title} style={{ width: "100%", height: 180, objectFit: "cover", borderRadius: 12, display: "block" }} />
            {selected.photos.length > 1 && (
              <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                {selected.photos.map((p, i) => (
                  <button key={i} onClick={() => setPhotoIdx(i)} style={{ width: 48, height: 48, borderRadius: 8, overflow: "hidden", border: i === photoIdx ? `2px solid ${TEAL}` : "2px solid transparent", padding: 0, cursor: "pointer" }}>
                    <img src={p} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Info rows */}
        {([
          ["Sector", selected.sector],
          ["Fecha", selected.dateLostFound],
          ["Teléfono", selected.phone],
          isPet && selected.species ? ["Especie", selected.species] : null,
          isPet && selected.breed ? ["Raza", selected.breed] : null,
          isPet && selected.color ? ["Color", selected.color] : null,
          isPet && selected.size ? ["Tamaño", selected.size] : null,
          selected.description ? ["Descripción / señas", selected.description] : null,
          isPet && selected.reward ? ["Recompensa", selected.rewardNote || "Sí"] : null,
          [`Publicado`, `hace ${days} día${days !== 1 ? "s" : ""}`],
        ] as ([string, string] | null)[]).filter((x): x is [string, string] => x !== null).map(([k, v]) => (
          <div key={k as string} style={{ display: "flex", gap: 10, padding: "7px 0", borderBottom: "1px solid #F0EBE3" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#6B7A7A", minWidth: 110 }}>{k as string}</span>
            <span style={{ fontSize: 13, color: "#162323", fontWeight: 600, flex: 1 }}>{v as string}</span>
          </div>
        ))}

        {/* Archive warning */}
        {days >= 30 && selected.status === "activo" && (
          <div style={{ background: "#FEF3C7", border: "1px solid #D97706", borderRadius: 12, padding: "10px 14px", margin: "14px 0", fontSize: 12, color: "#92400E" }}>
            ⏰ Esta publicación lleva más de 30 días activa. Se archivará automáticamente si el autor no la renueva.
          </div>
        )}

        {/* Actions */}
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#6B7A7A", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px" }}>Acciones</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={() => updateStatus("activo")} disabled={selected.status === "activo"}
              style={{ flex: 1, minWidth: 100, padding: "10px 8px", borderRadius: 12, border: "none", cursor: selected.status === "activo" ? "not-allowed" : "pointer", background: selected.status === "activo" ? "#F0EBE3" : TEAL + "18", color: TEAL, fontWeight: 700, fontSize: 13 }}>
              ✅ Activar
            </button>
            <button onClick={() => updateStatus("oculto")} disabled={selected.status === "oculto"}
              style={{ flex: 1, minWidth: 100, padding: "10px 8px", borderRadius: 12, border: "none", cursor: selected.status === "oculto" ? "not-allowed" : "pointer", background: selected.status === "oculto" ? "#F0EBE3" : "#FEE2E2", color: RED, fontWeight: 700, fontSize: 13 }}>
              🚫 Ocultar
            </button>
            <button onClick={() => updateStatus("archivado")} disabled={selected.status === "archivado"}
              style={{ flex: 1, minWidth: 100, padding: "10px 8px", borderRadius: 12, border: "none", cursor: selected.status === "archivado" ? "not-allowed" : "pointer", background: selected.status === "archivado" ? "#F0EBE3" : "#F5F5F5", color: "#6B7A7A", fontWeight: 700, fontSize: 13 }}>
              📁 Archivar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 700, color: "#162323", margin: "0 0 12px" }}>
        Perdidos y Encontrados
      </h3>

      {/* 30-day alert */}
      {old30.length > 0 && (
        <div style={{ background: "#FEF3C7", border: "1px solid #D97706", borderRadius: 12, padding: "10px 14px", marginBottom: 14, display: "flex", gap: 8 }}>
          <span>⏰</span>
          <p style={{ fontSize: 12, color: "#92400E", margin: 0 }}>
            <strong>{old30.length} publicación{old30.length > 1 ? "es" : ""}</strong> llevan más de 30 días activas. Considera archivarlas si no hay respuesta.
          </p>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {(["Todos", "Perdido", "Encontrado"] as const).map((t) => (
          <button key={t} onClick={() => setFilterType(t as any)}
            style={{ padding: "6px 12px", borderRadius: 100, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700,
              background: filterType === t ? (t === "Perdido" ? RED : t === "Encontrado" ? GREEN : TEAL) : "#F0EBE3",
              color: filterType === t ? "white" : "#6B7A7A" }}>
            {t}
          </button>
        ))}
        <span style={{ alignSelf: "center", color: "#E2DAD0" }}>|</span>
        {(["Todos", "Mascota", "Objeto"] as const).map((c) => (
          <button key={c} onClick={() => setFilterCat(c as any)}
            style={{ padding: "6px 12px", borderRadius: 100, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700,
              background: filterCat === c ? TEAL + "22" : "#F0EBE3", color: filterCat === c ? TEAL : "#6B7A7A" }}>
            {c === "Mascota" ? "🐾 " : c === "Objeto" ? "📦 " : ""}{c}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        {(["Todos", "activo", "resuelto", "archivado", "oculto"] as const).map((s) => {
          const meta = s !== "Todos" ? STATUS_META[s] : null;
          return (
            <button key={s} onClick={() => setFilterStatus(s as any)}
              style={{ padding: "5px 11px", borderRadius: 100, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 700,
                background: filterStatus === s ? (meta ? meta.bg : "#E2DAD0") : "#F0EBE3",
                color: filterStatus === s ? (meta ? meta.color : "#162323") : "#6B7A7A" }}>
              {s === "Todos" ? `Todos (${items.length})` : meta!.label}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "32px 20px" }}>
          <p style={{ fontSize: 36, margin: "0 0 12px" }}>📭</p>
          <p style={{ fontSize: 14, color: "#6B7A7A" }}>No hay publicaciones con estos filtros.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((item) => {
            const isPet = item.category === "Mascota";
            const title = isPet ? (item.petName || item.species || "Mascota") : (item.objectCat || "Objeto");
            const days = daysAgo(item.createdAt);
            const meta = STATUS_META[item.status];
            return (
              <button key={item.id} onClick={() => { setSelected(item); setPhotoIdx(0); }}
                style={{ background: "white", border: `1px solid ${days >= 30 && item.status === "activo" ? ORANGE : "#E2DAD0"}`, borderRadius: 14, padding: "12px 14px", display: "flex", gap: 12, alignItems: "center", cursor: "pointer", textAlign: "left" }}>
                <div style={{ width: 52, height: 52, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: "#F0EBE3" }}>
                  {item.photos[0]
                    ? <img src={item.photos[0]} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>{isPet ? "🐾" : "📦"}</div>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 6, marginBottom: 3, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: item.type === "Perdido" ? RED : GREEN }}>
                      {item.type === "Perdido" ? "🔍 Perdido" : "✅ Encontrado"}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: meta.color, background: meta.bg, padding: "1px 7px", borderRadius: 100 }}>{meta.label}</span>
                    {days >= 30 && item.status === "activo" && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: ORANGE }}>⏰ +30 días</span>
                    )}
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 800, color: "#162323", margin: "0 0 1px", fontFamily: "'Fraunces', serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</p>
                  <p style={{ fontSize: 12, color: "#6B7A7A", margin: 0 }}>{item.sector} · hace {days} día{days !== 1 ? "s" : ""}</p>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="#6B7A7A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
