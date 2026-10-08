import { useState, useEffect } from "react";
import { store, OfficioWorker, OfficioReview, OfficioStatus, OfficioCategory } from "./store";

const TEAL = "#0D6E6E";
const RED = "#DC2626";
const GREEN = "#16A34A";
const ORANGE = "#D97706";

const ALL_CATEGORIES: { cat: OfficioCategory; icon: string }[] = [
  { cat: "Plomería", icon: "🔧" }, { cat: "Electricidad", icon: "⚡" }, { cat: "Albañilería", icon: "🧱" },
  { cat: "Pintura", icon: "🎨" }, { cat: "Carpintería", icon: "🪚" }, { cat: "Soldadura", icon: "🔩" },
  { cat: "Aires y neveras", icon: "❄️" }, { cat: "Mecánica", icon: "🚗" }, { cat: "Modistería", icon: "🧵" },
  { cat: "Belleza a domicilio", icon: "💇" }, { cat: "Refuerzo escolar", icon: "📚" },
  { cat: "Cuidado adultos mayores", icon: "🧓" }, { cat: "Lavandería", icon: "👕" },
  { cat: "Cocina y eventos", icon: "🍽️" }, { cat: "Otros", icon: "🛠️" },
];

const STATUS_META: Record<OfficioStatus, { color: string; bg: string; label: string }> = {
  pendiente: { color: ORANGE,    bg: "#FEF3C7", label: "Pendiente" },
  aprobado:  { color: GREEN,     bg: "#DCFCE7", label: "Aprobado" },
  pausado:   { color: "#6B7A7A", bg: "#F0EBE3", label: "Pausado" },
  rechazado: { color: RED,       bg: "#FEE2E2", label: "Rechazado" },
};

function catIcon(cat: OfficioCategory) {
  return ALL_CATEGORIES.find((c) => c.cat === cat)?.icon ?? "🛠️";
}

function Avatar({ worker, size = 44 }: { worker: OfficioWorker; size?: number }) {
  if (worker.photo) return <img src={worker.photo} alt={worker.fullName} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />;
  const hue = parseInt(worker.id.replace(/\D/g, "") || "3") * 47;
  const initials = worker.fullName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: `hsl(${hue % 360},45%,30%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.35, fontWeight: 700, color: "white", flexShrink: 0 }}>
      {initials}
    </div>
  );
}

export default function OfficiosAdmin() {
  const [workers, setWorkers] = useState<OfficioWorker[]>([]);
  const [reviews, setReviews] = useState<OfficioReview[]>([]);
  const [bandeja, setBandeja] = useState<OfficioStatus | "Todos">("pendiente");
  const [selected, setSelected] = useState<OfficioWorker | null>(null);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [hiddenReviews, setHiddenReviews] = useState<Set<string>>(new Set());

  useEffect(() => {
    setWorkers(store.getWorkers().slice().reverse());
    setReviews(store.getReviews());
  }, []);

  function refresh() {
    const fresh = store.getWorkers().slice().reverse();
    setWorkers(fresh);
    if (selected) setSelected(fresh.find((w) => w.id === selected.id) ?? null);
  }

  function updateStatus(status: OfficioStatus, reason?: string) {
    if (!selected) return;
    const all = store.getWorkers().map((w) =>
      w.id === selected.id ? { ...w, status, ...(reason ? { rejectionReason: reason } : {}) } : w
    );
    store.setWorkers(all);
    refresh();
    setShowRejectInput(false);
    setRejectReason("");
  }

  function toggleVerified() {
    if (!selected) return;
    const all = store.getWorkers().map((w) =>
      w.id === selected.id ? { ...w, verified: !w.verified } : w
    );
    store.setWorkers(all);
    refresh();
  }

  function hideReview(id: string) {
    setHiddenReviews((prev) => { const next = new Set(prev); next.add(id); return next; });
  }

  const filtered = workers.filter((w) => bandeja === "Todos" || w.status === bandeja);
  const pendingCount = workers.filter((w) => w.status === "pendiente").length;
  const workerReviews = selected ? reviews.filter((r) => r.workerId === selected.id && !hiddenReviews.has(r.id)) : [];

  if (selected) {
    const meta = STATUS_META[selected.status];
    return (
      <div>
        <button onClick={() => { setSelected(null); setPhotoIdx(0); setShowRejectInput(false); }}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: TEAL, fontSize: 14, fontWeight: 600, cursor: "pointer", padding: "0 0 14px" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M11 6l-6 6 6 6" stroke={TEAL} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Lista
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <Avatar worker={selected} size={56} />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
              <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 800, color: "#162323", margin: 0 }}>{selected.fullName}</h3>
              {selected.verified && <span style={{ fontSize: 10, fontWeight: 700, color: TEAL, background: TEAL + "18", padding: "2px 8px", borderRadius: 100 }}>✓ Verificado JAC</span>}
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: meta.color, background: meta.bg, padding: "3px 10px", borderRadius: 100 }}>{meta.label}</span>
          </div>
        </div>

        {/* Info */}
        <div style={{ background: "white", borderRadius: 14, padding: "14px 16px", border: "1px solid #E2DAD0", marginBottom: 12 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#6B7A7A", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px" }}>Datos del solicitante</p>
          {[
            ["Cédula (privado)", selected.cedula],
            ["Teléfono", selected.phone],
            ["WhatsApp", selected.whatsapp],
            ["Sector", selected.sector],
            ["Oficios", selected.categories.map((c) => `${catIcon(c)} ${c}`).join(", ")],
            ["Experiencia", `${selected.yearsExp} años`],
            ["Horario", selected.schedule],
            ["Urgencias", selected.urgency ? "Sí" : "No"],
            ["Descripción", selected.description || "—"],
            ["Registrado", new Date(selected.createdAt).toLocaleDateString("es-CO")],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", gap: 10, padding: "6px 0", borderBottom: "1px solid #F0EBE3" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#6B7A7A", minWidth: 110 }}>{k}</span>
              <span style={{ fontSize: 13, color: "#162323", fontWeight: 600, flex: 1, wordBreak: "break-word" }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Work photos */}
        {selected.workPhotos.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#6B7A7A", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px" }}>Fotos de trabajos</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
              {selected.workPhotos.map((p, i) => (
                <img key={i} src={p} alt="Trabajo" style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 10 }} />
              ))}
            </div>
          </div>
        )}

        {/* Rejection reason if any */}
        {selected.status === "rechazado" && selected.rejectionReason && (
          <div style={{ background: "#FEE2E2", border: "1px solid #FECACA", borderRadius: 12, padding: "10px 14px", marginBottom: 12, fontSize: 13, color: RED }}>
            <strong>Motivo de rechazo:</strong> {selected.rejectionReason}
          </div>
        )}

        {/* Actions */}
        <div style={{ background: "white", borderRadius: 14, padding: "14px 16px", border: "1px solid #E2DAD0", marginBottom: 12 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#6B7A7A", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 10px" }}>Acciones</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {selected.status !== "aprobado" && (
              <button onClick={() => updateStatus("aprobado")}
                style={{ padding: "11px", borderRadius: 11, background: "#DCFCE7", color: GREEN, fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}>
                ✅ Aprobar solicitud
              </button>
            )}
            <button onClick={toggleVerified}
              style={{ padding: "11px", borderRadius: 11, background: selected.verified ? "#FEF3C7" : TEAL + "18", color: selected.verified ? ORANGE : TEAL, fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}>
              {selected.verified ? "🔓 Quitar sello verificado" : "✓ Otorgar sello Vecino Verificado JAC"}
            </button>
            {selected.status !== "pausado" && (
              <button onClick={() => updateStatus("pausado")}
                style={{ padding: "11px", borderRadius: 11, background: "#F0EBE3", color: "#6B7A7A", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}>
                ⏸️ Pausar perfil
              </button>
            )}
            {selected.status !== "rechazado" && (
              showRejectInput ? (
                <div>
                  <textarea rows={2} placeholder="Motivo del rechazo (obligatorio)" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #FECACA", fontSize: 13, fontFamily: "'Outfit', sans-serif", resize: "vertical", marginBottom: 8, boxSizing: "border-box" }} />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setShowRejectInput(false)} style={{ flex: 1, padding: "9px", borderRadius: 10, border: "1px solid #E2DAD0", background: "white", color: "#6B7A7A", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Cancelar</button>
                    <button disabled={!rejectReason.trim()} onClick={() => updateStatus("rechazado", rejectReason.trim())}
                      style={{ flex: 1, padding: "9px", borderRadius: 10, background: rejectReason.trim() ? "#FEE2E2" : "#F5F5F5", color: rejectReason.trim() ? RED : "#9CA3AF", fontWeight: 700, fontSize: 13, border: "none", cursor: rejectReason.trim() ? "pointer" : "not-allowed" }}>
                      Rechazar
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowRejectInput(true)}
                  style={{ padding: "11px", borderRadius: 11, background: "#FEE2E2", color: RED, fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}>
                  ❌ Rechazar con motivo
                </button>
              )
            )}
          </div>
        </div>

        {/* Reviews */}
        {workerReviews.length > 0 && (
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#6B7A7A", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px" }}>Reseñas ({workerReviews.length})</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {workerReviews.map((r) => (
                <div key={r.id} style={{ background: "white", borderRadius: 12, padding: "12px 14px", border: "1px solid #E2DAD0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#162323" }}>{r.authorName}</span>
                      <span style={{ fontSize: 11, color: "#6B7A7A", marginLeft: 8 }}>{r.date}</span>
                      <div style={{ display: "flex", gap: 1, marginTop: 3 }}>
                        {[1,2,3,4,5].map((s) => <span key={s} style={{ fontSize: 12, color: s <= r.stars ? "#E8643A" : "#E2DAD0" }}>★</span>)}
                      </div>
                    </div>
                    <button onClick={() => hideReview(r.id)} style={{ fontSize: 11, fontWeight: 700, color: RED, background: "#FEE2E2", padding: "4px 8px", borderRadius: 100, border: "none", cursor: "pointer", flexShrink: 0 }}>
                      Ocultar
                    </button>
                  </div>
                  <p style={{ fontSize: 13, color: "#162323", margin: 0, lineHeight: 1.5 }}>{r.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 700, color: "#162323", margin: "0 0 12px" }}>
        Oficios del Barrio
      </h3>

      {pendingCount > 0 && (
        <div style={{ background: "#FEF3C7", border: "1px solid #D97706", borderRadius: 12, padding: "10px 14px", marginBottom: 14, display: "flex", gap: 8, alignItems: "center" }}>
          <span>⏳</span>
          <p style={{ fontSize: 12, color: "#92400E", margin: 0 }}>
            <strong>{pendingCount} solicitud{pendingCount > 1 ? "es" : ""} pendiente{pendingCount > 1 ? "s" : ""}</strong> de aprobación.
          </p>
        </div>
      )}

      {/* Bandejas */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {(["pendiente", "aprobado", "pausado", "rechazado", "Todos"] as const).map((b) => {
          const meta = b !== "Todos" ? STATUS_META[b] : null;
          const count = b === "Todos" ? workers.length : workers.filter((w) => w.status === b).length;
          return (
            <button key={b} onClick={() => setBandeja(b)}
              style={{ padding: "6px 12px", borderRadius: 100, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700,
                background: bandeja === b ? (meta ? meta.bg : "#E2DAD0") : "#F0EBE3",
                color: bandeja === b ? (meta ? meta.color : "#162323") : "#6B7A7A" }}>
              {b === "Todos" ? `Todos (${count})` : `${STATUS_META[b as OfficioStatus].label} (${count})`}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "32px 20px" }}>
          <p style={{ fontSize: 36, margin: "0 0 12px" }}>🧰</p>
          <p style={{ fontSize: 14, color: "#6B7A7A" }}>No hay solicitudes en esta bandeja.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((w) => {
            const meta = STATUS_META[w.status];
            return (
              <button key={w.id} onClick={() => { setSelected(w); setPhotoIdx(0); }}
                style={{ background: "white", border: `1px solid ${w.status === "pendiente" ? ORANGE : "#E2DAD0"}`, borderRadius: 14, padding: "12px 14px", display: "flex", gap: 12, alignItems: "center", cursor: "pointer", textAlign: "left" }}>
                <Avatar worker={w} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: "#162323", fontFamily: "'Fraunces', serif" }}>{w.fullName}</span>
                    {w.verified && <span style={{ fontSize: 10, fontWeight: 700, color: TEAL }}>✓</span>}
                    <span style={{ fontSize: 11, fontWeight: 700, color: meta.color, background: meta.bg, padding: "1px 8px", borderRadius: 100 }}>{meta.label}</span>
                  </div>
                  <p style={{ fontSize: 12, color: "#6B7A7A", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {w.categories.slice(0, 2).map((c) => `${catIcon(c)} ${c}`).join(" · ")} · {w.sector}
                  </p>
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
