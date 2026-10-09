import { useState, useRef } from "react";
import { store, OfficioWorker, OfficioCategory, OfficioReview } from "./store";

const TEAL = "#0D6E6E";
const CORAL = "#E8643A";
const GREEN = "#16A34A";

const ALL_CATEGORIES: { cat: OfficioCategory; icon: string }[] = [
  { cat: "Plomería",               icon: "🔧" },
  { cat: "Electricidad",           icon: "⚡" },
  { cat: "Albañilería",            icon: "🧱" },
  { cat: "Pintura",                icon: "🎨" },
  { cat: "Carpintería",            icon: "🪚" },
  { cat: "Soldadura",              icon: "🔩" },
  { cat: "Aires y neveras",        icon: "❄️" },
  { cat: "Mecánica",               icon: "🚗" },
  { cat: "Modistería",             icon: "🧵" },
  { cat: "Belleza a domicilio",    icon: "💇" },
  { cat: "Refuerzo escolar",       icon: "📚" },
  { cat: "Cuidado adultos mayores",icon: "🧓" },
  { cat: "Lavandería",             icon: "👕" },
  { cat: "Cocina y eventos",       icon: "🍽️" },
  { cat: "Otros",                  icon: "🛠️" },
];

const SECTORS = ["Sector Norte", "Sector Central", "Sector Sur", "Sector Oriente", "Otro"];

function StarRow({ rating, count, small }: { rating: number; count?: number; small?: boolean }) {
  const size = small ? 13 : 16;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
      {[1,2,3,4,5].map((s) => (
        <svg key={s} width={size} height={size} viewBox="0 0 24 24" fill={s <= Math.round(rating) ? CORAL : "none"} stroke={CORAL} strokeWidth="1.8">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
      {count !== undefined && <span style={{ fontSize: small ? 11 : 12, color: "#6B7A7A", marginLeft: 3 }}>({count})</span>}
    </div>
  );
}

function avgRating(reviews: OfficioReview[], workerId: string) {
  const r = reviews.filter((x) => x.workerId === workerId);
  if (!r.length) return 0;
  return r.reduce((a, b) => a + b.stars, 0) / r.length;
}

function avatarInitials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

function Avatar({ worker, size = 52 }: { worker: OfficioWorker; size?: number }) {
  if (worker.photo) {
    return <img src={worker.photo} alt={worker.fullName} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />;
  }
  const hue = parseInt(worker.id.replace(/\D/g, "") || "3") * 47;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: `hsl(${hue % 360},45%,30%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.35, fontWeight: 700, color: "white", flexShrink: 0 }}>
      {avatarInitials(worker.fullName)}
    </div>
  );
}

// ── Worker card ──────────────────────────────────────────────────────────────
function WorkerCard({ worker, reviews, onClick }: { worker: OfficioWorker; reviews: OfficioReview[]; onClick: () => void }) {
  const rating = avgRating(reviews, worker.id);
  const rCount = reviews.filter((r) => r.workerId === worker.id).length;
  const catIcon = ALL_CATEGORIES.find((c) => c.cat === worker.categories[0])?.icon ?? "🛠️";
  return (
    <button onClick={onClick} style={{ width: "100%", background: "white", border: "1px solid #E2DAD0", borderRadius: 16, padding: "14px", display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer", textAlign: "left" }}>
      <Avatar worker={worker} size={56} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 2 }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: "#162323", fontFamily: "'Fraunces', serif" }}>{worker.fullName}</span>
          {worker.verified && <span style={{ fontSize: 10, fontWeight: 700, color: TEAL, background: TEAL + "18", padding: "2px 7px", borderRadius: 100 }}>✓ Verificado JAC</span>}
        </div>
        <p style={{ fontSize: 12, color: "#6B7A7A", margin: "0 0 4px" }}>{catIcon} {worker.categories.slice(0, 2).join(" · ")} · {worker.sector}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <StarRow rating={rating} count={rCount} small />
          {worker.availableToday && (
            <span style={{ fontSize: 10, fontWeight: 700, color: GREEN, background: "#DCFCE7", padding: "2px 7px", borderRadius: 100 }}>● Disponible hoy</span>
          )}
          {worker.urgency && (
            <span style={{ fontSize: 10, fontWeight: 700, color: CORAL, background: CORAL + "18", padding: "2px 7px", borderRadius: 100 }}>Urgencias 24h</span>
          )}
        </div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); window.open(`https://wa.me/57${worker.whatsapp.replace(/\s/g, "")}`, "_blank"); }}
        style={{ width: 36, height: 36, borderRadius: 10, background: "#25D366", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /><path d="M11.99 2C6.476 2 2 6.477 2 12c0 1.99.574 3.842 1.566 5.413L2.17 21.746a.5.5 0 00.623.623l4.386-1.398A9.953 9.953 0 0011.99 22C17.523 22 22 17.523 22 12S17.523 2 11.99 2zm0 18a7.94 7.94 0 01-4.296-1.26l-.308-.184-3.19 1.016 1.033-3.1-.201-.318A7.944 7.944 0 014 12c0-4.411 3.579-7.99 7.99-7.99C16.41 4.01 20 7.589 20 12s-3.58 7.99-7.99 7.99z" /></svg>
      </button>
    </button>
  );
}

// ── Worker profile ────────────────────────────────────────────────────────────
function WorkerProfile({ worker, reviews, authorId, onBack, onAddReview, onToggleAvailable }: {
  worker: OfficioWorker; reviews: OfficioReview[]; authorId: string;
  onBack: () => void; onAddReview: (r: Omit<OfficioReview, "id" | "date">) => void;
  onToggleAvailable: () => void;
}) {
  const myReviews = reviews.filter((r) => r.workerId === worker.id);
  const rating = avgRating(reviews, worker.id);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewStars, setReviewStars] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewName, setReviewName] = useState("");
  const [reviewSent, setReviewSent] = useState(false);
  const isOwner = worker.authorId === authorId;

  function submitReview(e: React.FormEvent) {
    e.preventDefault();
    onAddReview({ authorName: reviewName || "Vecino/a", authorId, workerId: worker.id, stars: reviewStars, comment: reviewComment });
    setReviewSent(true);
    setShowReviewForm(false);
  }

  return (
    <div style={{ minHeight: "100%", background: "#FAF6F0" }}>
      {/* Header */}
      <div style={{ background: "white", padding: "20px 20px 0" }}>
        <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: TEAL, fontSize: 14, fontWeight: 600, cursor: "pointer", padding: "0 0 14px" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M11 6l-6 6 6 6" stroke={TEAL} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Lista
        </button>
        <div style={{ display: "flex", gap: 16, alignItems: "center", paddingBottom: 20 }}>
          <Avatar worker={worker} size={72} />
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
              <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 800, color: "#162323", margin: 0 }}>{worker.fullName}</h1>
              {worker.verified && <span style={{ fontSize: 10, fontWeight: 700, color: TEAL, background: TEAL + "18", padding: "2px 8px", borderRadius: 100 }}>✓ Verificado JAC</span>}
            </div>
            <p style={{ fontSize: 13, color: "#6B7A7A", margin: "0 0 6px" }}>{worker.categories.join(", ")}</p>
            <StarRow rating={rating} count={myReviews.length} />
          </div>
        </div>
      </div>

      <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Owner: availability toggle */}
        {isOwner && (
          <div style={{ background: "white", borderRadius: 14, padding: "14px 16px", border: "1px solid #E2DAD0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#162323", margin: 0 }}>Disponible hoy</p>
              <p style={{ fontSize: 12, color: "#6B7A7A", margin: 0 }}>Los vecinos verán tu disponibilidad</p>
            </div>
            <button onClick={onToggleAvailable} style={{ width: 48, height: 28, borderRadius: 100, background: worker.availableToday ? TEAL : "#E2DAD0", border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
              <div style={{ position: "absolute", top: 3, left: worker.availableToday ? 22 : 3, width: 22, height: 22, borderRadius: "50%", background: "white", transition: "left 0.2s", boxShadow: "0 2px 6px rgba(0,0,0,0.2)" }} />
            </button>
          </div>
        )}

        {/* Info grid */}
        <div style={{ background: "white", borderRadius: 14, padding: "14px 16px", border: "1px solid #E2DAD0" }}>
          {[
            ["📍 Sector", worker.sector],
            ["⏰ Horario", worker.schedule],
            ["💼 Experiencia", `${worker.yearsExp} año${worker.yearsExp !== 1 ? "s" : ""}`],
            worker.urgency ? ["🆘 Urgencias", "Atiende urgencias"] : null,
            ["👥 Contratado por", `${worker.hiredCount} vecino${worker.hiredCount !== 1 ? "s" : ""}`],
          ].filter((x): x is [string, string] => x !== null).map(([k, v]) => (
            <div key={k} style={{ display: "flex", gap: 10, padding: "7px 0", borderBottom: "1px solid #F0EBE3" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#6B7A7A", minWidth: 120 }}>{k}</span>
              <span style={{ fontSize: 13, color: "#162323", fontWeight: 600 }}>{v}</span>
            </div>
          ))}
          {worker.description && (
            <p style={{ fontSize: 13, color: "#162323", margin: "10px 0 0", lineHeight: 1.6 }}>{worker.description}</p>
          )}
        </div>

        {/* Availability + urgency badges */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {worker.availableToday && (
            <span style={{ fontSize: 12, fontWeight: 700, color: GREEN, background: "#DCFCE7", padding: "5px 12px", borderRadius: 100 }}>● Disponible hoy</span>
          )}
          {worker.urgency && (
            <span style={{ fontSize: 12, fontWeight: 700, color: CORAL, background: CORAL + "18", padding: "5px 12px", borderRadius: 100 }}>🆘 Atiende urgencias</span>
          )}
        </div>

        {/* Work photos gallery */}
        {worker.workPhotos.length > 0 && (
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#6B7A7A", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px" }}>Mis trabajos</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
              {worker.workPhotos.map((p, i) => (
                <img key={i} src={p} alt="Trabajo" style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 10 }} />
              ))}
            </div>
          </div>
        )}

        {/* Contact buttons */}
        {!isOwner && (
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => window.open(`https://wa.me/57${worker.whatsapp.replace(/\s/g, "")}`, "_blank")}
              style={{ flex: 1, padding: 13, borderRadius: 12, background: "#25D366", color: "white", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer" }}>
              💬 WhatsApp
            </button>
            <button onClick={() => window.open(`tel:${worker.phone}`, "_blank")}
              style={{ flex: 1, padding: 13, borderRadius: 12, background: TEAL + "18", color: TEAL, fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer" }}>
              📞 Llamar
            </button>
          </div>
        )}

        {isOwner && (
          <p style={{ fontSize: 12, color: "#6B7A7A", textAlign: "center", margin: 0 }}>Este es tu perfil. Los vecinos pueden contactarte por WhatsApp y llamada.</p>
        )}

        {/* Reviews */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#6B7A7A", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>Reseñas</p>
            {!isOwner && !reviewSent && (
              <button onClick={() => {
                if (!store.currentUser()) { alert("Para calificar un servicio debes iniciar sesión o crear una cuenta (Más → Cerrar sesión → Iniciar sesión)."); return; }
                setShowReviewForm(true);
              }} style={{ fontSize: 12, fontWeight: 700, color: TEAL, background: TEAL + "15", padding: "5px 12px", borderRadius: 100, border: "none", cursor: "pointer" }}>
                ⭐ Calificar
              </button>
            )}
          </div>

          {showReviewForm && (
            <form onSubmit={submitReview} style={{ background: "white", borderRadius: 14, padding: "14px 16px", border: "1px solid #E2DAD0", marginBottom: 10 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#162323", margin: "0 0 10px" }}>Tu calificación</p>
              <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                {[1,2,3,4,5].map((s) => (
                  <button key={s} type="button" onClick={() => setReviewStars(s)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill={s <= reviewStars ? CORAL : "none"} stroke={CORAL} strokeWidth="1.8"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                  </button>
                ))}
              </div>
              <input placeholder="Tu nombre (opcional)" value={reviewName} onChange={(e) => setReviewName(e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #E2DAD0", fontSize: 13, fontFamily: "'Outfit', sans-serif", marginBottom: 8, boxSizing: "border-box" }} />
              <textarea rows={3} required placeholder="Cuéntanos tu experiencia..." value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #E2DAD0", fontSize: 13, fontFamily: "'Outfit', sans-serif", resize: "vertical", marginBottom: 10, boxSizing: "border-box" }} />
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" onClick={() => setShowReviewForm(false)} style={{ flex: 1, padding: 10, borderRadius: 10, border: "1px solid #E2DAD0", background: "white", color: "#6B7A7A", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Cancelar</button>
                <button type="submit" style={{ flex: 1, padding: 10, borderRadius: 10, background: TEAL, color: "white", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}>Publicar</button>
              </div>
            </form>
          )}

          {reviewSent && (
            <div style={{ background: "#DCFCE7", borderRadius: 12, padding: "10px 14px", marginBottom: 10, fontSize: 13, color: "#166534", fontWeight: 600 }}>
              ✅ ¡Gracias por tu reseña!
            </div>
          )}

          {myReviews.length === 0 && !showReviewForm && (
            <p style={{ fontSize: 13, color: "#6B7A7A", textAlign: "center", padding: "14px 0" }}>Sé el primero en calificar este servicio.</p>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {myReviews.map((r) => (
              <div key={r.id} style={{ background: "white", borderRadius: 12, padding: "12px 14px", border: "1px solid #E2DAD0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#162323" }}>{r.authorName}</span>
                  <span style={{ fontSize: 11, color: "#6B7A7A" }}>{r.date}</span>
                </div>
                <StarRow rating={r.stars} small />
                <p style={{ fontSize: 13, color: "#162323", margin: "6px 0 0", lineHeight: 1.5 }}>{r.comment}</p>
              </div>
            ))}
          </div>
        </div>

        <p style={{ fontSize: 11, color: "#6B7A7A", textAlign: "center", lineHeight: 1.6, margin: 0 }}>
          ⚠️ La JAC no garantiza los trabajos realizados. Acuerda precio y condiciones antes de iniciar.
        </p>
      </div>
    </div>
  );
}

// ── Registration form ─────────────────────────────────────────────────────────
function RegistrationForm({ authorId, onBack, onSubmit }: { authorId: string; onBack: () => void; onSubmit: () => void }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    fullName: "", cedula: "", phone: "", whatsapp: "", sector: SECTORS[0], isAdult: false,
    categories: [] as OfficioCategory[], yearsExp: 1, schedule: "", urgency: false, description: "",
    photo: "" as string, workPhotos: [] as string[], authorizeData: false,
  });
  const photoRef = useRef<HTMLInputElement>(null);
  const workRef = useRef<HTMLInputElement>(null);

  function resizeImage(file: File, maxPx: number): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxPx || height > maxPx) {
            if (width > height) { height = Math.round((height * maxPx) / width); width = maxPx; }
            else { width = Math.round((width * maxPx) / height); height = maxPx; }
          }
          const c = document.createElement("canvas");
          c.width = width; c.height = height;
          c.getContext("2d")!.drawImage(img, 0, 0, width, height);
          resolve(c.toDataURL("image/jpeg", 0.82));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  }

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await resizeImage(file, 600);
    setForm((f) => ({ ...f, photo: b64 }));
  }

  async function handleWorkPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 6 - form.workPhotos.length);
    const results = await Promise.all(files.map((f) => resizeImage(f, 900)));
    setForm((f) => ({ ...f, workPhotos: [...f.workPhotos, ...results].slice(0, 6) }));
  }

  function toggleCat(cat: OfficioCategory) {
    setForm((f) => ({
      ...f,
      categories: f.categories.includes(cat)
        ? f.categories.filter((c) => c !== cat)
        : [...f.categories, cat],
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const worker: OfficioWorker = {
      id: store.newId(),
      authorId,
      status: "pendiente",
      createdAt: new Date().toISOString(),
      fullName: form.fullName,
      cedula: form.cedula,
      phone: form.phone,
      whatsapp: form.whatsapp || form.phone,
      sector: form.sector,
      isAdult: form.isAdult,
      categories: form.categories,
      yearsExp: form.yearsExp,
      schedule: form.schedule,
      urgency: form.urgency,
      description: form.description,
      photo: form.photo || undefined,
      workPhotos: form.workPhotos,
      verified: false,
      availableToday: false,
      hiredCount: 0,
    };
    const current = store.getWorkers();
    store.setWorkers([...current, worker]);
    onSubmit();
  }

  const pct = (step / 3) * 100;

  return (
    <div style={{ minHeight: "100%", background: "#FAF6F0" }}>
      <div style={{ background: "white", padding: "20px 20px 0" }}>
        <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: TEAL, fontSize: 14, fontWeight: 600, cursor: "pointer", padding: "0 0 12px" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M11 6l-6 6 6 6" stroke={TEAL} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Volver
        </button>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 800, margin: "0 0 4px", color: "#162323" }}>Ofrece tus servicios</h1>
        <p style={{ fontSize: 13, color: "#6B7A7A", margin: "0 0 14px" }}>Paso {step} de 3</p>
        <div style={{ height: 5, background: "#F0EBE3", borderRadius: 10, marginBottom: 20 }}>
          <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${TEAL}, #0A4F4F)`, borderRadius: 10, transition: "width 0.3s" }} />
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: "16px 20px 32px", display: "flex", flexDirection: "column", gap: 14 }}>
        {step === 1 && (
          <>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#162323", margin: 0 }}>Datos personales</p>
            {[
              { label: "Nombre completo", key: "fullName", placeholder: "Tu nombre" },
              { label: "Cédula (solo verificación, no es pública)", key: "cedula", placeholder: "Número de cédula" },
              { label: "Teléfono", key: "phone", placeholder: "300 000 0000", type: "tel" },
              { label: "WhatsApp (si es diferente)", key: "whatsapp", placeholder: "300 000 0000", type: "tel" },
            ].map(({ label, key, placeholder, type }) => (
              <div key={key}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#6B7A7A", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 5 }}>{label}</label>
                <input type={type ?? "text"} placeholder={placeholder} value={(form as any)[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} required style={{ width: "100%", padding: "12px 14px", borderRadius: 11, border: "1.5px solid #E2DAD0", fontSize: 14, fontFamily: "'Outfit', sans-serif", outline: "none", boxSizing: "border-box" }} />
              </div>
            ))}
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#6B7A7A", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 5 }}>Sector del barrio</label>
              <select value={form.sector} onChange={(e) => setForm((f) => ({ ...f, sector: e.target.value }))} style={{ width: "100%", padding: "12px 14px", borderRadius: 11, border: "1.5px solid #E2DAD0", fontSize: 14, fontFamily: "'Outfit', sans-serif", outline: "none", boxSizing: "border-box" }}>
                {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <input type="checkbox" checked={form.isAdult} onChange={(e) => setForm((f) => ({ ...f, isAdult: e.target.checked }))} required />
              <span style={{ fontSize: 13, color: "#162323" }}>Confirmo que soy mayor de 18 años</span>
            </label>
            <button type="button" disabled={!form.fullName || !form.cedula || !form.phone || !form.isAdult} onClick={() => setStep(2)}
              style={{ padding: 13, borderRadius: 12, background: `linear-gradient(135deg, ${TEAL}, #0A4F4F)`, color: "white", fontSize: 15, fontWeight: 700, border: "none", cursor: "pointer", opacity: (!form.fullName || !form.cedula || !form.phone || !form.isAdult) ? 0.5 : 1 }}>
              Siguiente →
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#162323", margin: 0 }}>Tus servicios</p>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#6B7A7A", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 8 }}>Oficios (selecciona los que ofreces)</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {ALL_CATEGORIES.map(({ cat, icon }) => (
                  <button key={cat} type="button" onClick={() => toggleCat(cat)}
                    style={{ padding: "7px 12px", borderRadius: 100, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700,
                      background: form.categories.includes(cat) ? TEAL : "#F0EBE3",
                      color: form.categories.includes(cat) ? "white" : "#6B7A7A" }}>
                    {icon} {cat}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#6B7A7A", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 5 }}>Años de experiencia</label>
              <input type="number" min={0} max={50} value={form.yearsExp} onChange={(e) => setForm((f) => ({ ...f, yearsExp: Number(e.target.value) }))} style={{ width: "100%", padding: "12px 14px", borderRadius: 11, border: "1.5px solid #E2DAD0", fontSize: 14, fontFamily: "'Outfit', sans-serif", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#6B7A7A", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 5 }}>Horario de atención</label>
              <input type="text" placeholder="Lun–Sáb 8 a.m.–5 p.m." value={form.schedule} onChange={(e) => setForm((f) => ({ ...f, schedule: e.target.value }))} required style={{ width: "100%", padding: "12px 14px", borderRadius: 11, border: "1.5px solid #E2DAD0", fontSize: 14, fontFamily: "'Outfit', sans-serif", outline: "none", boxSizing: "border-box" }} />
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <input type="checkbox" checked={form.urgency} onChange={(e) => setForm((f) => ({ ...f, urgency: e.target.checked }))} />
              <span style={{ fontSize: 13, color: "#162323" }}>Atiende urgencias (fuera de horario)</span>
            </label>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#6B7A7A", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 5 }}>Descripción corta de tus servicios</label>
              <textarea rows={3} placeholder="Cuéntale a los vecinos qué haces y cómo trabajas..." value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} style={{ width: "100%", padding: "12px 14px", borderRadius: 11, border: "1.5px solid #E2DAD0", fontSize: 14, fontFamily: "'Outfit', sans-serif", resize: "vertical", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" onClick={() => setStep(1)} style={{ flex: 1, padding: 13, borderRadius: 12, border: "1px solid #E2DAD0", background: "white", color: "#6B7A7A", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>← Volver</button>
              <button type="button" disabled={form.categories.length === 0 || !form.schedule} onClick={() => setStep(3)}
                style={{ flex: 2, padding: 13, borderRadius: 12, background: `linear-gradient(135deg, ${TEAL}, #0A4F4F)`, color: "white", fontSize: 15, fontWeight: 700, border: "none", cursor: "pointer", opacity: (form.categories.length === 0 || !form.schedule) ? 0.5 : 1 }}>
                Siguiente →
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#162323", margin: 0 }}>Fotos y autorización</p>

            {/* Profile photo */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#6B7A7A", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 8 }}>Foto de perfil</label>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                {form.photo
                  ? <img src={form.photo} alt="Perfil" style={{ width: 60, height: 60, borderRadius: "50%", objectFit: "cover" }} />
                  : <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#F0EBE3", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>👤</div>}
                <button type="button" onClick={() => photoRef.current?.click()} style={{ padding: "9px 16px", borderRadius: 10, border: "1.5px solid #E2DAD0", background: "white", color: TEAL, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                  {form.photo ? "Cambiar" : "Subir foto"}
                </button>
                <input ref={photoRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhoto} />
              </div>
            </div>

            {/* Work photos */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#6B7A7A", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 8 }}>Fotos de mis trabajos (máx. 6)</label>
              {form.workPhotos.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginBottom: 10 }}>
                  {form.workPhotos.map((p, i) => (
                    <div key={i} style={{ position: "relative" }}>
                      <img src={p} alt="Trabajo" style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 10 }} />
                      <button type="button" onClick={() => setForm((f) => ({ ...f, workPhotos: f.workPhotos.filter((_, j) => j !== i) }))}
                        style={{ position: "absolute", top: 4, right: 4, width: 20, height: 20, borderRadius: "50%", background: "rgba(0,0,0,0.6)", color: "white", border: "none", cursor: "pointer", fontSize: 10, lineHeight: 1 }}>
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {form.workPhotos.length < 6 && (
                <button type="button" onClick={() => workRef.current?.click()} style={{ width: "100%", padding: "11px", borderRadius: 11, border: "1.5px dashed #C4BAB0", background: "white", color: TEAL, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                  📷 Agregar fotos
                </button>
              )}
              <input ref={workRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleWorkPhotos} />
            </div>

            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
              <input type="checkbox" checked={form.authorizeData} onChange={(e) => setForm((f) => ({ ...f, authorizeData: e.target.checked }))} required style={{ marginTop: 2, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: "#162323", lineHeight: 1.5 }}>
                Autorizo el tratamiento de mis datos personales conforme a la{" "}
                <strong>Ley 1581 de 2012</strong>. La JAC usará mis datos únicamente para gestionar mi perfil en el directorio de Oficios del Barrio.
              </span>
            </label>

            <div style={{ background: "#FEF3C7", borderRadius: 12, padding: "10px 14px", fontSize: 12, color: "#92400E" }}>
              ⚠️ Tu cédula solo la verá la JAC para confirmar que eres vecino del barrio. No se mostrará públicamente.
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" onClick={() => setStep(2)} style={{ flex: 1, padding: 13, borderRadius: 12, border: "1px solid #E2DAD0", background: "white", color: "#6B7A7A", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>← Volver</button>
              <button type="submit" disabled={!form.authorizeData}
                style={{ flex: 2, padding: 13, borderRadius: 12, background: `linear-gradient(135deg, ${TEAL}, #0A4F4F)`, color: "white", fontSize: 15, fontWeight: 700, border: "none", cursor: "pointer", opacity: !form.authorizeData ? 0.5 : 1 }}>
                Enviar solicitud
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function OfficiosScreen({ onBack }: { onBack: () => void }) {
  const [workers, setWorkers] = useState<OfficioWorker[]>(() => store.getWorkers().filter((w) => w.status === "aprobado"));
  const [reviews, setReviews] = useState<OfficioReview[]>(() => store.getReviews());
  const authorId = store.getAuthorId();

  type View = "home" | "category" | "profile" | "register" | "submitted";
  const [view, setView] = useState<View>("home");
  const [activeCategory, setActiveCategory] = useState<OfficioCategory | null>(null);
  const [selectedWorker, setSelectedWorker] = useState<OfficioWorker | null>(null);
  const [search, setSearch] = useState("");
  const [filterAvailable, setFilterAvailable] = useState(false);
  const [filterUrgency, setFilterUrgency] = useState(false);
  const [filterTopRated, setFilterTopRated] = useState(false);

  const myProfile = store.getWorkers().find((w) => w.authorId === authorId);

  function refreshWorkers() {
    setWorkers(store.getWorkers().filter((w) => w.status === "aprobado"));
  }

  function refreshReviews() {
    setReviews(store.getReviews());
  }

  function addReview(r: Omit<OfficioReview, "id" | "date">) {
    const review: OfficioReview = { ...r, id: store.newId(), date: new Date().toISOString().slice(0, 10) };
    const all = [...store.getReviews(), review];
    store.setReviews(all);
    refreshReviews();
    // Bump hired count
    const ws = store.getWorkers().map((w) => w.id === r.workerId ? { ...w, hiredCount: w.hiredCount + 1 } : w);
    store.setWorkers(ws);
    refreshWorkers();
    if (selectedWorker?.id === r.workerId) setSelectedWorker((prev) => prev ? { ...prev, hiredCount: prev.hiredCount + 1 } : prev);
  }

  function toggleAvailable() {
    if (!selectedWorker) return;
    const ws = store.getWorkers().map((w) => w.id === selectedWorker.id ? { ...w, availableToday: !w.availableToday } : w);
    store.setWorkers(ws);
    refreshWorkers();
    setSelectedWorker((prev) => prev ? { ...prev, availableToday: !prev.availableToday } : prev);
  }

  function getCategoryWorkers(cat: OfficioCategory) {
    let list = workers.filter((w) => w.categories.includes(cat));
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((w) => w.fullName.toLowerCase().includes(q) || w.categories.some((c) => c.toLowerCase().includes(q)) || w.sector.toLowerCase().includes(q));
    }
    if (filterAvailable) list = list.filter((w) => w.availableToday);
    if (filterUrgency) list = list.filter((w) => w.urgency);
    if (filterTopRated) list = list.sort((a, b) => avgRating(reviews, b.id) - avgRating(reviews, a.id));
    return list;
  }

  function getAllWorkers() {
    let list = [...workers];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((w) => w.fullName.toLowerCase().includes(q) || w.categories.some((c) => c.toLowerCase().includes(q)) || w.sector.toLowerCase().includes(q) || w.description.toLowerCase().includes(q));
    }
    if (filterAvailable) list = list.filter((w) => w.availableToday);
    if (filterUrgency) list = list.filter((w) => w.urgency);
    if (filterTopRated) list = list.sort((a, b) => avgRating(reviews, b.id) - avgRating(reviews, a.id));
    return list;
  }

  // ── Profile view ──
  if (view === "profile" && selectedWorker) {
    return (
      <div style={{ height: "100%", overflowY: "auto" }}>
        <WorkerProfile
          worker={selectedWorker}
          reviews={reviews}
          authorId={authorId}
          onBack={() => { setView(activeCategory ? "category" : "home"); }}
          onAddReview={addReview}
          onToggleAvailable={toggleAvailable}
        />
      </div>
    );
  }

  // ── Register view ──
  if (view === "register") {
    return (
      <div style={{ height: "100%", overflowY: "auto" }}>
        <RegistrationForm
          authorId={authorId}
          onBack={() => setView("home")}
          onSubmit={() => setView("submitted")}
        />
      </div>
    );
  }

  // ── Submitted ──
  if (view === "submitted") {
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 32px", textAlign: "center", background: "#FAF6F0" }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🧰</div>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 800, color: "#162323", margin: "0 0 10px" }}>¡Solicitud enviada!</h2>
        <p style={{ fontSize: 15, color: "#6B7A7A", lineHeight: 1.6, margin: "0 0 28px" }}>
          Tu solicitud está en revisión. La JAC la aprobará pronto. Te contactaremos por WhatsApp cuando esté activa.
        </p>
        <div style={{ background: TEAL + "15", borderRadius: 14, padding: "14px 20px", marginBottom: 28, width: "100%" }}>
          <p style={{ fontSize: 13, color: TEAL, fontWeight: 600, margin: 0 }}>📋 Estado: <strong>En revisión</strong></p>
        </div>
        <button onClick={() => setView("home")} style={{ padding: "13px 28px", borderRadius: 12, background: `linear-gradient(135deg, ${TEAL}, #0A4F4F)`, color: "white", fontWeight: 700, fontSize: 15, border: "none", cursor: "pointer" }}>
          Volver al inicio
        </button>
      </div>
    );
  }

  // ── Category list view ──
  if (view === "category" && activeCategory) {
    const catWorkers = getCategoryWorkers(activeCategory);
    const catIcon = ALL_CATEGORIES.find((c) => c.cat === activeCategory)?.icon ?? "🛠️";
    return (
      <div style={{ height: "100%", overflowY: "auto", background: "#FAF6F0" }}>
        <div style={{ background: "white", padding: "20px 20px 16px", borderBottom: "1px solid #E2DAD0" }}>
          <button onClick={() => setView("home")} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: TEAL, fontSize: 14, fontWeight: 600, cursor: "pointer", padding: "0 0 10px" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M11 6l-6 6 6 6" stroke={TEAL} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Categorías
          </button>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 800, margin: "0 0 4px", color: "#162323" }}>{catIcon} {activeCategory}</h1>
          <p style={{ fontSize: 13, color: "#6B7A7A", margin: 0 }}>{catWorkers.length} vecino{catWorkers.length !== 1 ? "s" : ""} disponible{catWorkers.length !== 1 ? "s" : ""}</p>
        </div>
        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
          {catWorkers.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <p style={{ fontSize: 36, margin: "0 0 12px" }}>🔍</p>
              <p style={{ fontSize: 14, color: "#6B7A7A" }}>No hay vecinos registrados en esta categoría todavía.</p>
            </div>
          ) : catWorkers.map((w) => (
            <WorkerCard key={w.id} worker={w} reviews={reviews} onClick={() => { setSelectedWorker(w); setView("profile"); }} />
          ))}
        </div>
        <p style={{ fontSize: 11, color: "#6B7A7A", textAlign: "center", padding: "0 20px 24px", lineHeight: 1.6 }}>
          ⚠️ La JAC no garantiza los trabajos realizados. Acuerda precio y condiciones antes de iniciar.
        </p>
      </div>
    );
  }

  // ── Home view ──
  const searchResults = search || filterAvailable || filterUrgency || filterTopRated;
  const filteredAll = getAllWorkers();

  return (
    <div style={{ height: "100%", overflowY: "auto", background: "#FAF6F0" }}>
      {/* Header */}
      <div style={{ background: "white", padding: "20px 20px 16px", borderBottom: "1px solid #E2DAD0" }}>
        <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: TEAL, fontSize: 14, fontWeight: 600, cursor: "pointer", padding: "0 0 10px" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M11 6l-6 6 6 6" stroke={TEAL} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Inicio
        </button>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 800, margin: "0 0 4px", color: "#162323" }}>Oficios del Barrio</h1>
        <p style={{ fontSize: 13, color: "#6B7A7A", margin: "0 0 14px" }}>Vecinos que ofrecen sus servicios en Las Gaviotas</p>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: 12 }}>
          <svg style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" }} width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="#6B7A7A" strokeWidth="2" /><path d="M21 21l-4.35-4.35" stroke="#6B7A7A" strokeWidth="2" strokeLinecap="round" /></svg>
          <input type="text" placeholder="¿Qué necesitas? plomero, electricista…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: "100%", padding: "12px 14px 12px 40px", borderRadius: 12, border: "1.5px solid #E2DAD0", fontSize: 14, fontFamily: "'Outfit', sans-serif", outline: "none", boxSizing: "border-box", background: "#FAF6F0" }} />
        </div>

        {/* Filter chips */}
        <div style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 2 }}>
          {[
            { label: "Disponibles hoy", active: filterAvailable, toggle: () => setFilterAvailable((v) => !v) },
            { label: "Urgencias 24h", active: filterUrgency, toggle: () => setFilterUrgency((v) => !v) },
            { label: "Mejor calificados", active: filterTopRated, toggle: () => setFilterTopRated((v) => !v) },
          ].map(({ label, active, toggle }) => (
            <button key={label} onClick={toggle} style={{ flexShrink: 0, padding: "7px 14px", borderRadius: 100, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, background: active ? TEAL : "#F0EBE3", color: active ? "white" : "#6B7A7A", transition: "background 0.2s" }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* My profile status */}
        {myProfile && (
          <div style={{ background: myProfile.status === "aprobado" ? TEAL + "18" : "#FEF3C7", border: `1px solid ${myProfile.status === "aprobado" ? TEAL + "40" : "#D97706"}`, borderRadius: 14, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 24 }}>🧰</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#162323", margin: 0 }}>Tu perfil: {myProfile.fullName}</p>
              <p style={{ fontSize: 12, color: "#6B7A7A", margin: 0 }}>Estado: <strong>{myProfile.status === "pendiente" ? "En revisión" : myProfile.status === "aprobado" ? "Activo ✓" : myProfile.status === "rechazado" ? "Rechazado" : "Pausado"}</strong></p>
            </div>
            {myProfile.status === "aprobado" && (
              <button onClick={() => { setSelectedWorker(myProfile); setView("profile"); }} style={{ padding: "7px 12px", borderRadius: 9, background: TEAL, color: "white", fontWeight: 700, fontSize: 12, border: "none", cursor: "pointer" }}>
                Ver
              </button>
            )}
          </div>
        )}

        {/* Search results */}
        {searchResults ? (
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#6B7A7A", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 10px" }}>Resultados ({filteredAll.length})</p>
            {filteredAll.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0" }}>
                <p style={{ fontSize: 32, margin: "0 0 10px" }}>🔍</p>
                <p style={{ fontSize: 14, color: "#6B7A7A" }}>No se encontraron vecinos con esos criterios.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {filteredAll.map((w) => (
                  <WorkerCard key={w.id} worker={w} reviews={reviews} onClick={() => { setSelectedWorker(w); setView("profile"); }} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Categories grid */}
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#6B7A7A", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 12px" }}>Categorías</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {ALL_CATEGORIES.map(({ cat, icon }) => {
                  const count = workers.filter((w) => w.categories.includes(cat)).length;
                  return (
                    <button key={cat} onClick={() => { setActiveCategory(cat); setView("category"); }}
                      style={{ background: "white", border: "1px solid #E2DAD0", borderRadius: 14, padding: "14px 10px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer", textAlign: "center" }}>
                      <span style={{ fontSize: 26 }}>{icon}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#162323", lineHeight: 1.3 }}>{cat}</span>
                      {count > 0 && <span style={{ fontSize: 10, color: TEAL, fontWeight: 700 }}>{count} vecino{count !== 1 ? "s" : ""}</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ofrece tus servicios CTA */}
            {!myProfile && (
              <button onClick={() => setView("register")}
                style={{ width: "100%", padding: "16px", borderRadius: 16, background: `linear-gradient(135deg, ${TEAL}, #0A4F4F)`, color: "white", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 14, textAlign: "left" }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>🧰</div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 800, margin: "0 0 2px" }}>¿Ofreces un servicio?</p>
                  <p style={{ fontSize: 13, margin: 0, opacity: 0.85 }}>Regístrate y conecta con vecinos del barrio</p>
                </div>
                <svg style={{ marginLeft: "auto", flexShrink: 0 }} width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            )}
          </>
        )}

        <p style={{ fontSize: 11, color: "#6B7A7A", textAlign: "center", lineHeight: 1.6, margin: 0 }}>
          ⚠️ La JAC no garantiza los trabajos realizados. Acuerda precio y condiciones antes de iniciar.
        </p>
      </div>
    </div>
  );
}
