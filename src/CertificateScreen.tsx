import { useState, useRef } from "react";
import { store, CertificateRequest, CertStatus } from "./store";

const TEAL = "#0D6E6E";
const CORAL = "#E8643A";

const STATUS_META: Record<CertStatus, { color: string; bg: string; emoji: string }> = {
  "Enviada":            { color: "#2E86AB", bg: "#E8F4F8", emoji: "📤" },
  "En revisión":        { color: "#7B4FBF", bg: "#F3EEF9", emoji: "🔍" },
  "Aprobada":           { color: "#16A34A", bg: "#DCFCE7", emoji: "✅" },
  "Requiere corrección":{ color: "#D97706", bg: "#FEF3C7", emoji: "✏️" },
  "Rechazada":          { color: "#DC2626", bg: "#FEE2E2", emoji: "❌" },
};

const PURPOSES = [
  "Trámite bancario",
  "Matrícula educativa",
  "Subsidio o beneficio social",
  "Visa o pasaporte",
  "Proceso judicial",
  "Trámite laboral",
  "Servicios públicos",
  "Otro",
];

function photoUploader(
  label: string,
  value: string,
  onChange: (v: string) => void,
  required = true,
) {
  return { label, value, onChange, required };
}

interface PhotoField {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required: boolean;
}

function PhotoUploader({ label, value, onChange, required }: PhotoField) {
  const ref = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  function handle(file: File) {
    if (!file.type.startsWith("image/")) return;
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 1024;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round((height * MAX) / width); width = MAX; }
          else { width = Math.round((width * MAX) / height); height = MAX; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
        onChange(canvas.toDataURL("image/jpeg", 0.85));
        setLoading(false);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: "#6B7A7A", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", gap: 4, alignItems: "center", marginBottom: 6 }}>
        {label} {required && <span style={{ color: CORAL }}>*</span>}
      </label>
      <input ref={ref} type="file" accept="image/*" style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handle(f); }} />
      {value ? (
        <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: `1.5px solid ${TEAL}40` }}>
          <img src={value} alt={label} style={{ width: "100%", maxHeight: 140, objectFit: "cover", display: "block" }} />
          <button onClick={() => ref.current?.click()} style={{ position: "absolute", bottom: 8, right: 8, padding: "6px 12px", borderRadius: 8, background: "rgba(0,0,0,0.6)", border: "none", color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            🔄 Cambiar
          </button>
        </div>
      ) : (
        <button onClick={() => ref.current?.click()} disabled={loading}
          style={{ width: "100%", padding: "18px 12px", borderRadius: 12, border: `2px dashed ${TEAL}55`, background: TEAL + "08", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
          <span style={{ fontSize: 26 }}>{loading ? "⏳" : "📷"}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: TEAL }}>{loading ? "Procesando..." : "Toca para subir"}</span>
        </button>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder = "", required = true, children }: {
  label: string; value?: string; onChange?: (v: string) => void;
  type?: string; placeholder?: string; required?: boolean; children?: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: "#6B7A7A", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", gap: 4, alignItems: "center", marginBottom: 6 }}>
        {label} {required && <span style={{ color: CORAL }}>*</span>}
      </label>
      {children ?? (
        <input type={type} value={value ?? ""} placeholder={placeholder}
          onChange={(e) => onChange?.(e.target.value)}
          style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid #E2DAD0", fontSize: 14, fontFamily: "'Outfit', sans-serif", outline: "none", background: "white", color: "#162323", boxSizing: "border-box" }} />
      )}
    </div>
  );
}

function Select({ label, value, onChange, options, required = true }: {
  label: string; value: string; onChange: (v: string) => void; options: string[]; required?: boolean;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: "#6B7A7A", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", gap: 4, alignItems: "center", marginBottom: 6 }}>
        {label} {required && <span style={{ color: CORAL }}>*</span>}
      </label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid #E2DAD0", fontSize: 14, fontFamily: "'Outfit', sans-serif", outline: "none", background: "white", color: "#162323", appearance: "auto" }}>
        <option value="">Selecciona...</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

type View = "menu" | "form" | "requests";

function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function consecutive() {
  const n = (store.getCertificates().length + 1).toString().padStart(4, "0");
  return `CV-${new Date().getFullYear()}-${n}`;
}

export default function CertificateScreen({ onBack }: { onBack: () => void }) {
  const [view, setView] = useState<View>("menu");
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [certId, setCertId] = useState("");

  // Form state
  const [fullName, setFullName] = useState("");
  const [docType, setDocType] = useState("");
  const [docNumber, setDocNumber] = useState("");
  const [docPlace, setDocPlace] = useState("");
  const [address, setAddress] = useState("");
  const [residenceTime, setResidenceTime] = useState("");
  const [quality, setQuality] = useState<"Propietario" | "Arrendatario" | "Familiar" | "">("");
  const [purpose, setPurpose] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [photoCedulaFront, setPhotoCedulaFront] = useState("");
  const [photoCedulaBack, setPhotoCedulaBack] = useState("");
  const [photoRecibo, setPhotoRecibo] = useState("");
  const [photoContrato, setPhotoContrato] = useState("");
  const [photoSelfie, setPhotoSelfie] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  function validateStep1() {
    const e: string[] = [];
    if (!fullName.trim()) e.push("Nombre completo");
    if (!docType) e.push("Tipo de documento");
    if (!docNumber.trim()) e.push("Número de documento");
    if (!docPlace.trim()) e.push("Lugar de expedición del documento");
    if (!address.trim()) e.push("Dirección");
    if (!residenceTime.trim()) e.push("Tiempo de residencia");
    if (!quality) e.push("Calidad de ocupante");
    if (!purpose) e.push("Propósito");
    if (!phone.trim()) e.push("Teléfono");
    if (!email.trim()) e.push("Correo electrónico");
    return e;
  }

  function validateStep2() {
    const e: string[] = [];
    if (!photoCedulaFront) e.push("Cédula (frontal)");
    if (!photoCedulaBack) e.push("Cédula (posterior)");
    if (!photoRecibo) e.push("Recibo de servicio público");
    if (quality === "Arrendatario" && !photoContrato) e.push("Contrato de arriendo");
    return e;
  }

  function goNext() {
    if (step === 1) {
      const e = validateStep1();
      if (e.length > 0) { setErrors(e); return; }
    }
    if (step === 2) {
      const e = validateStep2();
      if (e.length > 0) { setErrors(e); return; }
    }
    setErrors([]);
    setStep(step + 1);
  }

  function handleSubmit() {
    if (!authorized) { setErrors(["Debes autorizar el tratamiento de datos"]); return; }
    const id = newId();
    const req: CertificateRequest = {
      id, consecutive: consecutive(), createdAt: new Date().toISOString(),
      status: "Enviada",
      fullName, docType, docNumber, address, residenceTime,
      docPlace,
      quality: quality as "Propietario" | "Arrendatario" | "Familiar",
      purpose, phone, email,
      photoCedulaFront, photoCedulaBack, photoRecibo,
      photoContrato: photoContrato || undefined,
      photoSelfie: photoSelfie || undefined,
    };
    const prev = store.getCertificates();
    store.setCertificates([...prev, req]);
    setCertId(id);
    setSubmitted(true);
  }

  if (view === "requests") {
    return <RequestsView onBack={() => setView("menu")} />;
  }

  if (view === "form") {
    if (submitted) {
      const cert = store.getCertificates().find((c) => c.id === certId);
      return (
        <div style={{ padding: "24px 20px" }}>
          <div style={{ textAlign: "center", padding: "32px 20px", background: "#DCFCE7", borderRadius: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>✅</div>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 22, color: "#16A34A", margin: "0 0 8px" }}>¡Solicitud enviada!</h2>
            <p style={{ fontSize: 14, color: "#166534", margin: "0 0 12px" }}>Tu solicitud fue registrada con el número</p>
            <div style={{ background: "white", borderRadius: 12, padding: "12px 20px", display: "inline-block", fontWeight: 800, fontSize: 18, color: TEAL, fontFamily: "'Fraunces', serif" }}>
              {cert?.consecutive}
            </div>
          </div>
          <p style={{ fontSize: 13, color: "#6B7A7A", textAlign: "center", marginBottom: 20 }}>
            La JAC revisará tu solicitud. Recibirás una actualización de estado en esta sección.
          </p>
          <button onClick={() => { setView("requests"); setSubmitted(false); }}
            style={{ width: "100%", padding: "14px", borderRadius: 14, background: TEAL, color: "white", fontWeight: 700, fontSize: 15, border: "none", cursor: "pointer", marginBottom: 10 }}>
            Ver mis solicitudes
          </button>
          <button onClick={() => { setView("menu"); setSubmitted(false); setStep(1); }}
            style={{ width: "100%", padding: "14px", borderRadius: 14, background: "transparent", color: TEAL, fontWeight: 700, fontSize: 15, border: `1.5px solid ${TEAL}`, cursor: "pointer" }}>
            Volver al inicio
          </button>
        </div>
      );
    }

    return (
      <div style={{ padding: "16px 20px 32px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <button onClick={() => step > 1 ? setStep(step - 1) : setView("menu")}
            style={{ background: "none", border: "none", color: TEAL, cursor: "pointer", fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, padding: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M11 6l-6 6 6 6" stroke={TEAL} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            {step > 1 ? "Atrás" : "Cancelar"}
          </button>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 700, color: "#162323", margin: 0, flex: 1 }}>
            Certificado de vecindad
          </h2>
        </div>

        {/* Progress */}
        <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
          {[1, 2, 3].map((s) => (
            <div key={s} style={{ flex: 1, height: 4, borderRadius: 100, background: s <= step ? TEAL : "#E2DAD0" }} />
          ))}
        </div>
        <p style={{ fontSize: 13, color: "#6B7A7A", margin: "0 0 20px", fontWeight: 600 }}>
          Paso {step} de 3 — {step === 1 ? "Datos personales" : step === 2 ? "Fotos de documentos" : "Resumen y autorización"}
        </p>

        {errors.length > 0 && (
          <div style={{ background: "#FEE2E2", borderRadius: 12, padding: "12px 14px", marginBottom: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#B91C1C", margin: "0 0 4px" }}>Completa los siguientes campos:</p>
            {errors.map((e) => <p key={e} style={{ fontSize: 12, color: "#B91C1C", margin: "2px 0" }}>• {e}</p>)}
          </div>
        )}

        {step === 1 && (
          <div>
            <Field label="Nombre completo" value={fullName} onChange={setFullName} placeholder="Como aparece en el documento" />
            <Select label="Tipo de documento" value={docType} onChange={setDocType} options={["Cédula de ciudadanía", "Cédula de extranjería", "Tarjeta de identidad", "Pasaporte"]} />
            <Field label="Número de documento" value={docNumber} onChange={setDocNumber} placeholder="Ej: 1234567890" />
            <Field label="Lugar de expedición" value={docPlace} onChange={setDocPlace} placeholder="Ej: Cartagena de Indias" />
            <Field label="Dirección de residencia" value={address} onChange={setAddress} placeholder="Calle, carrera, barrio..." />
            <Field label="Tiempo de residencia" value={residenceTime} onChange={setResidenceTime} placeholder="Ej: 5 años" />
            <Select label="Calidad" value={quality} onChange={(v) => setQuality(v as any)} options={["Propietario", "Arrendatario", "Familiar"]} />
            <Select label="Propósito del certificado" value={purpose} onChange={setPurpose} options={PURPOSES} />
            <Field label="Teléfono de contacto" value={phone} onChange={setPhone} type="tel" placeholder="Ej: 300 000 0000" />
            <Field label="Correo electrónico" value={email} onChange={setEmail} type="email" placeholder="tucorreo@correo.com" />
          </div>
        )}

        {step === 2 && (
          <div>
            <p style={{ fontSize: 13, color: "#6B7A7A", marginBottom: 16 }}>
              Sube fotos nítidas de cada documento. Asegúrate de que el texto sea legible.
            </p>
            <PhotoUploader label="Cédula — cara frontal" value={photoCedulaFront} onChange={setPhotoCedulaFront} required />
            <PhotoUploader label="Cédula — cara posterior" value={photoCedulaBack} onChange={setPhotoCedulaBack} required />
            <PhotoUploader label="Recibo de servicio público" value={photoRecibo} onChange={setPhotoRecibo} required />
            {quality === "Arrendatario" && (
              <PhotoUploader label="Contrato de arriendo" value={photoContrato} onChange={setPhotoContrato} required />
            )}
            <PhotoUploader label="Selfie (opcional)" value={photoSelfie} onChange={setPhotoSelfie} required={false} />
          </div>
        )}

        {step === 3 && (
          <div>
            <div style={{ background: "#F0FAF5", borderRadius: 14, padding: "16px", marginBottom: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#6B7A7A", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 10px" }}>Resumen de la solicitud</p>
              {[
                ["Nombre", fullName],
                ["Documento", `${docType} ${docNumber} (exp. ${docPlace})`],
                ["Dirección", address],
                ["Tiempo de residencia", residenceTime],
                ["Calidad", quality],
                ["Propósito", purpose],
                ["Teléfono", phone],
                ["Correo", email],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #E2DAD0" }}>
                  <span style={{ fontSize: 13, color: "#6B7A7A", fontWeight: 600 }}>{k}</span>
                  <span style={{ fontSize: 13, color: "#162323", fontWeight: 600, textAlign: "right", maxWidth: "55%" }}>{v}</span>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
              {[
                { label: "Cédula frontal", img: photoCedulaFront },
                { label: "Cédula posterior", img: photoCedulaBack },
                { label: "Recibo", img: photoRecibo },
                ...(photoContrato ? [{ label: "Contrato", img: photoContrato }] : []),
                ...(photoSelfie ? [{ label: "Selfie", img: photoSelfie }] : []),
              ].map(({ label, img }) => (
                <div key={label} style={{ width: 80 }}>
                  <img src={img} alt={label} style={{ width: 80, height: 60, objectFit: "cover", borderRadius: 8, border: "1.5px solid #E2DAD0" }} />
                  <p style={{ fontSize: 10, color: "#6B7A7A", textAlign: "center", margin: "3px 0 0" }}>{label}</p>
                </div>
              ))}
            </div>

            <div style={{ background: "#FEF9EC", border: "1.5px solid #D97706", borderRadius: 14, padding: "14px", marginBottom: 20 }}>
              <label style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer" }}>
                <input type="checkbox" checked={authorized} onChange={(e) => setAuthorized(e.target.checked)}
                  style={{ marginTop: 2, accentColor: TEAL, width: 18, height: 18, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: "#92400E", lineHeight: 1.5 }}>
                  Autorizo a la JAC Las Gaviotas para recolectar y tratar mis datos personales con el fin de expedir el certificado de vecindad, de conformidad con la{" "}
                  <strong>Ley 1581 de 2012</strong> (Habeas Data). Estos datos no serán compartidos con terceros sin mi consentimiento.
                </span>
              </label>
            </div>
          </div>
        )}

        <button onClick={step < 3 ? goNext : handleSubmit}
          style={{ width: "100%", padding: "15px", borderRadius: 14, background: `linear-gradient(135deg, ${TEAL}, #0A4F4F)`, color: "white", fontWeight: 700, fontSize: 16, border: "none", cursor: "pointer" }}>
          {step < 3 ? "Siguiente →" : "Enviar solicitud"}
        </button>
      </div>
    );
  }

  // Menu view
  return (
    <div style={{ padding: "24px 20px 32px" }}>
      <button onClick={onBack}
        style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: TEAL, fontSize: 14, fontWeight: 600, cursor: "pointer", padding: "0 0 16px" }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M11 6l-6 6 6 6" stroke={TEAL} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        Volver
      </button>

      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ width: 72, height: 72, borderRadius: 20, background: TEAL, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, margin: "0 auto 16px" }}>📋</div>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 700, color: "#162323", margin: "0 0 6px" }}>Certificado de vecindad</h1>
        <p style={{ fontSize: 14, color: "#6B7A7A", margin: 0, lineHeight: 1.6 }}>
          Solicita tu certificado expedido por la JAC Barrio Las Gaviotas · Cartagena de Indias
        </p>
      </div>

      <div style={{ background: "#F0EBE3", borderRadius: 16, padding: "16px", marginBottom: 20 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#162323", margin: "0 0 8px" }}>¿Qué necesitas?</p>
        {["Cédula de ciudadanía (frontal y posterior)", "Recibo de servicio público reciente", "Contrato de arriendo (solo arrendatarios)"].map((r) => (
          <p key={r} style={{ fontSize: 13, color: "#6B7A7A", margin: "4px 0", display: "flex", gap: 6 }}>
            <span style={{ color: TEAL, fontWeight: 700 }}>✓</span> {r}
          </p>
        ))}
      </div>

      <button onClick={() => { setView("form"); setStep(1); setSubmitted(false); setErrors([]); }}
        style={{ width: "100%", padding: "16px", borderRadius: 14, background: `linear-gradient(135deg, ${TEAL}, #0A4F4F)`, color: "white", fontWeight: 700, fontSize: 16, border: "none", cursor: "pointer", marginBottom: 12 }}>
        📋 Solicitar certificado
      </button>
      <button onClick={() => setView("requests")}
        style={{ width: "100%", padding: "16px", borderRadius: 14, background: "transparent", color: TEAL, fontWeight: 700, fontSize: 15, border: `1.5px solid ${TEAL}`, cursor: "pointer" }}>
        📁 Mis solicitudes
      </button>
    </div>
  );
}

function RequestsView({ onBack }: { onBack: () => void }) {
  const [certs, setCerts] = useState(() => store.getCertificates().slice().reverse());
  const [selected, setSelected] = useState<CertificateRequest | null>(null);

  if (selected) {
    const meta = STATUS_META[selected.status];
    return (
      <div style={{ padding: "16px 20px 32px" }}>
        <button onClick={() => setSelected(null)}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: TEAL, fontSize: 14, fontWeight: 600, cursor: "pointer", padding: "0 0 16px" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M11 6l-6 6 6 6" stroke={TEAL} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Mis solicitudes
        </button>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 700, color: "#162323", margin: "0 0 16px" }}>{selected.consecutive}</h2>
        <div style={{ background: meta.bg, borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <span style={{ fontSize: 20 }}>{meta.emoji}</span>
          <div>
            <p style={{ fontSize: 13, fontWeight: 800, color: meta.color, margin: 0 }}>{selected.status}</p>
            {selected.adminComment && <p style={{ fontSize: 12, color: meta.color, margin: "2px 0 0" }}>{selected.adminComment}</p>}
          </div>
        </div>
        {[
          ["Nombre", selected.fullName],
          ["Documento", `${selected.docType} · ${selected.docNumber}`],
          ["Dirección", selected.address],
          ["Tiempo de residencia", selected.residenceTime],
          ["Calidad", selected.quality],
          ["Propósito", selected.purpose],
        ].map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #E2DAD0" }}>
            <span style={{ fontSize: 13, color: "#6B7A7A", fontWeight: 600 }}>{k}</span>
            <span style={{ fontSize: 13, color: "#162323", fontWeight: 600 }}>{v}</span>
          </div>
        ))}
        <p style={{ fontSize: 11, color: "#6B7A7A", marginTop: 16, textAlign: "center" }}>
          Enviada el {new Date(selected.createdAt).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: "16px 20px 32px" }}>
      <button onClick={onBack}
        style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: TEAL, fontSize: 14, fontWeight: 600, cursor: "pointer", padding: "0 0 16px" }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M11 6l-6 6 6 6" stroke={TEAL} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        Volver
      </button>
      <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 700, color: "#162323", margin: "0 0 16px" }}>Mis solicitudes</h2>

      {certs.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📁</div>
          <p style={{ fontSize: 14, color: "#6B7A7A" }}>No tienes solicitudes aún.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {certs.map((c) => {
            const meta = STATUS_META[c.status];
            return (
              <button key={c.id} onClick={() => setSelected(c)}
                style={{ background: "white", border: "1px solid #E2DAD0", borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", textAlign: "left" }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: meta.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                  {meta.emoji}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#162323", margin: "0 0 2px" }}>{c.consecutive}</p>
                  <p style={{ fontSize: 12, color: "#6B7A7A", margin: "0 0 4px" }}>{c.fullName}</p>
                  <span style={{ fontSize: 11, fontWeight: 700, color: meta.color, background: meta.bg, padding: "3px 9px", borderRadius: 100 }}>{c.status}</span>
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
