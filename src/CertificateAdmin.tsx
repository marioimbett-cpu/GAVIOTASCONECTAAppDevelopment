import { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { store, CertificateRequest, CertStatus } from "./store";
import logoJAC from "./imports/WhatsApp_Image_2026-09-22_at_2.16.16_PM.jpeg";
import escudoAC from "./imports/Escudo_Accio_n_Comunal_Colombia.svg";

const TEAL = "#0D6E6E";
const CORAL = "#E8643A";

const STATUS_META: Record<CertStatus, { color: string; bg: string; emoji: string }> = {
  "Enviada":            { color: "#2E86AB", bg: "#E8F4F8", emoji: "📤" },
  "En revisión":        { color: "#7B4FBF", bg: "#F3EEF9", emoji: "🔍" },
  "Aprobada":           { color: "#16A34A", bg: "#DCFCE7", emoji: "✅" },
  "Requiere corrección":{ color: "#D97706", bg: "#FEF3C7", emoji: "✏️" },
  "Rechazada":          { color: "#DC2626", bg: "#FEE2E2", emoji: "❌" },
};

const ALL_STATUSES: CertStatus[] = ["Enviada", "En revisión", "Aprobada", "Requiere corrección", "Rechazada"];

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", gap: 10, padding: "7px 0", borderBottom: "1px solid #F0EBE3" }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: "#6B7A7A", minWidth: 120 }}>{label}</span>
      <span style={{ fontSize: 13, color: "#162323", fontWeight: 600, flex: 1 }}>{value}</span>
    </div>
  );
}

function CertificatePreview({ cert }: { cert: CertificateRequest }) {
  const [qrUrl, setQrUrl] = useState("");
  const [downloading, setDownloading] = useState(false);
  const certRef = useRef<HTMLDivElement>(null);
  const settings = store.getSettings();

  const approvedDate = cert.approvedAt ? new Date(cert.approvedAt) : new Date();
  const day = approvedDate.getDate();
  const month = approvedDate.toLocaleDateString("es-CO", { month: "long" });
  const year = approvedDate.getFullYear();
  const verifyLink = `${window.location.origin}/verificar/${cert.id}`;
  const verifyUrl = `${window.location.host}/verificar`;

  useEffect(() => {
    QRCode.toDataURL(verifyLink, { width: 160, margin: 1, color: { dark: "#0D6E6E", light: "#FFFFFF" } })
      .then(setQrUrl)
      .catch(() => {});
  }, [cert]);

  const docGen = (cert as any).docPlace ? `expedida en ${(cert as any).docPlace}` : "";

  async function downloadPDF() {
    if (!certRef.current) return;
    setDownloading(true);
    try {
      // Render a clone off-screen at exactly 794px (A4 at 96dpi) — avoids mobile-width constraints
      const wrapper = document.createElement("div");
      wrapper.style.cssText =
        "position:fixed;top:-9999px;left:-9999px;width:794px;background:#fff;font-family:'Outfit',sans-serif;";

      const clone = certRef.current.cloneNode(true) as HTMLElement;
      clone.style.maxWidth = "794px";
      clone.style.width = "794px";
      clone.style.borderRadius = "0";
      clone.style.boxShadow = "none";
      clone.style.margin = "0";
      clone.style.border = "none";
      wrapper.appendChild(clone);
      document.body.appendChild(wrapper);

      // Small delay so images/fonts render in the clone
      await new Promise((r) => setTimeout(r, 300));

      const canvas = await html2canvas(wrapper, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        width: 794,
        windowWidth: 794,
      });

      document.body.removeChild(wrapper);

      const imgData = canvas.toDataURL("image/jpeg", 0.97);
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();   // 210 mm
      const pageH = pdf.internal.pageSize.getHeight();  // 297 mm
      const imgH = (canvas.height / canvas.width) * pageW;

      if (imgH <= pageH) {
        pdf.addImage(imgData, "JPEG", 0, 0, pageW, imgH);
      } else {
        // Taller than one A4 page — fill height instead
        const w = (canvas.width / canvas.height) * pageH;
        pdf.addImage(imgData, "JPEG", (pageW - w) / 2, 0, w, pageH);
      }

      pdf.save(`Certificado-Vecindad-${cert.consecutive}-${cert.fullName.replace(/\s+/g, "-")}.pdf`);
    } catch (err) {
      console.error(err);
    }
    setDownloading(false);
  }

  return (
    <div>
    <div ref={certRef} style={{ background: "white", border: `2px solid ${TEAL}40`, borderRadius: 16, overflow: "hidden", maxWidth: 420, margin: "0 auto", boxShadow: "0 8px 32px rgba(13,110,110,0.12)" }}>

      {/* ── Encabezado ── */}
      <div style={{ background: `linear-gradient(135deg, ${TEAL}, #062E2E)`, padding: "16px 18px 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          {/* Escudo Acción Comunal */}
          <div style={{ width: 62, height: 62, borderRadius: 10, background: "white", display: "flex", alignItems: "center", justifyContent: "center", padding: 4, overflow: "hidden", flexShrink: 0 }}>
            <img src={escudoAC} alt="Escudo Acción Comunal Colombia" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
          {/* Títulos centro */}
          <div style={{ flex: 1, textAlign: "center" }}>
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 8, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 1px" }}>República de Colombia</p>
            <p style={{ color: "white", fontSize: 10, fontWeight: 800, margin: "0 0 1px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Junta de Acción Comunal
            </p>
            <p style={{ color: "rgba(255,255,255,0.9)", fontSize: 10, fontWeight: 700, margin: "0 0 3px" }}>Barrio Las Gaviotas</p>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 9, margin: 0 }}>Cartagena de Indias, Bolívar</p>
          </div>
          {/* Logo JAC Las Gaviotas */}
          <div style={{ width: 62, height: 62, borderRadius: 10, background: "white", display: "flex", alignItems: "center", justifyContent: "center", padding: 3, overflow: "hidden", flexShrink: 0 }}>
            <img src={logoJAC} alt="JAC Las Gaviotas" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
        </div>
        {/* Resolución / NIT */}
        <div style={{ textAlign: "center", marginTop: 8 }}>
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 11.5, fontWeight: 700, margin: 0, letterSpacing: "0.03em" }}>
            Resolución No. {settings.resolutionNumber} · NIT {settings.nit}
          </p>
        </div>
      </div>

      {/* ── Título del documento ── */}
      <div style={{ background: TEAL + "12", borderBottom: `1px solid ${TEAL}30`, padding: "10px 18px", textAlign: "center" }}>
        <p style={{ fontSize: 13, fontWeight: 800, color: TEAL, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 2px", fontFamily: "'Fraunces', serif" }}>
          Certificado de Vecindad
        </p>
        <p style={{ fontSize: 11, fontWeight: 700, color: TEAL + "CC", margin: 0 }}>No. {cert.consecutive}</p>
      </div>

      {/* ── Cuerpo ── */}
      <div style={{ padding: "16px 18px", fontFamily: "'Outfit', sans-serif" }}>

        {/* Encabezado cuerpo */}
        <p style={{ fontSize: 11.5, fontWeight: 800, color: "#162323", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "center", margin: "0 0 12px", lineHeight: 1.4 }}>
          El Presidente de la Junta de Acción Comunal<br />
          <span style={{ fontSize: 10, fontWeight: 700, color: "#6B7A7A" }}>del Barrio Las Gaviotas</span>
        </p>

        <p style={{ fontSize: 12, fontWeight: 800, color: TEAL, textTransform: "uppercase", letterSpacing: "0.1em", textAlign: "center", margin: "0 0 14px" }}>
          Certifica:
        </p>

        {/* Párrafo 1 */}
        <p style={{ fontSize: 12, color: "#162323", lineHeight: 1.8, margin: "0 0 12px", textAlign: "justify" }}>
          Que el(la) señor(a){" "}
          <strong style={{ color: TEAL }}>{cert.fullName.toUpperCase()}</strong>
          {", "}identificado(a) con{" "}
          <strong>{cert.docType}</strong> No.{" "}
          <strong>{cert.docNumber}</strong>
          {docGen ? ` expedida en ${docGen}` : ""}
          {", "}reside en este barrio en la dirección{" "}
          <strong>{cert.address}</strong>
          {", "}en calidad de{" "}
          <strong>{cert.quality.toLowerCase()}</strong>
          {", desde hace aproximadamente "}
          <strong>{cert.residenceTime}</strong>.
        </p>

        {/* Párrafo 2 */}
        <p style={{ fontSize: 12, color: "#162323", lineHeight: 1.8, margin: "0 0 12px", textAlign: "justify" }}>
          {settings.certTextP2 || "Que, según la información y los soportes aportados por el(la) interesado(a), y hasta la fecha de expedición, se le reconoce como vecino(a) de esta comunidad."}
        </p>

        {/* Párrafo 3 — expedición */}
        <p style={{ fontSize: 12, color: "#162323", lineHeight: 1.8, margin: "0 0 14px", textAlign: "justify" }}>
          El presente certificado se expide a solicitud del(la) interesado(a), con destino a{" "}
          <strong>{cert.purpose.toLowerCase()}</strong>
          {", en Cartagena de Indias, a los "}
          <strong>{day}</strong> días del mes de <strong>{month}</strong> de <strong>{year}</strong>.
        </p>

        {/* Vigencia */}
        <div style={{ background: "#F0FAF5", border: `1px solid ${TEAL}40`, borderRadius: 10, padding: "9px 12px", marginBottom: 16 }}>
          <p style={{ fontSize: 11.5, color: "#0A4F4F", fontWeight: 700, margin: 0, textAlign: "center" }}>
            Vigencia: treinta (30) días calendario a partir de su expedición.
          </p>
        </div>

        {/* Firma + QR */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14, gap: 12 }}>
          {/* Firma */}
          <div style={{ flex: 1 }}>
            {/* Espacio de firma: imagen si está subida, espacio en blanco si no */}
            <div style={{ height: 56, display: "flex", alignItems: "flex-end", marginBottom: 4 }}>
              {settings.presidentSignature ? (
                <img
                  src={settings.presidentSignature}
                  alt="Firma del presidente"
                  style={{ maxHeight: 56, maxWidth: 180, objectFit: "contain", display: "block" }}
                />
              ) : (
                <div style={{ width: "70%", height: 1, background: "#162323" }} />
              )}
            </div>
            {/* Nombre siempre visible en texto */}
            <p style={{ fontSize: 12, fontWeight: 800, color: "#162323", margin: "0 0 1px", fontFamily: "'Fraunces', serif" }}>
              {settings.presidentName}
            </p>
            <p style={{ fontSize: 10.5, fontWeight: 600, color: "#6B7A7A", margin: "0 0 2px" }}>
              Presidente – JAC Barrio Las Gaviotas
            </p>
            <p style={{ fontSize: 10, color: TEAL, margin: 0 }}>{settings.presidentEmail}</p>
          </div>
          {/* QR */}
          {qrUrl && (
            <div style={{ textAlign: "center", flexShrink: 0 }}>
              <img src={qrUrl} alt="QR verificación" style={{ width: 76, height: 76, display: "block", borderRadius: 6 }} />
              <p style={{ fontSize: 8.5, color: "#6B7A7A", margin: "3px 0 0", lineHeight: 1.3 }}>Escanear para<br />verificar</p>
            </div>
          )}
        </div>

        {/* Nota verificación */}
        <div style={{ background: "#F5F5F5", borderRadius: 8, padding: "8px 10px", marginBottom: 10 }}>
          <p style={{ fontSize: 9.5, color: "#6B7A7A", margin: 0, lineHeight: 1.5, textAlign: "center" }}>
            Verifique la autenticidad del certificado <strong style={{ color: "#162323" }}>{cert.consecutive}</strong>{" "}
            escaneando el código QR con la cámara del celular ({verifyUrl}).
          </p>
        </div>

        {/* Disclaimer */}
        <p style={{ fontSize: 9, color: "#9CA3AF", textAlign: "center", margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>
          {settings.certTextDisclaimer || "Este certificado se expide con base en la información suministrada por el(la) solicitante, quien responde por su veracidad. Cualquier alteración lo invalida."} · Ley 1581 de 2012.
        </p>
      </div>
    </div>

    {/* Download button */}
    <button
      onClick={downloadPDF}
      disabled={downloading}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        width: "100%", maxWidth: 420, margin: "14px auto 0",
        padding: "14px", borderRadius: 14,
        background: downloading ? "#6B7A7A" : `linear-gradient(135deg, ${TEAL}, #0A4F4F)`,
        color: "white", fontWeight: 700, fontSize: 15,
        border: "none", cursor: downloading ? "not-allowed" : "pointer",
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      {downloading ? (
        <>⏳ Generando PDF...</>
      ) : (
        <>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 3v13M7 11l5 5 5-5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M4 20h16" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
          </svg>
          Descargar certificado en PDF
        </>
      )}
    </button>
    </div>
  );
}

const DEMO_CERT: CertificateRequest = {
  id: "demo",
  consecutive: "CV-2026-0001",
  createdAt: new Date().toISOString(),
  status: "Aprobada",
  approvedAt: new Date().toISOString(),
  fullName: "Mario Imbett",
  docType: "Cédula de ciudadanía",
  docNumber: "7918527",
  docPlace: "Cartagena de Indias",
  address: "Calle 30 # 15-42, Urbanización Las Gaviotas",
  residenceTime: "5 años",
  quality: "Propietario",
  purpose: "Trámite bancario",
  phone: "300 000 0000",
  email: "mario.imbett@correo.com",
  photoCedulaFront: "",
  photoCedulaBack: "",
  photoRecibo: "",
};

export default function CertificateAdmin() {
  const [certs, setCerts] = useState<CertificateRequest[]>([]);
  const [filter, setFilter] = useState<CertStatus | "Todas">("Todas");
  const [selected, setSelected] = useState<CertificateRequest | null>(null);
  const [comment, setComment] = useState("");
  const [showCert, setShowCert] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  useEffect(() => {
    setCerts(store.getCertificates().slice().reverse());
  }, []);

  function refresh() {
    const fresh = store.getCertificates().slice().reverse();
    setCerts(fresh);
    if (selected) {
      setSelected(fresh.find((c) => c.id === selected.id) ?? null);
    }
  }

  function updateStatus(status: CertStatus) {
    if (!selected) return;
    setSaving(true);
    setTimeout(() => {
      const all = store.getCertificates().map((c) =>
        c.id === selected.id
          ? { ...c, status, adminComment: comment || undefined, approvedAt: status === "Aprobada" ? new Date().toISOString() : c.approvedAt }
          : c
      );
      store.setCertificates(all);
      refresh();
      setSaving(false);
      setComment("");
    }, 400);
  }

  const filtered = filter === "Todas" ? certs : certs.filter((c) => c.status === filter);

  if (selected) {
    const meta = STATUS_META[selected.status];
    return (
      <div>
        <button onClick={() => { setSelected(null); setShowCert(false); }}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: TEAL, fontSize: 14, fontWeight: 600, cursor: "pointer", padding: "0 0 16px" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M11 6l-6 6 6 6" stroke={TEAL} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Lista de solicitudes
        </button>

        <div style={{ background: meta.bg, borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 20 }}>{meta.emoji}</span>
          <div>
            <p style={{ fontSize: 13, fontWeight: 800, color: meta.color, margin: 0 }}>{selected.status}</p>
            <p style={{ fontSize: 12, color: meta.color, margin: 0 }}>{selected.consecutive}</p>
          </div>
        </div>

        <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 17, fontWeight: 700, color: "#162323", margin: "0 0 12px" }}>Datos del solicitante</h3>
        <Row label="Nombre" value={selected.fullName} />
        <Row label="Documento" value={`${selected.docType} ${selected.docNumber}`} />
        <Row label="Dirección" value={selected.address} />
        <Row label="Tiempo residencia" value={selected.residenceTime} />
        <Row label="Calidad" value={selected.quality} />
        <Row label="Propósito" value={selected.purpose} />
        <Row label="Teléfono" value={selected.phone} />
        <Row label="Correo" value={selected.email} />
        <Row label="Enviada" value={new Date(selected.createdAt).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })} />

        {/* Photos */}
        <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 700, color: "#162323", margin: "16px 0 10px" }}>Documentos adjuntos</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
          {[
            { label: "Cédula frontal", img: selected.photoCedulaFront },
            { label: "Cédula posterior", img: selected.photoCedulaBack },
            { label: "Recibo", img: selected.photoRecibo },
            ...(selected.photoContrato ? [{ label: "Contrato", img: selected.photoContrato }] : []),
            ...(selected.photoSelfie ? [{ label: "Selfie", img: selected.photoSelfie }] : []),
          ].map(({ label, img }) => (
            <div key={label} style={{ width: 90 }}>
              <img src={img} alt={label} style={{ width: 90, height: 68, objectFit: "cover", borderRadius: 10, border: "1.5px solid #E2DAD0", display: "block" }} />
              <p style={{ fontSize: 10, color: "#6B7A7A", textAlign: "center", margin: "3px 0 0" }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Comment */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#6B7A7A", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>Comentario (opcional)</label>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3}
            placeholder="Escribe un mensaje para el solicitante..."
            style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #E2DAD0", fontSize: 13, fontFamily: "'Outfit', sans-serif", resize: "vertical", outline: "none", boxSizing: "border-box" }} />
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          <button onClick={() => updateStatus("En revisión")} disabled={saving}
            style={{ flex: 1, padding: "11px 8px", borderRadius: 12, background: "#F3EEF9", color: "#7B4FBF", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer", minWidth: 100 }}>
            🔍 En revisión
          </button>
          <button onClick={() => updateStatus("Requiere corrección")} disabled={saving}
            style={{ flex: 1, padding: "11px 8px", borderRadius: 12, background: "#FEF3C7", color: "#D97706", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer", minWidth: 100 }}>
            ✏️ Pedir corrección
          </button>
          <button onClick={() => updateStatus("Rechazada")} disabled={saving}
            style={{ flex: 1, padding: "11px 8px", borderRadius: 12, background: "#FEE2E2", color: "#DC2626", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer", minWidth: 100 }}>
            ❌ Rechazar
          </button>
        </div>

        <button onClick={() => updateStatus("Aprobada")} disabled={saving}
          style={{ width: "100%", padding: "14px", borderRadius: 14, background: saving ? "#6B7A7A" : `linear-gradient(135deg, #16A34A, #15803D)`, color: "white", fontWeight: 700, fontSize: 15, border: "none", cursor: saving ? "not-allowed" : "pointer", marginBottom: 12 }}>
          {saving ? "Guardando..." : "✅ Aprobar solicitud"}
        </button>

        {selected.status === "Aprobada" && (
          <button onClick={() => setShowCert(!showCert)}
            style={{ width: "100%", padding: "14px", borderRadius: 14, background: "transparent", color: TEAL, fontWeight: 700, fontSize: 15, border: `1.5px solid ${TEAL}`, cursor: "pointer", marginBottom: 16 }}>
            {showCert ? "Ocultar certificado" : "📄 Ver certificado"}
          </button>
        )}

        {showCert && selected.status === "Aprobada" && (
          <div style={{ marginTop: 8 }}>
            <CertificatePreview cert={selected} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 700, color: "#162323", margin: "0 0 10px" }}>
        Solicitudes de certificado
      </h3>

      {/* Demo preview */}
      <button onClick={() => setShowDemo(!showDemo)}
        style={{ width: "100%", padding: "11px", borderRadius: 12, background: showDemo ? "#F0EBE3" : `linear-gradient(135deg, ${TEAL}22, ${TEAL}10)`, border: `1.5px dashed ${TEAL}`, color: TEAL, fontWeight: 700, fontSize: 13, cursor: "pointer", marginBottom: 16 }}>
        {showDemo ? "🙈 Ocultar vista previa de muestra" : "👁 Ver certificado de muestra — Mario Imbett"}
      </button>
      {showDemo && (
        <div style={{ marginBottom: 20 }}>
          <CertificatePreview cert={DEMO_CERT} />
        </div>
      )}


      {/* Filter */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        {(["Todas", ...ALL_STATUSES] as const).map((s) => {
          const active = filter === s;
          const meta = s !== "Todas" ? STATUS_META[s] : null;
          return (
            <button key={s} onClick={() => setFilter(s as any)}
              style={{ padding: "6px 12px", borderRadius: 100, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700,
                background: active ? (meta ? meta.bg : TEAL + "20") : "#F0EBE3",
                color: active ? (meta ? meta.color : TEAL) : "#6B7A7A" }}>
              {s !== "Todas" && meta ? `${meta.emoji} ` : ""}{s === "Todas" ? `Todas (${certs.length})` : s}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "32px 20px" }}>
          <p style={{ fontSize: 36, margin: "0 0 12px" }}>📭</p>
          <p style={{ fontSize: 14, color: "#6B7A7A" }}>No hay solicitudes {filter !== "Todas" ? `con estado "${filter}"` : ""}.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((c) => {
            const meta = STATUS_META[c.status];
            return (
              <button key={c.id} onClick={() => { setSelected(c); setComment(""); setShowCert(false); }}
                style={{ background: "white", border: "1px solid #E2DAD0", borderRadius: 14, padding: "13px 14px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", textAlign: "left" }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: meta.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                  {meta.emoji}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 800, color: "#162323", margin: "0 0 1px", fontFamily: "'Fraunces', serif" }}>{c.consecutive}</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#162323", margin: "0 0 3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.fullName}</p>
                  <span style={{ fontSize: 11, fontWeight: 700, color: meta.color, background: meta.bg, padding: "2px 8px", borderRadius: 100 }}>{c.status}</span>
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
