import { useEffect, useState } from "react";
import { supabase } from "./supabase";

const TEAL = "#0D6E6E";

type Result = { consecutive: string; full_name: string; doc_masked: string; status: string; approved_at: string | null };

// Página pública para comprobar si un certificado de vecindad es auténtico.
// Se abre desde el código QR del certificado: /verificar/{id}
export default function VerifyScreen({ certId }: { certId: string }) {
  const [state, setState] = useState<"loading" | "valid" | "invalid" | "error">("loading");
  const [cert, setCert] = useState<Result | null>(null);

  useEffect(() => {
    if (!/^[0-9a-f-]{36}$/i.test(certId)) { setState("invalid"); return; }
    supabase.rpc("verify_certificate", { cert_id: certId }).then(({ data, error }) => {
      if (error) { setState("error"); return; }
      const row = (data as Result[] | null)?.[0];
      if (row) { setCert(row); setState("valid"); } else setState("invalid");
    });
  }, [certId]);

  const box: React.CSSProperties = { background: "white", borderRadius: 20, padding: 28, maxWidth: 420, width: "100%", boxShadow: "0 8px 30px rgba(0,0,0,0.08)", textAlign: "center" };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "#FAF6F0", fontFamily: "'Outfit', system-ui, sans-serif", color: "#162323" }}>
      <div style={box}>
        <p style={{ margin: "0 0 4px", fontSize: 12, letterSpacing: "0.08em", color: "#6B7A7A", textTransform: "uppercase" }}>JAC Barrio Las Gaviotas · Cartagena</p>
        <h1 style={{ margin: "0 0 20px", fontSize: 22, color: TEAL }}>Verificación de certificado</h1>

        {state === "loading" && <p>Verificando…</p>}

        {state === "valid" && cert && (
          <>
            <div style={{ fontSize: 48, marginBottom: 8 }}>✅</div>
            <p style={{ fontWeight: 700, fontSize: 18, color: "#16A34A", margin: "0 0 16px" }}>Certificado auténtico</p>
            <div style={{ textAlign: "left", background: "#F0F7F7", borderRadius: 12, padding: 16, fontSize: 14, lineHeight: 1.8 }}>
              <div><strong>Número:</strong> {cert.consecutive}</div>
              <div><strong>A nombre de:</strong> {cert.full_name}</div>
              <div><strong>Documento:</strong> {cert.doc_masked}</div>
              {cert.approved_at && <div><strong>Expedido:</strong> {new Date(cert.approved_at).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}</div>}
            </div>
            <p style={{ fontSize: 12, color: "#6B7A7A", marginTop: 14 }}>Compare estos datos con el documento impreso. Si no coinciden, el documento fue alterado.</p>
          </>
        )}

        {state === "invalid" && (
          <>
            <div style={{ fontSize: 48, marginBottom: 8 }}>⚠️</div>
            <p style={{ fontWeight: 700, fontSize: 18, color: "#DC2626", margin: "0 0 8px" }}>Certificado no válido</p>
            <p style={{ fontSize: 14, color: "#6B7A7A" }}>No existe un certificado aprobado con este código. Comuníquese con la JAC Las Gaviotas.</p>
          </>
        )}

        {state === "error" && <p style={{ color: "#DC2626" }}>No se pudo verificar en este momento. Revise su conexión e intente de nuevo.</p>}
      </div>
    </div>
  );
}
