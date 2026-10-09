// Botón de ojito para mostrar u ocultar una contraseña.
// Se coloca dentro de un contenedor con position: relative, sobre el borde derecho del input.
export default function EyeToggle({ visible, onToggle, color = "#6B7A7A" }: { visible: boolean; onToggle: () => void; color?: string }) {
  const label = visible ? "Ocultar contraseña" : "Mostrar contraseña";
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      title={label}
      style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color, padding: 0 }}
    >
      {visible ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
      )}
    </button>
  );
}
