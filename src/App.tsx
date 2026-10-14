import { useState, useEffect, createContext, useContext } from "react";
import MapScreen from "./MapScreen";
import ChatScreen from "./ChatScreen";
import AdminPanel from "./AdminPanel";
import CertificateScreen from "./CertificateScreen";
import LostFoundScreen from "./LostFoundScreen";
import OfficiosScreen from "./OfficiosScreen";
import { store } from "./store";
import EyeToggle from "./EyeToggle";

// ── Types ──────────────────────────────────────────────────────────────────
type Screen = "home" | "news" | "events" | "directory" | "more";
type SubScreen = "contact" | "gallery" | "about" | "privacy" | "participate" | "notifications" | "map" | "chat" | "certificate" | "lostfound" | "oficios" | null;
type AuthView = "splash" | "login" | "register" | "recover" | "newPassword" | "app";

interface User { name: string; email: string; }
interface Notification { id: number; icon: string; title: string; body: string; time: string; read: boolean; }

// ── Theme Context ──────────────────────────────────────────────────────────
interface Theme {
  dark: boolean;
  bg: string; card: string; border: string; ink: string; muted: string;
  surface: string; inputBg: string;
}

const ThemeCtx = createContext<{ theme: Theme; toggle: () => void }>({
  theme: { dark: false, bg: "#F4F8FC", card: "#FFFFFF", border: "#D6E2EE", ink: "#0E2238", muted: "#5B6B7F", surface: "#E9F0F7", inputBg: "#FFFFFF" },
  toggle: () => {},
});
const useTheme = () => useContext(ThemeCtx);

function makeTheme(dark: boolean): Theme {
  return dark
    ? { dark, bg: "#0A1626", card: "#122136", border: "#22344D", ink: "#EEF4FA", muted: "#8AA0BA", surface: "#1A2B42", inputBg: "#1A2B42" }
    : { dark, bg: "#F4F8FC", card: "#FFFFFF", border: "#D6E2EE", ink: "#0E2238", muted: "#5B6B7F", surface: "#E9F0F7", inputBg: "#FFFFFF" };
}

// ── Brand Colors (always) ──────────────────────────────────────────────────
const TEAL = "#0060A8";
const CORAL = "#0088CC";

// ── Static notifications (admin panel doesn't manage these yet) ────────────
const NOTIFICATIONS_DATA: Notification[] = [
  { id: 1, icon: "📢", title: "Corte de agua mañana", body: "El 13 de septiembre habrá suspensión del servicio en el sector norte de 8 a.m. a 4 p.m.", time: "Hace 2 horas", read: false },
  { id: 2, icon: "📅", title: "Evento este domingo", body: "Jornada de limpieza del Parque Central — 14 sep a las 7:00 a.m. ¡Anímate a participar!", time: "Hace 5 horas", read: false },
  { id: 3, icon: "🌱", title: "Nuevo proyecto aprobado", body: "La Alcaldía aprobó el presupuesto para la cancha sintética de la urbanización.", time: "Ayer", read: true },
  { id: 4, icon: "📋", title: "Encuesta activa", body: "¿Cómo calificarías la seguridad de la urbanización? Tu opinión es importante.", time: "Hace 2 días", read: true },
  { id: 5, icon: "🎓", title: "Becas SENA disponibles", body: "Se abrieron 40 cupos de formación técnica gratuita para jóvenes de Las Gaviotas.", time: "Hace 3 días", read: true },
];

// ── Shared Components ──────────────────────────────────────────────────────
function Badge({ text, color = TEAL }: { text: string; color?: string }) {
  return (
    <span style={{ background: color + "22", color, fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 100, letterSpacing: "0.04em", textTransform: "uppercase" as const }}>
      {text}
    </span>
  );
}

// Logo de la JAC Urbanización Las Gaviotas (public/logo-app.png)
function AppLogo({ size, radius, style }: { size: number; radius: number; style?: React.CSSProperties }) {
  return (
    <div style={{ width: size, height: size, borderRadius: radius, background: "#FFFFFF", overflow: "hidden", flexShrink: 0, ...style }}>
      <img src="/logo-app.png" alt="JAC Las Gaviotas" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
    </div>
  );
}

function Card({ children, style, onClick }: { children: React.ReactNode; style?: React.CSSProperties; onClick?: () => void }) {
  const { theme } = useTheme();
  return (
    <div onClick={onClick} style={{ background: theme.card, borderRadius: 16, border: `1px solid ${theme.border}`, overflow: "hidden", cursor: onClick ? "pointer" : undefined, ...style }}>
      {children}
    </div>
  );
}

// Medallón circular con el emblema de la JAC
function Medallion({ size }: { size: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", padding: Math.max(2, size * 0.05), flexShrink: 0,
      background: "linear-gradient(145deg, rgba(255,255,255,0.95), rgba(127,211,245,0.6))", boxShadow: "0 0 0 1px rgba(255,255,255,0.18), 0 6px 18px rgba(0,0,0,0.35)" }}>
      <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "#FFFFFF", padding: size * 0.07, boxSizing: "border-box" as const }}>
        <img src="/emblema.png" alt="" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
      </div>
    </div>
  );
}

// Encabezado de las pantallas de acceso: medallón con el emblema de la JAC sobre azul profundo
function AuthHeader({ title, subtitle, compact = false }: { title: string; subtitle: string; compact?: boolean }) {
  const { theme } = useTheme();
  // En pantallas bajitas (iPhone SE) se achica más para que el formulario quepa completo
  const tiny = compact && typeof window !== "undefined" && window.innerHeight < 720;
  const m = tiny ? 0.58 : compact ? 0.74 : 1;
  const line = (dir: "l" | "r") => (
    <span style={{ display: "block", width: 46, height: 1, background: dir === "l" ? "linear-gradient(90deg, transparent, #7FD3F5)" : "linear-gradient(90deg, #7FD3F5, transparent)" }} />
  );
  return (
    <div style={{ position: "relative" as const, overflow: "hidden", textAlign: "center" as const,
      background: "radial-gradient(90% 60% at 50% 22%, rgba(127,211,245,0.22) 0%, rgba(127,211,245,0) 60%), linear-gradient(180deg, #00163D 0%, #002A66 55%, #003C86 100%)",
      padding: `calc(env(safe-area-inset-top, 0px) + ${tiny ? 14 : compact ? 22 : 44}px) 24px 0` }}>
      {/* Medallón */}
      <div style={{ width: 124 * m, height: 124 * m, margin: `0 auto ${compact ? 14 : 22}px`, borderRadius: "50%", padding: 5,
        background: "linear-gradient(145deg, rgba(255,255,255,0.95), rgba(127,211,245,0.55))",
        boxShadow: "0 0 0 8px rgba(127,211,245,0.10), 0 0 0 9px rgba(255,255,255,0.22), 0 22px 48px rgba(0,10,40,0.55)" }}>
        <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "#FFFFFF", padding: 8, boxSizing: "border-box" as const }}>
          <img src="/emblema.png" alt="JAC Urbanización Las Gaviotas" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
        </div>
      </div>
      {!tiny && <p style={{ margin: `0 0 ${compact ? 6 : 10}px`, fontSize: 10.5, fontWeight: 600, letterSpacing: "0.3em", color: "#9CCBEA", textTransform: "uppercase" as const }}>
        JAC · Urbanización Las Gaviotas
      </p>}
      <h2 style={{ fontFamily: "'Fraunces', serif", color: "#FFFFFF", fontSize: compact ? 30 : 36, fontWeight: 600, margin: `0 0 ${compact ? 8 : 12}px`, letterSpacing: "-0.015em", lineHeight: 1.05 }}>{title}</h2>
      {!tiny && <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: compact ? 8 : 12 }} aria-hidden="true">
        {line("l")}
        <img src="/gaviota.png" alt="" style={{ width: 22, height: 22, opacity: 0.9 }} />
        {line("r")}
      </div>}
      <p style={{ color: "#CFE6F7", fontSize: 14.5, margin: "0 auto", maxWidth: 290, lineHeight: 1.5, letterSpacing: "0.01em" }}>{subtitle}</p>
      {/* Curva suave hacia el formulario */}
      <svg viewBox="0 0 390 80" preserveAspectRatio="none" aria-hidden="true" style={{ display: "block", width: "calc(100% + 48px)", height: tiny ? 44 : compact ? 56 : 80, margin: `${tiny ? 8 : compact ? 14 : 26}px -24px 0` }}>
        <path d="M0,40 Q195,92 390,40 L390,80 L0,80 Z" fill="#7FD3F5" opacity="0.18" />
        <path d="M0,52 Q195,100 390,52 L390,80 L0,80 Z" fill={theme.bg} />
      </svg>
    </div>
  );
}

const FIELD_ICONS: Record<string, React.ReactNode> = {
  email: <path d="M4 6h16v12H4z M4 7l8 6 8-6" />,
  password: <><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
  tel: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />,
  text: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
};

function InputField({ label, type = "text", placeholder, value, onChange }: { label: string; type?: string; placeholder: string; value: string; onChange: (v: string) => void }) {
  const { theme } = useTheme();
  const [showPwd, setShowPwd] = useState(false);
  const [focused, setFocused] = useState(false);
  const isPwd = type === "password";
  const icon = FIELD_ICONS[type] ?? FIELD_ICONS.text;
  return (
    <div>
      <label style={{ fontSize: 13, fontWeight: 600, color: theme.ink, display: "block", marginBottom: 7 }}>{label}</label>
      <div style={{ position: "relative" as const }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={focused ? TEAL : theme.muted} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
          style={{ position: "absolute" as const, left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" as const }}>{icon}</svg>
        <input type={isPwd && showPwd ? "text" : type} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{ width: "100%", boxSizing: "border-box" as const, padding: isPwd ? "14px 46px 14px 44px" : "14px 16px 14px 44px", borderRadius: 14, border: `1.5px solid ${focused ? TEAL : theme.border}`, boxShadow: focused ? `0 0 0 4px ${TEAL}1F` : "none", fontSize: 15, fontFamily: "'Outfit', sans-serif", outline: "none", background: theme.inputBg, color: theme.ink, transition: "border-color .15s, box-shadow .15s" }} />
        {isPwd && <EyeToggle visible={showPwd} onToggle={() => setShowPwd((v) => !v)} color={theme.muted} />}
      </div>
    </div>
  );
}

function BackButton({ onBack, label = "Volver" }: { onBack: () => void; label?: string }) {
  return (
    <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: TEAL, fontSize: 14, fontWeight: 600, cursor: "pointer", padding: "0 0 16px" }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M11 6l-6 6 6 6" stroke={TEAL} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      {label}
    </button>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  return <h2 style={{ fontSize: 13, fontWeight: 700, color: theme.muted, textTransform: "uppercase" as const, letterSpacing: "0.06em", margin: "0 0 10px" }}>{children}</h2>;
}

// ── Icons ──────────────────────────────────────────────────────────────────
function IconHome({ active }: { active: boolean }) {
  return <svg width="27" height="27" viewBox="0 0 24 24" fill="none"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" fill={active ? TEAL : "none"} stroke={active ? TEAL : "#8AA0BA"} strokeWidth="1.8" strokeLinejoin="round" /><path d="M9 21V12h6v9" stroke={active ? "white" : "#8AA0BA"} strokeWidth="1.8" strokeLinecap="round" /></svg>;
}
function IconNews({ active }: { active: boolean }) {
  const c = active ? TEAL : "#8AA0BA";
  return <svg width="27" height="27" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="2" stroke={c} strokeWidth="1.8" fill={active ? TEAL + "22" : "none"} /><line x1="7" y1="9" x2="17" y2="9" stroke={c} strokeWidth="1.8" strokeLinecap="round" /><line x1="7" y1="13" x2="14" y2="13" stroke={c} strokeWidth="1.8" strokeLinecap="round" /><line x1="7" y1="17" x2="11" y2="17" stroke={c} strokeWidth="1.8" strokeLinecap="round" /></svg>;
}
function IconEvents({ active }: { active: boolean }) {
  const c = active ? TEAL : "#8AA0BA";
  return <svg width="27" height="27" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="16" rx="2" stroke={c} strokeWidth="1.8" fill={active ? TEAL + "22" : "none"} /><line x1="16" y1="3" x2="16" y2="7" stroke={c} strokeWidth="1.8" strokeLinecap="round" /><line x1="8" y1="3" x2="8" y2="7" stroke={c} strokeWidth="1.8" strokeLinecap="round" /><line x1="3" y1="10" x2="21" y2="10" stroke={c} strokeWidth="1.8" /><circle cx="12" cy="15" r="2" fill={active ? TEAL : "#8AA0BA"} /></svg>;
}
function IconDirectory({ active }: { active: boolean }) {
  const c = active ? TEAL : "#8AA0BA";
  return <svg width="27" height="27" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="8" r="3" stroke={c} strokeWidth="1.8" fill={active ? TEAL + "22" : "none"} /><path d="M3 20c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke={c} strokeWidth="1.8" strokeLinecap="round" /><line x1="16" y1="8" x2="21" y2="8" stroke={c} strokeWidth="1.8" strokeLinecap="round" /><line x1="16" y1="12" x2="21" y2="12" stroke={c} strokeWidth="1.8" strokeLinecap="round" /><line x1="16" y1="16" x2="21" y2="16" stroke={c} strokeWidth="1.8" strokeLinecap="round" /></svg>;
}
function IconMore({ active }: { active: boolean }) {
  const c = active ? TEAL : "#8AA0BA";
  return <svg width="27" height="27" viewBox="0 0 24 24" fill="none"><circle cx="5" cy="12" r="1.8" fill={c} /><circle cx="12" cy="12" r="1.8" fill={c} /><circle cx="19" cy="12" r="1.8" fill={c} /></svg>;
}

function StarIcon({ filled }: { filled: boolean }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? CORAL : "none"} stroke={CORAL} strokeWidth="1.8"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>;
}

function BellIcon({ unread, color = "#8AA0BA" }: { unread: number; color?: string }) {
  return (
    <div style={{ position: "relative" as const, display: "flex" }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {unread > 0 && (
        <div style={{ position: "absolute" as const, top: -6, right: -7, width: 16, height: 16, borderRadius: "50%", background: "#E0475B", boxShadow: "0 0 0 2px #00163D", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "white", fontWeight: 800 }}>
          {unread > 9 ? "9+" : unread}
        </div>
      )}
    </div>
  );
}

// ── Auth: Splash ───────────────────────────────────────────────────────────
// Colores del logo de la JAC Urbanización Las Gaviotas
const NAVY = "#003078";
const SKY = "#0078C0";

function SplashScreen({ onNext }: { onNext: (v: "login" | "register" | "app") => void }) {
  return (
    <div style={{ minHeight: "100%", height: "100%", display: "flex", flexDirection: "column" as const, background: "#FFFFFF", overflowY: "auto" as const }}>
      <div style={{ height: "env(safe-area-inset-top, 0px)", background: NAVY, flexShrink: 0 }} />
      {/* Logo y nombre sobre fondo blanco, como el logo */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", padding: "36px 28px 8px", textAlign: "center" as const }}>
        <img src="/logo-app.png" alt="Junta de Acción Comunal Urbanización Las Gaviotas" style={{ width: "min(62vw, 230px)", height: "auto", display: "block", marginBottom: 22 }} />
        <h1 style={{ fontFamily: "'Fraunces', serif", color: NAVY, fontSize: 34, fontWeight: 700, margin: "0 0 8px", lineHeight: 1.1, letterSpacing: "-0.01em" }}>
          Gaviotas <span style={{ color: SKY }}>Conecta</span>
        </h1>
        <p style={{ color: "#3D5A80", fontSize: 15, margin: 0, lineHeight: 1.55, maxWidth: 300 }}>
          La plataforma digital de la Urbanización Las Gaviotas
        </p>
      </div>

      {/* Ola del logo que sostiene las acciones */}
      <div style={{ position: "relative" as const, flexShrink: 0 }}>
        <svg viewBox="0 0 390 70" preserveAspectRatio="none" aria-hidden="true" style={{ display: "block", width: "100%", height: 70 }}>
          <defs>
            <linearGradient id="olaClara" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="#7FD3F5" />
              <stop offset="1" stopColor="#2AA8E0" />
            </linearGradient>
          </defs>
          <path d="M0,38 C70,8 150,8 215,30 C280,52 340,46 390,22 L390,70 L0,70 Z" fill="url(#olaClara)" opacity="0.55" />
          <path d="M0,52 C80,24 160,26 230,44 C295,60 345,56 390,40 L390,70 L0,70 Z" fill={NAVY} />
        </svg>
        <div style={{ background: `linear-gradient(180deg, ${NAVY} 0%, #00245C 100%)`, padding: "6px 28px 28px", marginTop: -1 }}>
          <div style={{ maxWidth: 340, margin: "0 auto", display: "flex", flexDirection: "column" as const, gap: 12 }}>
            <button onClick={() => onNext("login")} style={{ padding: "16px", borderRadius: 14, background: "#FFFFFF", color: NAVY, fontSize: 16, fontWeight: 700, border: "none", cursor: "pointer", boxShadow: "0 10px 30px rgba(0,0,0,0.25)" }}>
              Iniciar sesión
            </button>
            <button onClick={() => onNext("register")} style={{ padding: "16px", borderRadius: 14, background: SKY, color: "#FFFFFF", fontSize: 16, fontWeight: 700, border: "none", cursor: "pointer" }}>
              Crear cuenta
            </button>
            <button onClick={() => onNext("app")} style={{ background: "none", border: "none", color: "#BFDDF2", fontSize: 14, fontWeight: 600, cursor: "pointer", padding: "8px 0 0" }}>
              Explorar sin cuenta →
            </button>
            <p style={{ color: "rgba(191,221,242,0.6)", fontSize: 11, margin: "10px 0 0", textAlign: "center" as const, lineHeight: 1.6 }}>
              Cartagena de Indias · Colombia<br />Versión 1.0 · JAC Urbanización Las Gaviotas
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Auth: Login ────────────────────────────────────────────────────────────
function LoginScreen({ onLogin, onGoRegister, onRecover, onSkip }: { onLogin: (u: User) => void; onGoRegister: () => void; onRecover: () => void; onSkip: () => void }) {
  const { theme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Completa todos los campos."); return; }
    if (!email.includes("@")) { setError("Ingresa un correo válido."); return; }
    if (password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres."); return; }
    setLoading(true);
    const err = await store.signIn(email, password);
    setLoading(false);
    if (err) { setError(err); return; }
    const u = store.currentUser();
    if (u) onLogin(u);
  }

  return (
    <div style={{ height: "100%", overflowY: "auto" as const, background: theme.bg }}>
      <AuthHeader compact title="Bienvenido" subtitle="Inicia sesión en Gaviotas Conecta" />
      <div style={{ padding: "0 20px 20px", marginTop: -26, position: "relative" as const }}>
        <div style={{ background: theme.card, borderRadius: 24, boxShadow: "0 18px 44px rgba(0,36,92,0.12)", border: `1px solid ${theme.border}` }}>
          <form onSubmit={handleSubmit} style={{ padding: "20px 20px 18px", display: "flex", flexDirection: "column" as const, gap: 14 }}>
            <InputField label="Correo electrónico" type="email" placeholder="tucorreo@email.com" value={email} onChange={setEmail} />
            <div>
              <InputField label="Contraseña" type="password" placeholder="Tu contraseña" value={password} onChange={setPassword} />
              <div style={{ textAlign: "right" as const, marginTop: 8 }}>
                <button type="button" onClick={onRecover} style={{ background: "none", border: "none", color: TEAL, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0 }}>
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </div>
            {error && <div role="alert" style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, padding: "10px 14px", fontSize: 13, color: "#B91C1C" }}>{error}</div>}
            <button type="submit" disabled={loading} style={{ padding: "15px", borderRadius: 14, background: loading ? theme.muted : "linear-gradient(135deg, #0060A8 0%, #003078 100%)", color: "white", fontSize: 16, fontWeight: 700, border: "none", cursor: loading ? "not-allowed" : "pointer", boxShadow: loading ? "none" : "0 10px 24px rgba(0,48,120,0.28)", letterSpacing: "0.01em" }}>
              {loading ? "Iniciando sesión…" : "Iniciar sesión"}
            </button>
            <p style={{ textAlign: "center" as const, fontSize: 14, color: theme.muted, margin: 0 }}>
              ¿No tienes cuenta?{" "}
              <button type="button" onClick={onGoRegister} style={{ background: "none", border: "none", color: TEAL, fontWeight: 700, cursor: "pointer", fontSize: 14, padding: 0 }}>Regístrate</button>
            </p>
          </form>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "14px 6px 10px" }}>
          <div style={{ flex: 1, height: 1, background: theme.border }} />
          <span style={{ fontSize: 12, color: theme.muted }}>o</span>
          <div style={{ flex: 1, height: 1, background: theme.border }} />
        </div>
        <button onClick={onSkip} style={{ width: "100%", padding: "13px", borderRadius: 14, background: "transparent", color: TEAL, fontSize: 15, fontWeight: 600, border: `1.5px solid ${TEAL}55`, cursor: "pointer" }}>
          Explorar sin cuenta →
        </button>

        <p style={{ display: "flex", alignItems: "flex-start", justifyContent: "center", gap: 6, textAlign: "center" as const, fontSize: 11.5, color: theme.muted, margin: "14px 8px 0", lineHeight: 1.5 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginTop: 3, flexShrink: 0 }} aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
          <span>Datos protegidos bajo la Ley 1581 de 2012. Al iniciar sesión aceptas los Términos y la Política de Privacidad.</span>
        </p>
      </div>
    </div>
  );
}

// ── Auth: Register ─────────────────────────────────────────────────────────
function RegisterScreen({ onRegister, onGoLogin }: { onRegister: (u: User) => void; onGoLogin: () => void }) {
  const { theme } = useTheme();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const set = (k: string) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.name || !form.email || !form.password) { setError("Completa los campos obligatorios."); return; }
    if (!form.email.includes("@")) { setError("Ingresa un correo válido."); return; }
    if (form.password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres."); return; }
    if (form.password !== form.confirm) { setError("Las contraseñas no coinciden."); return; }
    setLoading(true);
    const err = await store.signUp(form.name, form.email, form.phone, form.password);
    setLoading(false);
    if (err) { setError(err); return; }
    const u = store.currentUser();
    if (u) onRegister(u);
  }

  return (
    <div style={{ height: "100%", overflowY: "auto" as const, background: theme.bg }}>
      <AuthHeader title="Crear cuenta" subtitle="Únete a la Urbanización Las Gaviotas" />
      <div style={{ padding: "0 20px 28px", marginTop: -30, position: "relative" as const }}>
        <Card>
          <form onSubmit={handleSubmit} style={{ padding: "24px 20px", display: "flex", flexDirection: "column" as const, gap: 16 }}>
            <InputField label="Nombre completo *" placeholder="Tu nombre" value={form.name} onChange={set("name")} />
            <InputField label="Correo electrónico *" type="email" placeholder="tucorreo@email.com" value={form.email} onChange={set("email")} />
            <InputField label="Teléfono (opcional)" type="tel" placeholder="300 000 0000" value={form.phone} onChange={set("phone")} />
            <InputField label="Contraseña *" type="password" placeholder="Mínimo 6 caracteres" value={form.password} onChange={set("password")} />
            <InputField label="Confirmar contraseña *" type="password" placeholder="Repite la contraseña" value={form.confirm} onChange={set("confirm")} />
            {error && <div style={{ background: "#FEE2E2", borderRadius: 10, padding: "10px 14px", display: "flex", gap: 8 }}><span>⚠️</span><span style={{ fontSize: 13, color: "#B91C1C" }}>{error}</span></div>}
            <p style={{ fontSize: 12, color: theme.muted, margin: 0, lineHeight: 1.5 }}>
              Al registrarte aceptas nuestra <span style={{ color: TEAL, fontWeight: 600 }}>Política de Privacidad</span> y el tratamiento de tus datos conforme a la Ley 1581 de 2012.
            </p>
            <button type="submit" disabled={loading} style={{ padding: "14px", borderRadius: 12, background: loading ? theme.muted : `linear-gradient(135deg, ${TEAL}, #003078)`, color: "white", fontSize: 15, fontWeight: 700, border: "none", cursor: loading ? "not-allowed" : "pointer" }}>
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </button>
            <p style={{ textAlign: "center" as const, fontSize: 14, color: theme.muted, margin: 0 }}>
              ¿Ya tienes cuenta?{" "}
              <button type="button" onClick={onGoLogin} style={{ background: "none", border: "none", color: TEAL, fontWeight: 700, cursor: "pointer", fontSize: 14 }}>Iniciar sesión</button>
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
}

// ── Auth: Recover Password ─────────────────────────────────────────────────
function RecoverScreen({ onBack }: { onBack: () => void }) {
  const { theme } = useTheme();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!email.includes("@")) { setError("Ingresa un correo válido."); return; }
    setLoading(true);
    const err = await store.sendPasswordReset(email);
    setLoading(false);
    if (err) { setError(err); return; }
    setSent(true);
  }

  return (
    <div style={{ height: "100%", background: theme.bg, overflowY: "auto" as const }}>
      <AuthHeader title="Recuperar contraseña" subtitle="Te enviaremos un enlace a tu correo" />
      <div style={{ padding: "0 20px 28px", marginTop: -30, position: "relative" as const }}>
        {sent ? (
          <Card>
            <div style={{ padding: "32px 20px", textAlign: "center" as const }}>
              <div style={{ fontSize: 44, marginBottom: 14 }}>📧</div>
              <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 700, margin: "0 0 8px", color: theme.ink }}>¡Correo enviado!</h3>
              <p style={{ fontSize: 14, color: theme.muted, margin: "0 0 20px", lineHeight: 1.6 }}>
                Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.
              </p>
              <button onClick={onBack} style={{ padding: "12px 28px", borderRadius: 12, background: TEAL, color: "white", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer" }}>
                Volver al inicio
              </button>
            </div>
          </Card>
        ) : (
          <Card>
            <div style={{ padding: "24px 20px", display: "flex", flexDirection: "column" as const, gap: 16 }}>
              <InputField label="Correo registrado" type="email" placeholder="tucorreo@email.com" value={email} onChange={(v) => { setEmail(v); setError(""); }} />
              {error && <p style={{ color: "#DC2626", fontSize: 13, margin: 0 }}>{error}</p>}
              <button onClick={send} disabled={loading} style={{ padding: "14px", borderRadius: 12, background: `linear-gradient(135deg, ${TEAL}, #003078)`, color: "white", fontSize: 15, fontWeight: 700, border: "none", cursor: "pointer" }}>
                Enviar enlace de recuperación
              </button>
              <button onClick={onBack} style={{ background: "none", border: "none", color: theme.muted, fontSize: 13, cursor: "pointer" }}>
                ← Volver al inicio de sesión
              </button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

// ── Auth: New Password (desde el enlace del correo) ───────────────────────────
function NewPasswordScreen({ onDone }: { onDone: () => void }) {
  const { theme } = useTheme();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function save() {
    if (password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres."); return; }
    if (password !== confirm) { setError("Las contraseñas no coinciden."); return; }
    setLoading(true);
    const err = await store.setNewPassword(password);
    setLoading(false);
    if (err) { setError(err); return; }
    onDone();
  }

  return (
    <div style={{ height: "100%", background: theme.bg, overflowY: "auto" as const }}>
      <AuthHeader title="Nueva contraseña" subtitle="Escribe la contraseña que usarás de ahora en adelante" />
      <div style={{ padding: "0 20px 28px", marginTop: -30, position: "relative" as const }}>
        <Card>
          <div style={{ padding: "24px 20px", display: "flex", flexDirection: "column" as const, gap: 16 }}>
            <InputField label="Nueva contraseña" type="password" placeholder="Mínimo 6 caracteres" value={password} onChange={(v) => { setPassword(v); setError(""); }} />
            <InputField label="Confirmar contraseña" type="password" placeholder="Repite la contraseña" value={confirm} onChange={(v) => { setConfirm(v); setError(""); }} />
            {error && <p style={{ color: "#DC2626", fontSize: 13, margin: 0 }}>{error}</p>}
            <button onClick={save} disabled={loading} style={{ padding: "14px", borderRadius: 12, background: loading ? theme.muted : `linear-gradient(135deg, ${TEAL}, #003078)`, color: "white", fontSize: 15, fontWeight: 700, border: "none", cursor: "pointer" }}>
              {loading ? "Guardando..." : "Guardar contraseña"}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Notifications Panel ────────────────────────────────────────────────────
function NotificationsScreen({ notifications, onMark, onBack }: { notifications: Notification[]; onMark: (id: number) => void; onBack: () => void }) {
  const { theme } = useTheme();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div>
      <div style={{ padding: "24px 20px 0" }}>
        <BackButton onBack={onBack} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 700, margin: 0, color: theme.ink }}>Notificaciones</h1>
          {unread > 0 && (
            <button onClick={() => notifications.forEach((n) => onMark(n.id))} style={{ background: "none", border: "none", color: TEAL, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Marcar todas leídas
            </button>
          )}
        </div>
        {unread > 0 && (
          <div style={{ background: TEAL + "15", borderRadius: 12, padding: "10px 14px", marginBottom: 14, display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 14 }}>🔔</span>
            <span style={{ fontSize: 13, color: TEAL, fontWeight: 600 }}>Tienes {unread} notificación{unread > 1 ? "es" : ""} sin leer</span>
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
          {notifications.map((n) => (
            <Card key={n.id} onClick={() => onMark(n.id)} style={{ opacity: n.read ? 0.7 : 1 }}>
              <div style={{ padding: "14px 16px", display: "flex", gap: 12, alignItems: "flex-start" }}>
                {!n.read && <div style={{ width: 8, height: 8, borderRadius: "50%", background: CORAL, flexShrink: 0, marginTop: 6 }} />}
                <div style={{ width: 40, height: 40, borderRadius: 11, flexShrink: 0, background: n.read ? theme.surface : TEAL + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginLeft: n.read ? 20 : 0 }}>{n.icon}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: n.read ? 500 : 700, margin: "0 0 3px", color: theme.ink }}>{n.title}</p>
                  <p style={{ fontSize: 13, color: theme.muted, margin: "0 0 5px", lineHeight: 1.5 }}>{n.body}</p>
                  <span style={{ fontSize: 11, color: theme.muted }}>{n.time}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
        {notifications.length === 0 && (
          <div style={{ textAlign: "center" as const, padding: "60px 20px", color: theme.muted }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔔</div>
            <p>Sin notificaciones por ahora</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Home Screen ────────────────────────────────────────────────────────────
function EmergencyModal({ onClose, theme }: { onClose: () => void; theme: ReturnType<typeof makeTheme> }) {
  const lines = store.getEmergency();
  return (
    <div style={{ position: "fixed" as const, inset: 0, zIndex: 9999, display: "flex", flexDirection: "column" as const, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div style={{ marginTop: "auto", background: theme.card, borderRadius: "24px 24px 0 0", maxHeight: "82vh", display: "flex", flexDirection: "column" as const }} onClick={(e) => e.stopPropagation()}>
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: theme.border }} />
        </div>
        {/* Header */}
        <div style={{ padding: "8px 20px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${theme.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: CORAL + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🚨</div>
            <div>
              <p style={{ margin: 0, fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 16, color: theme.ink }}>Líneas de Emergencia</p>
              <p style={{ margin: 0, fontSize: 11, color: theme.muted }}>Toca el número para llamar</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: theme.surface, border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke={theme.muted} strokeWidth="2.5" strokeLinecap="round" /></svg>
          </button>
        </div>
        {/* List */}
        <div style={{ overflowY: "auto" as const, padding: "10px 16px 24px", flex: 1 }}>
          {lines.map((e) => (
            <a key={e.num} href={`tel:${e.num}`} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderRadius: 14, marginBottom: 8, background: theme.surface, border: `1px solid ${theme.border}` }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: CORAL + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{e.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: theme.ink }}>{e.label}</p>
                <p style={{ margin: "1px 0 0", fontSize: 11, color: theme.muted }}>{e.desc}</p>
              </div>
              <div style={{ flexShrink: 0, textAlign: "right" as const }}>
                <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: CORAL, fontFamily: "'Fraunces', serif" }}>{e.num}</p>
                <p style={{ margin: "1px 0 0", fontSize: 10, color: TEAL, fontWeight: 600 }}>Llamar →</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function HomeScreen({ user, favorites, onToggleFav, onNotifications, onOpenMap, onOpenChat, onGoNews, onGoEvents, onGoParticipate, onSubScreen }: { user: User | null; favorites: Set<number>; onToggleFav: (id: number) => void; onNotifications: () => void; onOpenMap: () => void; onOpenChat: () => void; onGoNews: () => void; onGoEvents: () => void; onGoParticipate: () => void; onSubScreen: (s: SubScreen) => void; }) {
  const { theme } = useTheme();
  const [showEmergency, setShowEmergency] = useState(false);
  const quickLinks = [
    { icon: "📰", label: "Noticias", color: TEAL, action: onGoNews },
    { icon: "📅", label: "Eventos", color: CORAL, action: onGoEvents },
    { icon: "🗺️", label: "Mapa", color: "#2E86AB", action: onOpenMap },
    { icon: "🤖", label: "Chatbot", color: "#0060A8", action: onOpenChat },
  ];

  const now = new Date();
  const h = now.getHours();
  const saludo = h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
  const fecha = now.toLocaleDateString("es-CO", { day: "numeric", month: "short" }).replace(".", "");
  const firstName = user ? user.name.split(" ")[0] : "";
  const nombre = firstName ? firstName.charAt(0).toUpperCase() + firstName.slice(1) : "";
  const quickIcons: Record<string, React.ReactNode> = {
    Noticias: <><path d="M4 5h13v14H6a2 2 0 0 1-2-2z" /><path d="M17 9h3v8a2 2 0 0 1-2 2" /><path d="M8 9h5M8 13h5" /></>,
    Eventos: <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 10h16" /></>,
    Mapa: <><path d="M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11z" /><circle cx="12" cy="10" r="2.2" /></>,
    Chatbot: <><path d="M5 5h14v10H9l-4 4z" /><path d="M9 10h.01M12 10h.01M15 10h.01" /></>,
  };

  return (
    <div style={{ paddingBottom: 8 }}>
      <div style={{ position: "relative" as const, overflow: "hidden",
        background: "radial-gradient(70% 80% at 85% 10%, rgba(127,211,245,0.20) 0%, rgba(127,211,245,0) 60%), linear-gradient(180deg, #001F4F 0%, #002A66 50%, #003C86 100%)",
        padding: "18px 22px 0" }}>
        {/* Marca de agua: gaviota grande */}
        <img src="/gaviota.png" alt="" aria-hidden="true" style={{ position: "absolute" as const, right: -26, top: 6, width: 190, opacity: 0.07, pointerEvents: "none" as const }} />
        <div style={{ position: "relative" as const, zIndex: 1 }}>
          <p style={{ margin: "0 0 8px", fontSize: 10.5, fontWeight: 600, letterSpacing: "0.26em", color: "#9CCBEA", textTransform: "uppercase" as const }}>
            {saludo} · {fecha}
          </p>
          <h1 style={{ fontFamily: "'Fraunces', serif", color: "#FFFFFF", fontSize: 34, fontWeight: 600, lineHeight: 1.05, margin: "0 0 12px", letterSpacing: "-0.015em" }}>
            {nombre ? <>Hola, <span style={{ color: "#7FD3F5" }}>{nombre}</span></> : <>Bienvenido a <span style={{ color: "#7FD3F5" }}>Las Gaviotas</span></>}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }} aria-hidden="true">
            <span style={{ display: "block", width: 34, height: 1, background: "linear-gradient(90deg, #7FD3F5, transparent)" }} />
            <img src="/gaviota.png" alt="" style={{ width: 20, height: 20, opacity: 0.9 }} />
            <span style={{ display: "block", width: 34, height: 1, background: "linear-gradient(90deg, #7FD3F5, transparent)" }} />
          </div>
          <p style={{ color: "#CFE6F7", fontSize: 14, margin: 0, letterSpacing: "0.01em" }}>Tu comunidad, siempre cerca</p>
        </div>
        <svg viewBox="0 0 390 70" preserveAspectRatio="none" aria-hidden="true" style={{ display: "block", width: "calc(100% + 44px)", height: 70, margin: "22px -22px 0" }}>
          <path d="M0,34 Q195,82 390,34 L390,70 L0,70 Z" fill="#7FD3F5" opacity="0.18" />
          <path d="M0,46 Q195,90 390,46 L390,70 L0,70 Z" fill={theme.bg} />
        </svg>
      </div>

      {/* Accesos rápidos: tarjeta flotante */}
      <div style={{ padding: "0 18px", marginTop: -42, position: "relative" as const, zIndex: 2 }}>
        <div style={{ background: theme.card, borderRadius: 22, border: `1px solid ${theme.border}`, boxShadow: "0 16px 40px rgba(0,36,92,0.14)", padding: "14px 6px", display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
          {quickLinks.map((q, i) => (
            <button key={q.label} onClick={q.action} style={{ background: "none", border: "none", borderLeft: i ? `1px solid ${theme.border}` : "none", padding: "4px 2px", display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 7, cursor: "pointer" }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(145deg, #EAF4FB, #D6E9F7)", boxShadow: "inset 0 0 0 1px rgba(0,96,168,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={TEAL} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{quickIcons[q.label]}</svg>
              </div>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: theme.ink, textAlign: "center" as const, lineHeight: 1.2 }}>{q.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Alert */}
      <div style={{ padding: "14px 20px 0" }}>
        <div style={{ background: "#FEF3C7", borderRadius: 14, padding: "12px 16px", display: "flex", gap: 10, alignItems: "center", border: "1px solid #FCD34D" }}>
          <span style={{ fontSize: 20 }}>📢</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#92400E", margin: 0 }}>Suspensión de agua — 13 sep</p>
            <p style={{ fontSize: 12, color: "#B45309", margin: "2px 0 0" }}>Sector norte, 8 a.m. – 4 p.m.</p>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="#B45309" strokeWidth="2" strokeLinecap="round" /></svg>
        </div>
      </div>

      {/* Latest news */}
      <div style={{ padding: "18px 20px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 19, fontWeight: 600, margin: 0, color: theme.ink }}>Últimas novedades</h2>
          <button onClick={onGoNews} style={{ color: TEAL, fontSize: 13, fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>Ver todo</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
          {store.getNews().slice(0, 3).map((a) => (
            <Card key={a.id}>
              <div style={{ padding: "12px 16px", display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 11, flexShrink: 0, background: a.color + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                  {a.category === "Proyecto" ? "🏗" : a.category === "Comunicado" ? "📢" : "📰"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ marginBottom: 4 }}><Badge text={a.category} color={a.color} /></div>
                  <p style={{ fontSize: 14, fontWeight: 600, margin: "0 0 2px", lineHeight: 1.3, color: theme.ink }}>{a.title}</p>
                  <span style={{ fontSize: 12, color: theme.muted }}>{a.date}</span>
                </div>
                <button onClick={() => onToggleFav(a.id)} style={{ background: "none", border: "none", cursor: "pointer", flexShrink: 0, padding: 2 }}>
                  <StarIcon filled={favorites.has(a.id)} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Community image */}
      <div style={{ padding: "16px 20px 0" }}>
        <Card>
          <div style={{ position: "relative" as const, height: 140, background: "#E6F1FA" }}>
            <img src="https://images.unsplash.com/photo-1519817650390-64a93db51149?w=600&h=280&fit=crop&auto=format" alt="Urbanización Las Gaviotas, Cartagena de Indias" style={{ width: "100%", height: "100%", objectFit: "cover" as const }} />
            <div style={{ position: "absolute" as const, inset: 0, background: "linear-gradient(to top, rgba(0,96,168,0.85) 0%, transparent 50%)" }} />
            <div style={{ position: "absolute" as const, bottom: 12, left: 14 }}>
              <p style={{ color: "white", fontSize: 14, fontWeight: 700, margin: 0, fontFamily: "'Fraunces', serif" }}>Urbanización Las Gaviotas 🏝</p>
              <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, margin: "2px 0 0" }}>Cartagena de Indias, Colombia</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Services grid — all "Más" items */}
      <div style={{ padding: "20px 20px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 19, fontWeight: 600, margin: 0, color: theme.ink }}>Servicios de la urbanización</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 8 }}>
          {[
            { icon: "📋", label: "Certif. vecindad", color: TEAL, action: () => onSubScreen("certificate") },
            { icon: "🐾", label: "Perdidos", color: CORAL, action: () => onSubScreen("lostfound") },
            { icon: "🤖", label: "Asistente", color: TEAL, action: () => onSubScreen("chat") },
            { icon: "🗳️", label: "Participar", color: "#7B4FBF", action: () => onSubScreen("participate") },
            { icon: "💬", label: "Contacto", color: TEAL, action: () => onSubScreen("contact") },
            { icon: "🖼️", label: "Galería", color: "#2E86AB", action: () => onSubScreen("gallery") },
            { icon: "ℹ️", label: "Acerca de", color: "#7B4FBF", action: () => onSubScreen("about") },
            { icon: "🧰", label: "Oficios", color: TEAL, action: () => onSubScreen("oficios") },
          ].map((s) => (
            <button key={s.label} onClick={s.action} style={{
              background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 14,
              padding: "12px 4px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
              cursor: "pointer",
            }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: s.color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                {s.icon}
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: theme.ink, textAlign: "center", lineHeight: 1.2 }}>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "12px 20px 0" }}>
        <button onClick={() => setShowEmergency(true)} style={{ width: "100%", background: `linear-gradient(135deg, ${CORAL} 0%, #C94E25 100%)`, borderRadius: 14, padding: "14px 18px", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 4px 20px rgba(0,136,204,0.35)" }}>
          <span style={{ fontSize: 24 }}>🚨</span>
          <div style={{ flex: 1, textAlign: "left" as const }}>
            <p style={{ color: "white", fontWeight: 700, fontSize: 14, margin: 0 }}>Líneas de Emergencia</p>
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, margin: "2px 0 0" }}>Policía · Bomberos · Ambulancia · Más...</p>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>
      {showEmergency && <EmergencyModal onClose={() => setShowEmergency(false)} theme={theme} />}
    </div>
  );
}

// ── News Screen ────────────────────────────────────────────────────────────
function NewsScreen({ favorites, onToggleFav }: { favorites: Set<number>; onToggleFav: (id: number) => void }) {
  const { theme } = useTheme();
  const [activeFilter, setActiveFilter] = useState("Todas");
  const [showFavs, setShowFavs] = useState(false);
  const filters = ["Todas", "Noticias", "Comunicados", "Proyectos"];

  let filtered = store.getNews();
  if (showFavs) filtered = filtered.filter((i) => favorites.has(i.id));
  else if (activeFilter !== "Todas") {
    filtered = filtered.filter((i) =>
      activeFilter === "Noticias" ? i.category === "Noticia" :
      activeFilter === "Comunicados" ? i.category === "Comunicado" : i.category === "Proyecto"
    );
  }

  return (
    <div>
      <div style={{ padding: "24px 20px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 700, margin: 0, color: theme.ink }}>Noticias</h1>
          <button onClick={() => setShowFavs(!showFavs)} style={{ background: showFavs ? CORAL + "18" : theme.surface, border: `1px solid ${showFavs ? CORAL : theme.border}`, borderRadius: 10, padding: "6px 12px", display: "flex", alignItems: "center", gap: 5, cursor: "pointer", fontSize: 12, fontWeight: 600, color: showFavs ? CORAL : theme.muted }}>
            <StarIcon filled={showFavs} /> Guardados
          </button>
        </div>
        <p style={{ color: theme.muted, fontSize: 14, margin: "0 0 14px" }}>Información actualizada de la urbanización</p>
        {!showFavs && (
          <div style={{ display: "flex", gap: 8, overflowX: "auto" as const, paddingBottom: 4, marginBottom: 2 }}>
            {filters.map((f) => (
              <button key={f} onClick={() => setActiveFilter(f)} style={{ padding: "7px 16px", borderRadius: 100, border: `1.5px solid ${activeFilter === f ? TEAL : theme.border}`, background: activeFilter === f ? TEAL : theme.card, color: activeFilter === f ? "white" : theme.muted, fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" as const, cursor: "pointer" }}>
                {f}
              </button>
            ))}
          </div>
        )}
      </div>
      <div style={{ padding: "14px 20px 0", display: "flex", flexDirection: "column" as const, gap: 14 }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: "center" as const, padding: "48px 20px", color: theme.muted }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>{showFavs ? "⭐" : "🔍"}</div>
            <p>{showFavs ? "No tienes noticias guardadas" : "Sin resultados"}</p>
          </div>
        )}
        {filtered.map((item) => (
          <Card key={item.id}>
            {item.image && <div style={{ height: 150, background: theme.surface, overflow: "hidden" }}><img src={item.image} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" as const }} /></div>}
            <div style={{ padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <Badge text={item.category} color={item.color} />
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 11, color: theme.muted }}>{item.readTime} lectura</span>
                  <button onClick={() => onToggleFav(item.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}><StarIcon filled={favorites.has(item.id)} /></button>
                </div>
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 6px", lineHeight: 1.3, fontFamily: "'Fraunces', serif", color: theme.ink }}>{item.title}</h3>
              <p style={{ fontSize: 13, color: theme.muted, margin: "0 0 10px", lineHeight: 1.5 }}>{item.summary}</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: theme.muted }}>{item.date}</span>
                <div style={{ display: "flex", gap: 10 }}>
                  <button style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="18" cy="5" r="3" stroke={theme.muted} strokeWidth="1.8" /><circle cx="6" cy="12" r="3" stroke={theme.muted} strokeWidth="1.8" /><circle cx="18" cy="19" r="3" stroke={theme.muted} strokeWidth="1.8" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" stroke={theme.muted} strokeWidth="1.8" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" stroke={theme.muted} strokeWidth="1.8" /></svg>
                  </button>
                  <button style={{ background: "none", border: "none", color: TEAL, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}>
                    Leer <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke={TEAL} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── Events Screen ──────────────────────────────────────────────────────────
function EventsScreen({ favorites, onToggleFav }: { favorites: Set<number>; onToggleFav: (id: number) => void }) {
  const { theme } = useTheme();
  const [selectedDay, setSelectedDay] = useState("14");
  const events = store.getEvents();
  const days = [{ d: "10", day: "mié" }, { d: "11", day: "jue" }, { d: "12", day: "vie" }, { d: "13", day: "sáb" }, { d: "14", day: "dom" }, { d: "15", day: "lun" }, { d: "16", day: "mar" }, { d: "17", day: "mié" }, { d: "18", day: "jue" }, { d: "21", day: "dom" }, { d: "25", day: "jue" }];
  const hasEvent = (d: string) => events.some((e) => e.day === d);

  return (
    <div>
      <div style={{ padding: "24px 20px 14px" }}>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 700, margin: "0 0 4px", color: theme.ink }}>Eventos</h1>
        <p style={{ color: theme.muted, fontSize: 14, margin: 0 }}>Septiembre 2026</p>
      </div>
      <div style={{ padding: "0 20px 14px", display: "flex", gap: 8, overflowX: "auto" as const }}>
        {days.map(({ d, day }) => {
          const active = d === selectedDay;
          const hasEv = hasEvent(d);
          return (
            <div key={d} onClick={() => setSelectedDay(d)} style={{ flexShrink: 0, width: 46, height: 62, borderRadius: 12, background: active ? TEAL : theme.card, border: `1.5px solid ${active ? TEAL : theme.border}`, display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative" as const }}>
              {hasEv && !active && <div style={{ position: "absolute" as const, top: 5, right: 5, width: 6, height: 6, borderRadius: "50%", background: CORAL }} />}
              <span style={{ fontSize: 10, color: active ? "rgba(255,255,255,0.7)" : theme.muted, textTransform: "uppercase" as const }}>{day}</span>
              <span style={{ fontSize: 17, fontWeight: 700, color: active ? "white" : theme.ink }}>{d}</span>
            </div>
          );
        })}
      </div>
      <div style={{ padding: "0 20px", display: "flex", flexDirection: "column" as const, gap: 14 }}>
        {events.map((ev) => (
          <Card key={ev.id}>
            <div style={{ borderLeft: `4px solid ${ev.color}`, padding: 16 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ width: 46, height: 46, borderRadius: 12, flexShrink: 0, background: ev.color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{ev.emoji}</div>
                <div style={{ flex: 1 }}>
                  <Badge text={ev.category} color={ev.color} />
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: "6px 0 4px", lineHeight: 1.3, fontFamily: "'Fraunces', serif", color: theme.ink }}>{ev.title}</h3>
                  <p style={{ fontSize: 13, color: theme.muted, margin: "0 0 7px", lineHeight: 1.5 }}>{ev.desc}</p>
                  <div style={{ display: "flex", flexDirection: "column" as const, gap: 2 }}>
                    <span style={{ fontSize: 12, color: theme.ink, fontWeight: 500 }}>📅 {ev.date} · {ev.time}</span>
                    <span style={{ fontSize: 12, color: theme.muted }}>📍 {ev.location}</span>
                    <span style={{ fontSize: 12, color: ev.color, fontWeight: 600 }}>👥 {ev.spots}</span>
                  </div>
                </div>
                <button onClick={() => onToggleFav(ev.id)} style={{ background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}>
                  <StarIcon filled={favorites.has(ev.id)} />
                </button>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button style={{ flex: 1, padding: "10px", borderRadius: 10, background: ev.color, color: "white", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}>Participar</button>
                <button style={{ padding: "10px 14px", borderRadius: 10, background: ev.color + "15", border: "none", cursor: "pointer", display: "flex", alignItems: "center" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="18" cy="5" r="3" stroke={ev.color} strokeWidth="1.8" /><circle cx="6" cy="12" r="3" stroke={ev.color} strokeWidth="1.8" /><circle cx="18" cy="19" r="3" stroke={ev.color} strokeWidth="1.8" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" stroke={ev.color} strokeWidth="1.8" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" stroke={ev.color} strokeWidth="1.8" /></svg>
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── Directory Screen ───────────────────────────────────────────────────────
function DirectoryScreen() {
  const { theme } = useTheme();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"negocios" | "servicios">("negocios");
  const businesses = store.getDirectory();
  const services = store.getEmergency().map((e) => ({ label: e.label, number: e.num, emoji: e.emoji, desc: e.desc }));
  const filtered = businesses.filter((b) => b.name.toLowerCase().includes(search.toLowerCase()) || b.category.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div style={{ padding: "24px 20px 0" }}>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 700, margin: "0 0 4px", color: theme.ink }}>Directorio</h1>
        <p style={{ color: theme.muted, fontSize: 14, margin: "0 0 14px" }}>Negocios y servicios de la urbanización</p>
        <div style={{ position: "relative" as const, marginBottom: 12 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ position: "absolute" as const, left: 14, top: "50%", transform: "translateY(-50%)" }}><circle cx="11" cy="11" r="7" stroke={theme.muted} strokeWidth="2" /><path d="m21 21-4.35-4.35" stroke={theme.muted} strokeWidth="2" strokeLinecap="round" /></svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar negocio o servicio..." style={{ width: "100%", padding: "12px 14px 12px 42px", borderRadius: 12, border: `1.5px solid ${theme.border}`, fontSize: 14, background: theme.inputBg, outline: "none", fontFamily: "'Outfit', sans-serif", color: theme.ink }} />
        </div>
        <div style={{ display: "flex", gap: 0, background: theme.surface, borderRadius: 12, padding: 4, marginBottom: 16 }}>
          {(["negocios", "servicios"] as const).map((t) => (
            <button key={t} onClick={() => setActiveTab(t)} style={{ flex: 1, padding: "9px", borderRadius: 9, border: "none", background: activeTab === t ? theme.card : "none", fontWeight: 600, fontSize: 13, color: activeTab === t ? theme.ink : theme.muted, cursor: "pointer", boxShadow: activeTab === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none" }}>
              {t === "negocios" ? "🏪 Negocios" : "🆘 Emergencias"}
            </button>
          ))}
        </div>
      </div>
      {activeTab === "negocios" ? (
        <div style={{ padding: "0 20px", display: "flex", flexDirection: "column" as const, gap: 8 }}>
          {filtered.map((b) => (
            <Card key={b.name}>
              <div style={{ padding: "14px 16px", display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: TEAL + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{b.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 2px", color: theme.ink, whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" }}>{b.name}</p>
                  <p style={{ fontSize: 12, color: theme.muted, margin: "0 0 2px" }}>{b.category} · {b.hours}</p>
                  <p style={{ fontSize: 13, color: TEAL, fontWeight: 600, margin: 0 }}>📞 {b.phone}</p>
                </div>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke={theme.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
            </Card>
          ))}
          {filtered.length === 0 && <div style={{ textAlign: "center" as const, padding: "40px 20px", color: theme.muted }}><div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div><p>Sin resultados para "{search}"</p></div>}
        </div>
      ) : (
        <div style={{ padding: "0 20px", display: "flex", flexDirection: "column" as const, gap: 10 }}>
          {services.map((s) => (
            <Card key={s.label}>
              <div style={{ padding: "14px 16px", display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: CORAL + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{s.emoji}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 1px", color: theme.ink }}>{s.label}</p>
                  <p style={{ fontSize: 12, color: theme.muted, margin: 0 }}>{s.desc}</p>
                </div>
                <p style={{ fontSize: 24, fontWeight: 800, color: CORAL, margin: 0, fontFamily: "monospace" }}>{s.number}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Participate Screen ─────────────────────────────────────────────────────
function ParticipateScreen({ onBack }: { onBack: () => void }) {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<"encuestas" | "reportes">("encuestas");
  const [reportSent, setReportSent] = useState(false);
  const [pollAnswers, setPollAnswers] = useState<Record<number, number>>({});
  const [pollSubmitted, setPollSubmitted] = useState<Set<number>>(new Set());

  const surveys = [
    { id: 1, question: "¿Cómo calificarías la seguridad de la urbanización Las Gaviotas?", options: ["Excelente", "Buena", "Regular", "Deficiente"], votes: [12, 34, 45, 18], total: 109, active: true },
    { id: 2, question: "¿Qué servicio necesita más mejora en la urbanización?", options: ["Recolección de basuras", "Alumbrado público", "Vías y andenes", "Zonas verdes"], votes: [28, 41, 35, 22], total: 126, active: true },
    { id: 3, question: "¿Participarías en una actividad de siembra de árboles?", options: ["Sí, definitivamente", "Probablemente sí", "Probablemente no", "No"], votes: [67, 29, 8, 5], total: 109, active: false },
  ];

  const reportTypes = [
    { value: "alumbrado", label: "🔦 Alumbrado público", desc: "Postes dañados o sin luz" },
    { value: "basuras", label: "🗑 Residuos y basuras", desc: "Puntos ilegales de basura" },
    { value: "vias", label: "🛣 Vías y andenes", desc: "Huecos, daños en pavimento" },
    { value: "seguridad", label: "🚨 Seguridad", desc: "Situación de riesgo o peligro" },
    { value: "acueducto", label: "💧 Acueducto", desc: "Fugas o daños en tuberías" },
    { value: "otro", label: "📋 Otro", desc: "Cualquier otra situación" },
  ];

  const [reportForm, setReportForm] = useState({ type: "", location: "", desc: "" });

  return (
    <div>
      <div style={{ padding: "24px 20px 0" }}>
        <BackButton onBack={onBack} />
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 700, margin: "0 0 4px", color: theme.ink }}>Participar</h1>
        <p style={{ color: theme.muted, fontSize: 14, margin: "0 0 16px" }}>Tu voz y reportes construyen una mejor urbanización</p>

        <div style={{ display: "flex", gap: 0, background: theme.surface, borderRadius: 12, padding: 4, marginBottom: 20 }}>
          {(["encuestas", "reportes"] as const).map((t) => (
            <button key={t} onClick={() => setActiveTab(t)} style={{ flex: 1, padding: "10px", borderRadius: 9, border: "none", background: activeTab === t ? theme.card : "none", fontWeight: 600, fontSize: 13, color: activeTab === t ? theme.ink : theme.muted, cursor: "pointer", boxShadow: activeTab === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none" }}>
              {t === "encuestas" ? "🗳️ Encuestas" : "📋 Reportes"}
            </button>
          ))}
        </div>

        {activeTab === "encuestas" && (
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 16 }}>
            {surveys.map((survey) => {
              const submitted = pollSubmitted.has(survey.id);
              const selected = pollAnswers[survey.id];
              return (
                <Card key={survey.id}>
                  <div style={{ padding: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ marginBottom: 6 }}><Badge text={survey.active ? "Activa" : "Cerrada"} color={survey.active ? TEAL : theme.muted} /></div>
                        <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, lineHeight: 1.4, color: theme.ink }}>{survey.question}</h3>
                      </div>
                    </div>
                    <p style={{ fontSize: 12, color: theme.muted, margin: "0 0 12px" }}>{survey.total} votos</p>
                    <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
                      {survey.options.map((opt, idx) => {
                        const pct = Math.round((survey.votes[idx] / survey.total) * 100);
                        const isSelected = selected === idx;
                        const showResult = submitted || !survey.active;
                        return (
                          <button key={opt} onClick={() => !submitted && survey.active && setPollAnswers({ ...pollAnswers, [survey.id]: idx })} style={{ textAlign: "left" as const, padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${isSelected ? TEAL : theme.border}`, background: isSelected ? TEAL + "15" : theme.card, cursor: submitted || !survey.active ? "default" : "pointer", position: "relative" as const, overflow: "hidden" }}>
                            {showResult && <div style={{ position: "absolute" as const, left: 0, top: 0, bottom: 0, width: `${pct}%`, background: TEAL + "12", borderRadius: 8 }} />}
                            <div style={{ position: "relative" as const, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontSize: 13, fontWeight: isSelected ? 700 : 500, color: isSelected ? TEAL : theme.ink }}>{opt}</span>
                              {showResult && <span style={{ fontSize: 12, fontWeight: 700, color: TEAL }}>{pct}%</span>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    {survey.active && !submitted && (
                      <button onClick={() => selected !== undefined && setPollSubmitted(new Set([...pollSubmitted, survey.id]))} disabled={selected === undefined} style={{ width: "100%", marginTop: 12, padding: "11px", borderRadius: 10, background: selected !== undefined ? TEAL : theme.surface, color: selected !== undefined ? "white" : theme.muted, fontWeight: 700, fontSize: 13, border: "none", cursor: selected !== undefined ? "pointer" : "not-allowed" }}>
                        Enviar respuesta
                      </button>
                    )}
                    {submitted && <p style={{ textAlign: "center" as const, fontSize: 12, color: TEAL, fontWeight: 600, margin: "10px 0 0" }}>✅ ¡Gracias por participar!</p>}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {activeTab === "reportes" && (
          <div>
            {reportSent ? (
              <Card>
                <div style={{ padding: "36px 20px", textAlign: "center" as const }}>
                  <div style={{ fontSize: 44, marginBottom: 14 }}>✅</div>
                  <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 700, margin: "0 0 8px", color: theme.ink }}>Reporte enviado</h3>
                  <p style={{ fontSize: 14, color: theme.muted, margin: "0 0 20px", lineHeight: 1.6 }}>
                    Gracias por reportar. La JAC y las autoridades correspondientes serán notificadas para gestionar el problema.
                  </p>
                  <button onClick={() => { setReportSent(false); setReportForm({ type: "", location: "", desc: "" }); }} style={{ padding: "12px 28px", borderRadius: 12, background: TEAL, color: "white", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer" }}>
                    Nuevo reporte
                  </button>
                </div>
              </Card>
            ) : (
              <>
                <SectionTitle>Tipo de problema</SectionTitle>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8, marginBottom: 16 }}>
                  {reportTypes.map((r) => (
                    <button key={r.value} onClick={() => setReportForm({ ...reportForm, type: r.value })} style={{ padding: "12px", borderRadius: 12, border: `1.5px solid ${reportForm.type === r.value ? TEAL : theme.border}`, background: reportForm.type === r.value ? TEAL + "15" : theme.card, textAlign: "left" as const, cursor: "pointer" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: reportForm.type === r.value ? TEAL : theme.ink }}>{r.label}</div>
                      <div style={{ fontSize: 11, color: theme.muted, marginTop: 2 }}>{r.desc}</div>
                    </button>
                  ))}
                </div>
                <Card>
                  <div style={{ padding: "16px", display: "flex", flexDirection: "column" as const, gap: 14 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: theme.muted, textTransform: "uppercase" as const, letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>Ubicación / Dirección</label>
                      <input value={reportForm.location} onChange={(e) => setReportForm({ ...reportForm, location: e.target.value })} placeholder="Ej: Calle 5 con Carrera 10, frente al parque" style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: `1.5px solid ${theme.border}`, fontSize: 14, fontFamily: "'Outfit', sans-serif", outline: "none", background: theme.inputBg, color: theme.ink }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: theme.muted, textTransform: "uppercase" as const, letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>Descripción del problema</label>
                      <textarea rows={4} value={reportForm.desc} onChange={(e) => setReportForm({ ...reportForm, desc: e.target.value })} placeholder="Describe el problema con el mayor detalle posible..." style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: `1.5px solid ${theme.border}`, fontSize: 14, fontFamily: "'Outfit', sans-serif", outline: "none", background: theme.inputBg, color: theme.ink, resize: "vertical" as const }} />
                    </div>
                    <button onClick={() => { if (reportForm.type && reportForm.desc) setReportSent(true); }} style={{ padding: "13px", borderRadius: 12, background: `linear-gradient(135deg, ${TEAL}, #003078)`, color: "white", fontSize: 15, fontWeight: 700, border: "none", cursor: "pointer" }}>
                      Enviar reporte
                    </button>
                  </div>
                </Card>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Gallery Screen ─────────────────────────────────────────────────────────
function GalleryScreen({ onBack }: { onBack: () => void }) {
  const { theme } = useTheme();
  const [selected, setSelected] = useState<string | null>(null);
  const photos = store.getGallery();
  const selectedPhoto = photos.find((p) => p.id === selected);

  return (
    <div>
      <div style={{ padding: "24px 20px 16px" }}>
        <BackButton onBack={onBack} />
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 700, margin: "0 0 4px", color: theme.ink }}>Galería</h1>
        <p style={{ color: theme.muted, fontSize: 14, margin: 0 }}>Imágenes de nuestra comunidad</p>
      </div>
      {selected && selectedPhoto && (
        <div onClick={() => setSelected(null)} style={{ position: "fixed" as const, inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ maxWidth: 390, width: "100%" }}>
            <img src={selectedPhoto.url} alt={selectedPhoto.caption} style={{ width: "100%", borderRadius: 16 }} />
            <p style={{ color: "rgba(255,255,255,0.7)", textAlign: "center" as const, fontSize: 13, marginTop: 12 }}>
              {selectedPhoto.caption}
            </p>
          </div>
        </div>
      )}
      <div style={{ padding: "0 20px", display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
        {photos.map((p) => (
          <div key={p.id} onClick={() => setSelected(p.id)} style={{ aspectRatio: "1", borderRadius: 12, overflow: "hidden", background: theme.surface, cursor: "pointer", position: "relative" as const }}>
            <img src={p.url} alt={p.caption} style={{ width: "100%", height: "100%", objectFit: "cover" as const }} />
            <div style={{ position: "absolute" as const, inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 55%)" }} />
            <span style={{ position: "absolute" as const, bottom: 5, left: 6, fontSize: 10, color: "white", fontWeight: 700 }}>{p.category}</span>
          </div>
        ))}
      </div>
      <div style={{ padding: "16px 20px" }}>
        <div style={{ background: theme.surface, borderRadius: 14, padding: "14px 16px", textAlign: "center" as const }}>
          <p style={{ fontSize: 13, color: theme.muted, margin: 0 }}>📸 ¿Tienes fotos de la urbanización? Compártelas contactando a la JAC.</p>
        </div>
      </div>
    </div>
  );
}

// ── About Screen ───────────────────────────────────────────────────────────
function AboutScreen({ onBack }: { onBack: () => void }) {
  const { theme } = useTheme();
  const sections = [
    { icon: <img src="/gaviota.png" alt="" style={{ width: 26, height: 26, background: "#0060A8", borderRadius: 7, padding: 3 }} />, title: "Gaviotas Conecta", desc: "Plataforma digital comunitaria de la Urbanización Las Gaviotas de Cartagena de Indias. Creada para facilitar la comunicación, participación y acceso a la información de los habitantes." },
    { icon: "🏘", title: "Urbanización Las Gaviotas", desc: "Las Gaviotas es una urbanización de Cartagena de Indias con una comunidad activa y participativa. [Información detallada pendiente de confirmación con la JAC.]" },
    { icon: "🏛", title: "Junta de Acción Comunal", desc: "La JAC de la Urbanización Las Gaviotas representa los intereses de los residentes ante las autoridades locales. [Datos de la JAC pendientes de confirmación.]" },
    { icon: "🎯", title: "Misión", desc: "Conectar digitalmente a los habitantes de Las Gaviotas para fortalecer la participación ciudadana, la comunicación y el acceso a la información local." },
    { icon: "👁", title: "Visión", desc: "Ser la plataforma de referencia para la comunidad, contribuyendo al desarrollo, la transparencia y el bienestar de sus habitantes." },
  ];
  return (
    <div>
      <div style={{ padding: "24px 20px 0" }}>
        <BackButton onBack={onBack} />
        <div style={{ background: `linear-gradient(135deg, ${TEAL} 0%, #003078 100%)`, borderRadius: 18, padding: "24px 20px", textAlign: "center" as const, marginBottom: 20 }}>
          <AppLogo size={84} radius={20} style={{ margin: "0 auto 14px" }} />
          <h1 style={{ fontFamily: "'Fraunces', serif", color: "white", fontSize: 22, fontWeight: 700, margin: "0 0 4px" }}>Gaviotas Conecta</h1>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, margin: "0 0 14px" }}>Urbanización Las Gaviotas · Cartagena de Indias</p>
          <div style={{ display: "flex", justifyContent: "center", gap: 24 }}>
            {[["v1.0", "Versión"], ["MVP", "Fase"], ["2026", "Año"]].map(([val, lbl]) => (
              <div key={lbl} style={{ textAlign: "center" as const }}>
                <div style={{ color: "white", fontSize: 17, fontWeight: 800, fontFamily: "'Fraunces', serif" }}>{val}</div>
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
          {sections.map((s) => (
            <Card key={s.title}>
              <div style={{ padding: "14px 16px", display: "flex", gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: TEAL + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{s.icon}</div>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 4px", fontFamily: "'Fraunces', serif", color: theme.ink }}>{s.title}</h3>
                  <p style={{ fontSize: 13, color: theme.muted, margin: 0, lineHeight: 1.6 }}>{s.desc}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
        <p style={{ textAlign: "center" as const, fontSize: 12, color: theme.muted, margin: "18px 0 0", lineHeight: 1.6 }}>
          Desarrollado con ❤️ para la comunidad de Las Gaviotas<br />Cartagena de Indias, Colombia · 2026
        </p>
      </div>
    </div>
  );
}

// ── Privacy Screen ─────────────────────────────────────────────────────────
function PrivacyScreen({ onBack }: { onBack: () => void }) {
  const { theme } = useTheme();
  const sections = [
    { title: "1. Responsable del tratamiento", content: "La Junta de Acción Comunal de la Urbanización Las Gaviotas de Cartagena de Indias es la entidad responsable del tratamiento de los datos personales recopilados a través de esta aplicación." },
    { title: "2. Datos que recopilamos", content: "Recopilamos únicamente los datos necesarios: nombre completo, correo electrónico, número de teléfono (opcional) y mensajes del formulario de contacto. No recopilamos datos sensibles sin consentimiento explícito." },
    { title: "3. Finalidad del tratamiento", content: "Los datos se utilizan para: gestionar tu cuenta, enviar notificaciones sobre noticias y eventos de la urbanización, responder consultas enviadas a la JAC, y mejorar los servicios de la aplicación." },
    { title: "4. Base legal", content: "El tratamiento se fundamenta en la Ley 1581 de 2012 y el Decreto 1377 de 2013. Al registrarte, otorgas tu consentimiento libre, previo, expreso e informado." },
    { title: "5. Derechos del titular", content: "Puedes ejercer tus derechos de acceso, rectificación, cancelación, oposición, portabilidad y supresión contactando a la JAC a través del formulario de contacto de esta aplicación." },
    { title: "6. Conservación de datos", content: "Los datos se conservan mientras la cuenta esté activa o durante el tiempo necesario para cumplir obligaciones legales. Puedes solicitar la eliminación de tu cuenta en cualquier momento." },
    { title: "7. Seguridad", content: "Implementamos medidas técnicas y organizativas para proteger tus datos contra accesos no autorizados, pérdida o alteración." },
    { title: "8. Contacto", content: "Para consultas sobre privacidad, contáctanos a través de la sección de Contacto o visita el Salón Comunal de la Urbanización Las Gaviotas. [Correo JAC pendiente de confirmación.]" },
  ];
  return (
    <div>
      <div style={{ padding: "24px 20px 0" }}>
        <BackButton onBack={onBack} />
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: TEAL + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🔒</div>
          <div>
            <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 700, margin: 0, color: theme.ink }}>Política de Privacidad</h1>
            <p style={{ color: theme.muted, fontSize: 12, margin: 0 }}>Última actualización: septiembre 2026</p>
          </div>
        </div>
        <div style={{ background: TEAL + "15", borderRadius: 12, padding: "12px 14px", marginBottom: 16 }}>
          <p style={{ fontSize: 13, color: TEAL, margin: 0, lineHeight: 1.5, fontWeight: 500 }}>
            Gaviotas Conecta respeta la privacidad de todos los usuarios conforme a la Ley 1581 de 2012 de Colombia.
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
          {sections.map((s) => (
            <Card key={s.title}>
              <div style={{ padding: "14px 16px" }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 6px", color: TEAL }}>{s.title}</h3>
                <p style={{ fontSize: 13, color: theme.muted, margin: 0, lineHeight: 1.7 }}>{s.content}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Contact Screen ─────────────────────────────────────────────────────────
function ContactScreen({ onBack }: { onBack: () => void }) {
  const { theme } = useTheme();
  const [form, setForm] = useState({ name: "", phone: "", type: "consulta", message: "" });
  const [sent, setSent] = useState(false);
  const channels = [
    { icon: "📱", label: "WhatsApp comunidad", value: "+57 300 000 0000", color: "#25D366" },
    { icon: "📘", label: "Facebook", value: "Las Gaviotas Cartagena", color: "#1877F2" },
    { icon: "📍", label: "Dirección", value: "Urbanización Las Gaviotas, Cartagena", color: TEAL },
  ];
  const jac = [{ role: "Presidente JAC", name: "[Nombre pendiente]" }, { role: "Secretaria", name: "[Nombre pendiente]" }, { role: "Tesorero", name: "[Nombre pendiente]" }];
  const types = [{ value: "consulta", label: "Consulta general" }, { value: "reporte", label: "Reporte o problema" }, { value: "sugerencia", label: "Sugerencia" }, { value: "solicitud", label: "Solicitud comunitaria" }];

  return (
    <div>
      <div style={{ padding: "24px 20px 0" }}>
        <BackButton onBack={onBack} />
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 700, margin: "0 0 4px", color: theme.ink }}>Contacto</h1>
        <p style={{ color: theme.muted, fontSize: 14, margin: "0 0 18px" }}>Comunícate con la Junta de Acción Comunal</p>
        <Card style={{ marginBottom: 18 }}>
          <div style={{ padding: 16, borderBottom: `1px solid ${theme.border}` }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg, ${TEAL}, #003078)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🏛</div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, margin: 0, fontFamily: "'Fraunces', serif", color: theme.ink }}>Junta de Acción Comunal</p>
                <p style={{ fontSize: 12, color: theme.muted, margin: 0 }}>Urbanización Las Gaviotas</p>
              </div>
            </div>
            {jac.map((j) => (
              <div key={j.role} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${theme.border}` }}>
                <span style={{ fontSize: 13, color: theme.muted }}>{j.role}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: theme.ink }}>{j.name}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column" as const, gap: 10 }}>
            {channels.map((c) => (
              <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, background: c.color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{c.icon}</div>
                <div>
                  <p style={{ fontSize: 11, color: theme.muted, margin: 0, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>{c.label}</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: c.color, margin: 0 }}>{c.value}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 17, fontWeight: 600, margin: "0 0 12px", color: theme.ink }}>Enviar mensaje</h2>
        {sent ? (
          <Card>
            <div style={{ padding: "32px 20px", textAlign: "center" as const }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>✅</div>
              <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 17, fontWeight: 700, margin: "0 0 8px", color: theme.ink }}>¡Mensaje enviado!</h3>
              <p style={{ fontSize: 14, color: theme.muted, margin: "0 0 18px" }}>La JAC se comunicará contigo pronto.</p>
              <button onClick={() => { setSent(false); setForm({ name: "", phone: "", type: "consulta", message: "" }); }} style={{ padding: "11px 28px", borderRadius: 11, background: TEAL, color: "white", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer" }}>
                Enviar otro
              </button>
            </div>
          </Card>
        ) : (
          <Card>
            <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} style={{ padding: "16px", display: "flex", flexDirection: "column" as const, gap: 14 }}>
              <InputField label="Nombre completo" placeholder="Tu nombre" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
              <InputField label="Teléfono (opcional)" type="tel" placeholder="300 000 0000" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: theme.muted, textTransform: "uppercase" as const, letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>Tipo de solicitud</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: `1.5px solid ${theme.border}`, fontSize: 14, fontFamily: "'Outfit', sans-serif", outline: "none", background: theme.inputBg, color: theme.ink }}>
                  {types.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: theme.muted, textTransform: "uppercase" as const, letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>Mensaje</label>
                <textarea rows={4} placeholder="Escribe tu consulta, sugerencia o reporte..." value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: `1.5px solid ${theme.border}`, fontSize: 14, fontFamily: "'Outfit', sans-serif", outline: "none", resize: "vertical" as const, background: theme.inputBg, color: theme.ink }} />
              </div>
              <button type="submit" style={{ padding: 13, borderRadius: 12, background: `linear-gradient(135deg, ${TEAL}, #003078)`, color: "white", fontSize: 15, fontWeight: 700, border: "none", cursor: "pointer" }}>
                Enviar mensaje
              </button>
            </form>
          </Card>
        )}
        <p style={{ textAlign: "center" as const, fontSize: 11, color: theme.muted, margin: "14px 0 0", lineHeight: 1.6 }}>
          🔒 Datos tratados conforme a la Ley 1581 de 2012.
        </p>
      </div>
    </div>
  );
}

// ── More Screen ────────────────────────────────────────────────────────────
function AdminAccess({ onOpen, theme }: { onOpen: () => void; theme: ReturnType<typeof makeTheme> }) {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  async function attempt() {
    if (busy) return;
    setBusy(true);
    const error = await store.adminSignIn(email, pwd);
    setBusy(false);
    if (error) { setErr(error); return; }
    setShow(false); setPwd(""); setErr(""); onOpen();
  }

  function open() {
    if (store.isAdmin()) onOpen();
    else setShow(true);
  }

  return (
    <>
      <button onClick={open} style={{ width: "100%", marginBottom: 12, padding: "12px 16px", background: "none", border: `1.5px dashed ${theme.border}`, borderRadius: 14, color: theme.muted, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        ⚙️ Panel Administrativo
      </button>
      {show && (
        <div style={{ position: "fixed" as const, inset: 0, zIndex: 9998, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={() => setShow(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: theme.card, borderRadius: 20, padding: 24, width: "100%", maxWidth: 340 }}>
            <div style={{ textAlign: "center" as const, marginBottom: 16 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>⚙️</div>
              <p style={{ margin: 0, fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 18, color: theme.ink }}>Panel Admin</p>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: theme.muted }}>Ingresa con tu cuenta de administrador</p>
            </div>
            <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setErr(""); }} placeholder="Correo" autoFocus autoComplete="username" style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: `1.5px solid ${err ? "#DC2626" : theme.border}`, fontSize: 14, fontFamily: "'Outfit', sans-serif", outline: "none", background: theme.inputBg, color: theme.ink, marginBottom: 8, boxSizing: "border-box" as const }} />
            <div style={{ position: "relative" as const, marginBottom: 8 }}>
              <input type={showPwd ? "text" : "password"} autoComplete="current-password" value={pwd} onChange={(e) => { setPwd(e.target.value); setErr(""); }} onKeyDown={(e) => e.key === "Enter" && attempt()} placeholder="Contraseña" style={{ width: "100%", padding: "12px 46px 12px 14px", borderRadius: 12, border: `1.5px solid ${err ? "#DC2626" : theme.border}`, fontSize: 14, fontFamily: "'Outfit', sans-serif", outline: "none", background: theme.inputBg, color: theme.ink, boxSizing: "border-box" as const }} />
              <button type="button" onClick={() => setShowPwd((v) => !v)} aria-label={showPwd ? "Ocultar contraseña" : "Mostrar contraseña"} title={showPwd ? "Ocultar contraseña" : "Mostrar contraseña"} style={{ position: "absolute" as const, right: 6, top: "50%", transform: "translateY(-50%)", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: theme.muted, padding: 0 }}>
                {showPwd ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                )}
              </button>
            </div>
            {err && <p style={{ color: "#DC2626", fontSize: 12, margin: "0 0 8px" }}>{err}</p>}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setShow(false); setPwd(""); setErr(""); }} style={{ flex: 1, padding: "11px", borderRadius: 11, background: theme.surface, border: "none", color: theme.muted, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Cancelar</button>
              <button onClick={attempt} style={{ flex: 1, padding: "11px", borderRadius: 11, background: TEAL, border: "none", color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>{busy ? "Entrando…" : "Entrar"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MoreScreen({ user, onSubScreen, onLogout, darkMode, onToggleDark, onGoNews, onGoEvents, onGoDirectory, onOpenAdmin }: { user: User | null; onSubScreen: (s: SubScreen) => void; onLogout: () => void; darkMode: boolean; onToggleDark: () => void; onGoNews: () => void; onGoEvents: () => void; onGoDirectory: () => void; onOpenAdmin: () => void; }) {
  const { theme } = useTheme();
  const menuItems = [
    { icon: "🗺️", label: "Mapa de la Urbanización", desc: "Lugares e instalaciones de Las Gaviotas", sub: "map" as SubScreen, color: "#2E86AB" },
    { icon: "📋", label: "Certificado de vecindad", desc: "Solicita tu certificado digital a la JAC", sub: "certificate" as SubScreen, color: TEAL },
    { icon: "🐾", label: "Perdidos y Encontrados", desc: "Mascotas y objetos perdidos en la urbanización", sub: "lostfound" as SubScreen, color: CORAL },
    { icon: "🧰", label: "Oficios de la Urbanización", desc: "Vecinos que ofrecen sus servicios aquí", sub: "oficios" as SubScreen, color: TEAL },
    { icon: "🤖", label: "Asistente Virtual", desc: "GaviotaBot responde tus preguntas", sub: "chat" as SubScreen, color: "#0060A8" },
    { icon: "🗳️", label: "Participar", desc: "Encuestas y reportes comunitarios", sub: "participate" as SubScreen, color: "#7B4FBF" },
    { icon: "💬", label: "Contacto JAC", desc: "Escribe a la Junta de Acción Comunal", sub: "contact" as SubScreen, color: TEAL },
    { icon: "🖼", label: "Galería", desc: "Fotos de la urbanización Las Gaviotas", sub: "gallery" as SubScreen, color: "#2E86AB" },
    { icon: "ℹ️", label: "Acerca de", desc: "Información de la app y la comunidad", sub: "about" as SubScreen, color: "#7B4FBF" },
    { icon: "🔒", label: "Política de Privacidad", desc: "Tratamiento de datos — Ley 1581/2012", sub: "privacy" as SubScreen, color: "#5B6B7F" },
  ];

  return (
    <div>
      <div style={{ padding: "24px 20px 0" }}>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 700, margin: "0 0 16px", color: theme.ink }}>Más</h1>

        {/* User card */}
        {user ? (
          <Card style={{ marginBottom: 16 }}>
            <div style={{ padding: "16px", display: "flex", gap: 14, alignItems: "center" }}>
              <div style={{ width: 52, height: 52, borderRadius: 15, background: `linear-gradient(135deg, ${TEAL}, ${CORAL})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: "white", fontWeight: 800 }}>
                {user.name[0].toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 16, fontWeight: 700, margin: "0 0 2px", fontFamily: "'Fraunces', serif", color: theme.ink }}>{user.name}</p>
                <p style={{ fontSize: 13, color: theme.muted, margin: "0 0 4px" }}>{user.email}</p>
                <Badge text="Residente" color={TEAL} />
              </div>
            </div>
            <div style={{ borderTop: `1px solid ${theme.border}`, padding: "10px 16px", display: "flex", gap: 10 }}>
              <button style={{ flex: 1, padding: "9px", borderRadius: 10, background: TEAL + "15", color: TEAL, fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}>✏️ Editar perfil</button>
              <button onClick={onLogout} style={{ flex: 1, padding: "9px", borderRadius: 10, background: "#FEE2E2", color: "#DC2626", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}>Cerrar sesión</button>
            </div>
          </Card>
        ) : (
          <Card style={{ marginBottom: 16 }}>
            <div style={{ padding: "16px", display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ width: 48, height: 48, borderRadius: 13, background: theme.surface, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>👤</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 2px", color: theme.ink }}>Sin cuenta activa</p>
                <p style={{ fontSize: 13, color: theme.muted, margin: 0 }}>Inicia sesión para acceder a todas las funciones</p>
              </div>
            </div>
          </Card>
        )}

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10, marginBottom: 16 }}>
          {([["5", "Noticias", onGoNews], ["4", "Eventos", onGoEvents], ["8", "Negocios", onGoDirectory]] as [string, string, () => void][]).map(([val, lbl, action]) => (
            <button key={lbl} onClick={action} style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 14, padding: "13px 10px", textAlign: "center" as const, cursor: "pointer" }}>
              <div style={{ fontSize: 21, fontWeight: 800, color: TEAL, fontFamily: "'Fraunces', serif" }}>{val}</div>
              <div style={{ fontSize: 11, color: theme.muted, fontWeight: 600 }}>{lbl}</div>
            </button>
          ))}
        </div>

        {/* Dark mode toggle */}
        <Card style={{ marginBottom: 12 }}>
          <div style={{ padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: darkMode ? "#1E3A5F" : "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                {darkMode ? "🌙" : "☀️"}
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, margin: 0, color: theme.ink }}>Modo {darkMode ? "oscuro" : "claro"}</p>
                <p style={{ fontSize: 12, color: theme.muted, margin: 0 }}>{darkMode ? "Activo" : "Inactivo"}</p>
              </div>
            </div>
            <button onClick={onToggleDark} style={{ width: 48, height: 28, borderRadius: 100, background: darkMode ? TEAL : theme.border, border: "none", cursor: "pointer", position: "relative" as const, transition: "background 0.25s", flexShrink: 0 }}>
              <div style={{ position: "absolute" as const, top: 3, left: darkMode ? 22 : 3, width: 22, height: 22, borderRadius: "50%", background: "white", transition: "left 0.25s", boxShadow: "0 2px 6px rgba(0,0,0,0.2)" }} />
            </button>
          </div>
        </Card>

        {/* Menu items */}
        <SectionTitle>Secciones</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 8, marginBottom: 16 }}>
          {menuItems.map((item) => (
            <Card key={item.label} onClick={() => onSubScreen(item.sub)}>
              <div style={{ padding: "14px 16px", display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, flexShrink: 0, background: item.color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{item.icon}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 1px", color: theme.ink }}>{item.label}</p>
                  <p style={{ fontSize: 12, color: theme.muted, margin: 0 }}>{item.desc}</p>
                </div>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke={theme.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
            </Card>
          ))}
        </div>

        {/* Admin access */}
        <AdminAccess onOpen={onOpenAdmin} theme={theme} />

        <div style={{ padding: "14px 16px", background: theme.card, borderRadius: 14, border: `1px solid ${theme.border}` }}>
          <p style={{ fontSize: 12, color: theme.muted, textAlign: "center" as const, margin: 0, lineHeight: 1.6 }}>
            Gaviotas Conecta v1.0 · MVP<br />
            Urbanización Las Gaviotas · Cartagena de Indias<br />
            Comunidad · 2026
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Bottom Navigation ──────────────────────────────────────────────────────
function BottomNav({ active, onChange }: { active: Screen; onChange: (s: Screen) => void }) {
  const { theme } = useTheme();
  const tabs: { id: Screen; label: string; Icon: React.FC<{ active: boolean }> }[] = [
    { id: "home", label: "Inicio", Icon: IconHome },
    { id: "news", label: "Noticias", Icon: IconNews },
    { id: "events", label: "Eventos", Icon: IconEvents },
    { id: "directory", label: "Directorio", Icon: IconDirectory },
    { id: "more", label: "Más", Icon: IconMore },
  ];
  return (
    <div style={{ background: theme.card, borderTop: `1px solid ${theme.border}`, boxShadow: "0 -6px 20px rgba(0,36,92,0.06)", display: "flex", zIndex: 50, flexShrink: 0, paddingBottom: "max(env(safe-area-inset-bottom, 0px), 8px)" }}>
      {tabs.map(({ id, label, Icon }) => {
        const isActive = active === id;
        return (
          <button key={id} onClick={() => onChange(id)} aria-current={isActive ? "page" : undefined} style={{ flex: 1, padding: "10px 2px 4px", display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", position: "relative" as const }}>
            <div style={{ width: 54, height: 34, borderRadius: 17, display: "flex", alignItems: "center", justifyContent: "center", background: isActive ? "#E3EFF9" : "transparent", transition: "background .2s" }}>
              <Icon active={isActive} />
            </div>
            <span style={{ fontSize: 11.5, fontWeight: isActive ? 700 : 600, color: isActive ? TEAL : "#6B7C90" }}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── App Shell ──────────────────────────────────────────────────────────────
export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const theme = makeTheme(darkMode);
  const [authView, setAuthView] = useState<AuthView>(() => (store.isPasswordRecovery() ? "newPassword" : store.currentUser() ? "app" : "splash"));
  const [user, setUser] = useState<User | null>(() => store.currentUser());
  const [screen, setScreen] = useState<Screen>("home");
  const [subScreen, setSubScreen] = useState<SubScreen>(null);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [notifications, setNotifications] = useState<Notification[]>(NOTIFICATIONS_DATA);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  function handleLogin(u: User) { setUser(u); setAuthView("app"); }

  // Una pantalla pide cuenta para publicar: ir a iniciar sesión.
  useEffect(() => {
    const goLogin = () => { setShowAdmin(false); setAuthView("login"); };
    window.addEventListener("gc:require-login", goLogin);
    return () => window.removeEventListener("gc:require-login", goLogin);
  }, []);
  function handleLogout() { setUser(null); setAuthView("splash"); setScreen("home"); setSubScreen(null); void store.signOut(); }
  function toggleFav(id: number) {
    setFavorites((f) => {
      const next = new Set(f);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  function markNotification(id: number) {
    setNotifications((ns) => ns.map((n) => n.id === id ? { ...n, read: true } : n));
  }
  function markAllRead() {
    setNotifications((ns) => ns.map((n) => ({ ...n, read: true })));
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  const wrapperStyle: React.CSSProperties = {
    height: "100%",
    maxWidth: 430,
    margin: "0 auto",
    boxShadow: "0 0 60px rgba(0,0,0,0.15)",
  };

  // Auth screens (no theme context needed but we still wrap)
  const authShell = (content: React.ReactNode) => (
    <ThemeCtx.Provider value={{ theme, toggle: () => setDarkMode(!darkMode) }}>
      <div style={wrapperStyle}>{content}</div>
    </ThemeCtx.Provider>
  );

  if (authView === "splash") return authShell(<SplashScreen onNext={(v) => setAuthView(v)} />);
  if (authView === "login") return authShell(<LoginScreen onLogin={handleLogin} onGoRegister={() => setAuthView("register")} onRecover={() => setAuthView("recover")} onSkip={() => setAuthView("app")} />);
  if (authView === "register") return authShell(<RegisterScreen onRegister={handleLogin} onGoLogin={() => setAuthView("login")} />);
  if (authView === "recover") return authShell(<RecoverScreen onBack={() => setAuthView("login")} />);
  if (authView === "newPassword") return authShell(<NewPasswordScreen onDone={() => setAuthView("app")} />);

  // Sub-screens
  const subScreenMap: Record<string, React.ReactNode> = {
    contact: <ContactScreen onBack={() => setSubScreen(null)} />,
    gallery: <GalleryScreen onBack={() => setSubScreen(null)} />,
    about: <AboutScreen onBack={() => setSubScreen(null)} />,
    privacy: <PrivacyScreen onBack={() => setSubScreen(null)} />,
    participate: <ParticipateScreen onBack={() => setSubScreen(null)} />,
    notifications: <NotificationsScreen notifications={notifications} onMark={(id) => id === -1 ? markAllRead() : markNotification(id)} onBack={() => setSubScreen(null)} />,
    map: <MapScreen onBack={() => setSubScreen(null)} theme={theme} />,
    chat: <ChatScreen onBack={() => setSubScreen(null)} theme={theme} />,
    certificate: <CertificateScreen onBack={() => setSubScreen(null)} />,
    lostfound: <LostFoundScreen onBack={() => setSubScreen(null)} />,
    oficios: <OfficiosScreen onBack={() => setSubScreen(null)} />,
  };

  const mainScreens: Record<Screen, React.ReactNode> = {
    home: <HomeScreen user={user} favorites={favorites} onToggleFav={toggleFav} onNotifications={() => setSubScreen("notifications")} onOpenMap={() => { setScreen("more"); setSubScreen("map"); }} onOpenChat={() => { setScreen("more"); setSubScreen("chat"); }} onGoNews={() => setScreen("news")} onGoEvents={() => setScreen("events")} onGoParticipate={() => { setScreen("more"); setSubScreen("participate"); }} onSubScreen={(s) => { setScreen("more"); setSubScreen(s); }} />,
    news: <NewsScreen favorites={favorites} onToggleFav={toggleFav} />,
    events: <EventsScreen favorites={favorites} onToggleFav={toggleFav} />,
    directory: <DirectoryScreen />,
    more: subScreen ? subScreenMap[subScreen] : <MoreScreen user={user} onSubScreen={setSubScreen} onLogout={handleLogout} darkMode={darkMode} onToggleDark={() => setDarkMode(!darkMode)} onGoNews={() => setScreen("news")} onGoEvents={() => setScreen("events")} onGoDirectory={() => setScreen("directory")} onOpenAdmin={() => setShowAdmin(true)} />,
  };

  const currentContent = screen === "more" && subScreen ? subScreenMap[subScreen] : mainScreens[screen];

  return (
    <ThemeCtx.Provider value={{ theme, toggle: () => setDarkMode(!darkMode) }}>
      <div style={{ ...wrapperStyle, height: "100%", display: "flex", flexDirection: "column" as const, background: theme.bg }}>
        {/* App header */}
        <div style={{ background: "linear-gradient(180deg, #00163D 0%, #001F4F 100%)", padding: "calc(env(safe-area-inset-top, 0px) + 10px) 18px 10px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0, position: "relative" as const, zIndex: 5 }}>
          <button onClick={() => { setScreen("home"); setSubScreen(null); }} aria-label="Ir al inicio" style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" as const }}>
            <Medallion size={38} />
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#FFFFFF", fontFamily: "'Fraunces', serif", lineHeight: 1.1, letterSpacing: "-0.01em" }}>Gaviotas <span style={{ color: "#7FD3F5" }}>Conecta</span></div>
              <div style={{ fontSize: 9.5, color: "#9CCBEA", letterSpacing: "0.22em", textTransform: "uppercase" as const, marginTop: 2 }}>Urb. Las Gaviotas</div>
            </div>
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => { setScreen("more"); setSubScreen("notifications"); }} aria-label="Notificaciones" style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.16)", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <BellIcon unread={unreadCount} color="#FFFFFF" />
            </button>
            {user && (
              <div style={{ position: "relative" as const }}>
                <button onClick={() => setShowUserMenu((v) => !v)} aria-label="Menú de la cuenta" aria-expanded={showUserMenu}
                  style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(145deg, #7FD3F5 0%, #0060A8 100%)", boxShadow: "0 0 0 2px rgba(255,255,255,0.85), 0 6px 16px rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 15, fontWeight: 700, border: "none", cursor: "pointer", padding: 0, fontFamily: "'Fraunces', serif" }}>
                  {user.name[0].toUpperCase()}
                </button>
                {showUserMenu && (
                  <>
                    <div onClick={() => setShowUserMenu(false)} style={{ position: "fixed" as const, inset: 0, zIndex: 9990 }} />
                    <div role="menu" style={{ position: "absolute" as const, top: 46, right: 0, zIndex: 9991, minWidth: 220, background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 14, boxShadow: "0 12px 32px rgba(0,36,92,0.18)", overflow: "hidden" }}>
                      <div style={{ padding: "12px 14px", borderBottom: `1px solid ${theme.border}` }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: theme.ink }}>{user.name}</div>
                        <div style={{ fontSize: 12, color: theme.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{user.email}</div>
                      </div>
                      <button role="menuitem" onClick={() => { setShowUserMenu(false); handleLogout(); }}
                        style={{ width: "100%", textAlign: "left" as const, padding: "12px 14px", background: "none", border: "none", cursor: "pointer", color: "#DC2626", fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                        Cerrar sesión
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div style={{
          flex: 1,
          overflowY: (subScreen === "map" || subScreen === "chat") ? "hidden" : "auto" as any,
          overflowX: "hidden" as const,
          paddingBottom: (subScreen === "map" || subScreen === "chat") ? 0 : 16,
          // lostfound uses its own internal scroll + fixed overlay for the form
          position: "relative" as const,
          minHeight: 0,
        }}>
          {currentContent}
        </div>

        <BottomNav active={screen} onChange={(s) => { setScreen(s); setSubScreen(null); }} />
      </div>
      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
    </ThemeCtx.Provider>
  );
}
