import { useState, useRef, useEffect } from "react";

const TEAL = "#0D6E6E";
const CORAL = "#E8643A";

interface Theme {
  bg: string; card: string; border: string; ink: string;
  muted: string; surface: string; inputBg: string; dark: boolean;
}

interface Message {
  id: number;
  from: "bot" | "user";
  text: string;
  time: string;
}

function now() {
  return new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
}

// ── Respuestas del bot ────────────────────────────────────────────────────────
const FAQ: { patterns: string[]; answer: string }[] = [
  {
    patterns: ["hola", "buenas", "buenos días", "buenas tardes", "buenas noches", "hey", "saludos"],
    answer: "¡Hola! 👋 Soy *GaviotaBot*, el asistente virtual del Barrio Las Gaviotas.\n\nPuedo ayudarte con información sobre la JAC, eventos, servicios, reportes y más. ¿En qué te puedo ayudar hoy?",
  },
  {
    patterns: ["jac", "junta", "acción comunal", "reunión", "asamblea", "presidente", "directiva"],
    answer: "🏛 *Junta de Acción Comunal — Las Gaviotas*\n\n• Reuniones ordinarias: primer sábado de cada mes, 9 a.m.\n• Lugar: Salón Comunal del barrio\n• Horario de atención: Lun–Vie, 8 a.m. – 5 p.m.\n• Para contactar a la JAC, usa la sección *Contacto JAC* en el menú Más.",
  },
  {
    patterns: ["agua", "acueducto", "aguas de cartagena", "corte de agua", "suspensión"],
    answer: "💧 *Servicio de Agua*\n\nPara reportar fallas o consultar cortes programados:\n• Aguas de Cartagena: 6415001\n• Línea nacional: 018000 111 100\n• Actualmente hay un corte programado el 13 de sep, 8 a.m.–4 p.m. en el sector norte.\n\n¿Necesitas más información?",
  },
  {
    patterns: ["luz", "energía", "eléctrica", "electricaribe", "electricidad", "apagón", "corte de luz"],
    answer: "⚡ *Servicio Eléctrico*\n\nPara reportar fallas de energía:\n• Electricaribe (Afinia): 6644444\n• App: Mi Afinia\n• Línea 24h: 018000 111 533",
  },
  {
    patterns: ["salud", "médico", "medicina", "doctor", "hospital", "clínica", "urgencias", "puesto de salud"],
    answer: "🏥 *Salud en el Barrio*\n\n• Puesto de Salud Las Gaviotas: Lun–Vie, 7 a.m. – 4 p.m.\n• Urgencias más cercanas: Hospital Universitario del Caribe\n• Línea de salud Cartagena: 106\n• Emergencias: 123\n\nEste sábado hay *Brigada de Salud Gratuita* en el barrio. ¡No te la pierdas!",
  },
  {
    patterns: ["educación", "colegio", "escuela", "institución", "sena", "beca", "estudio"],
    answer: "🎓 *Educación*\n\n• Institución Educativa Las Gaviotas: atención 7 a.m. – 5 p.m.\n• SENA: 40 cupos de formación técnica gratuita disponibles para jóvenes 16–28 años del barrio.\n• Biblioteca Barrial: Lun–Sáb, 8 a.m. – 6 p.m.\n\n¿Te interesa la información de las becas del SENA?",
  },
  {
    patterns: ["seguridad", "policía", "robo", "hurto", "delito", "peligro", "emergencia"],
    answer: "🚨 *Seguridad y Emergencias*\n\n• Policía Nacional: 112\n• Línea de emergencias: 123\n• CAI más cercano: consulta con la JAC\n• Para reportar situaciones, también puedes usar la sección *Participar → Reportar problema* en la app.",
  },
  {
    patterns: ["basura", "residuos", "recolección", "aseo", "limpieza"],
    answer: "🗑 *Servicio de Aseo*\n\n• Empresa: Área Limpia / Ciudad Limpia Cartagena\n• Días de recolección: consulta con la JAC el calendario de tu cuadra\n• Para reportar puntos de basura no recolectada: 6691600\n\nRecuerda: el *14 de septiembre* hay jornada de limpieza del Parque Central. ¡Participa!",
  },
  {
    patterns: ["evento", "actividad", "programación", "qué hay", "agenda"],
    answer: "📅 *Próximas Actividades*\n\n• 13 sep: Corte de agua 8 a.m.–4 p.m.\n• 14 sep: Brigada de salud gratuita\n• 14 sep: Jornada de limpieza Parque Central, 7 a.m.\n• 18 sep: Asamblea general de copropietarios\n\nVe a la sección *Eventos* para ver todos los detalles.",
  },
  {
    patterns: ["mapa", "dónde queda", "ubicación", "dirección", "cómo llegar"],
    answer: "🗺️ *Mapa del Barrio*\n\nPuedes explorar el mapa interactivo de Las Gaviotas desde la sección *Más → Mapa del Barrio*.\n\nAhí encontrarás la ubicación del Salón Comunal, el Parque, la Cancha, el Puesto de Salud, la Iglesia y más lugares del barrio.",
  },
  {
    patterns: ["deporte", "deportivo", "cancha", "futbol", "fútbol", "recreacion", "recreación", "actividad fisica", "actividad física"],
    answer: "⚽ *Deporte y Recreación*\n\n• Cancha de Microfútbol: disponible todos los días de 6 a.m. a 10 p.m.\n• Polideportivo Comunal: actividades físicas y recreativas para toda la familia.\n• Parque Principal: zona verde para caminatas y encuentros deportivos.\n\nLa JAC organiza torneos barriales periódicamente. ¡Consulta la cartelera o escríbenos para saber el próximo torneo!",
  },
  {
    patterns: ["seguridad", "policia", "policía", "robo", "hurto", "delito", "peligro", "vigilancia", "camara", "cámara"],
    answer: "🚨 *Seguridad Barrial*\n\n• Policía Nacional: 112\n• Línea de emergencias: 123\n• Línea de denuncia anónima: 018000 910 600\n• Para reportar inseguridad en el barrio usa *Más → Participar → Reportar problema*.\n\nLa JAC trabaja con la Policía en jornadas de seguridad comunitaria. Puedes solicitar una reunión de seguridad contactando al Salón Comunal.",
  },
  {
    patterns: ["medio ambiente", "ambiente", "reciclaje", "reciclar", "árbol", "arbol", "siembra", "verde", "ecologia", "ecología", "contaminacion", "contaminación"],
    answer: "🌿 *Medio Ambiente*\n\n• Jornadas de limpieza: organizadas por la JAC con la comunidad.\n• Reciclaje: separa residuos en orgánicos, plástico, papel y vidrio.\n• Próxima actividad: jornada de siembra de árboles en el Parque Central.\n• Para reportar puntos de basura o contaminación: usa *Más → Participar → Reportar problema*.\n\n¿Te gustaría unirte al comité ambiental del barrio?",
  },
  {
    patterns: ["adulto mayor", "adultos mayores", "anciano", "abuelo", "tercera edad", "vejez", "pension", "pensión"],
    answer: "👴 *Adulto Mayor*\n\n• Programa de visitas domiciliarias: coordina con la JAC.\n• Colombia Mayor: subsidio económico para adultos mayores. Consulta en la Alcaldía o llama al 195.\n• Centro Vida más cercano: consultar con la Secretaría de Participación.\n• Brigadas de salud: incluyen atención prioritaria para adultos mayores.\n\nSi conoces un adulto mayor que necesite apoyo, repórtalo a la JAC.",
  },
  {
    patterns: ["obras", "infraestructura", "calle", "vía", "via", "hueco", "pavimento", "alcantarilla", "acera", "andén", "anden", "alumbrado", "luminaria"],
    answer: "🏗 *Obras e Infraestructura*\n\n• Para reportar huecos, daños en vías o andenes: llama al 195 (línea Alcaldía).\n• Alumbrado público dañado: ESSA / Afinia o línea 018000 111 533.\n• Alcantarillado: Aguas de Cartagena 6415001.\n• También puedes reportar desde *Más → Participar → Reportar problema*.\n\nLa JAC gestiona obras ante la Alcaldía. ¿Tienes algo específico que reportar?",
  },
  {
    patterns: ["juventud", "juventudes", "joven", "jóvenes", "jovenes", "adolescente", "muchacho", "chico"],
    answer: "🎯 *Juventudes*\n\n• SENA: 40 cupos de formación técnica gratuita para jóvenes 16–28 años del barrio.\n• Casas de la Cultura: talleres de arte, música y danza en Cartagena.\n• Colombia Joven: programas y oportunidades — colombiajoven.gov.co\n• La JAC tiene un comité de juventud activo. ¡Participa!\n\n¿Te interesa saber más sobre algún programa en específico?",
  },
  {
    patterns: ["reporte", "problema", "queja", "denuncia", "daño", "falla"],
    answer: "📋 *Reportar un Problema*\n\nPuedes enviar un reporte desde *Más → Participar → Reportar un problema*.\n\nTu reporte llegará directamente a la JAC para gestionar la solución. También puedes contactar directamente en *Más → Contacto JAC*.",
  },
  {
    patterns: ["encuesta", "opinión", "votación", "participar"],
    answer: "🗳️ *Participa en las Encuestas*\n\nHay una encuesta activa: *¿Cómo calificarías la seguridad del barrio?*\n\nVe a *Más → Participar* para responder. Tu opinión ayuda a mejorar el barrio.",
  },
  {
    patterns: ["gracias", "muchas gracias", "graci", "thank"],
    answer: "😊 ¡Con gusto! Aquí estaré siempre que me necesites.\n\n¿Hay algo más en que pueda ayudarte?",
  },
  {
    patterns: ["adiós", "chao", "hasta luego", "bye", "nos vemos"],
    answer: "👋 ¡Hasta pronto! Recuerda que siempre puedes volver a preguntar.\n\n*Gaviotas Conecta — Comunidad unida.*",
  },
];

const SUGGESTIONS = [
  "Deporte",
  "Seguridad",
  "Medio ambiente",
  "Adulto mayor",
  "Obras e infraestructura",
  "Juventudes",
];

function getBotReply(input: string): string {
  const lower = input.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  for (const faq of FAQ) {
    if (faq.patterns.some((p) => lower.includes(p.normalize("NFD").replace(/[\u0300-\u036f]/g, "")))) {
      return faq.answer;
    }
  }
  return "🤔 No encontré información específica sobre eso.\n\nPuedes escribir a la JAC directamente desde *Más → Contacto JAC*, o preguntarme sobre:\n• Reuniones JAC\n• Servicios de agua, luz o aseo\n• Salud y brigadas\n• Eventos y actividades\n• Reportar un problema";
}

// ── Render message with *bold* ─────────────────────────────────────────────
function MessageText({ text, fromBot }: { text: string; fromBot: boolean }) {
  const color = fromBot ? "#162323" : "white";
  const parts = text.split(/(\*[^*]+\*)/g);
  return (
    <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color, whiteSpace: "pre-wrap" as const }}>
      {parts.map((part, i) =>
        part.startsWith("*") && part.endsWith("*")
          ? <strong key={i}>{part.slice(1, -1)}</strong>
          : <span key={i}>{part}</span>
      )}
    </p>
  );
}

// ── Chat Screen ────────────────────────────────────────────────────────────
export default function ChatScreen({ onBack, theme }: { onBack: () => void; theme: Theme }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      from: "bot",
      text: "¡Hola! 👋 Soy *GaviotaBot*, el asistente virtual del Barrio Las Gaviotas.\n\nPuedo responder preguntas sobre la JAC, servicios públicos, eventos, salud, seguridad y más. ¿En qué te ayudo?",
      time: now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  function sendMessage(text: string) {
    if (!text.trim()) return;
    const userMsg: Message = { id: Date.now(), from: "user", text: text.trim(), time: now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      const reply = getBotReply(text);
      setMessages((prev) => [...prev, { id: Date.now() + 1, from: "bot", text: reply, time: now() }]);
      setTyping(false);
    }, 700 + Math.random() * 400);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column" as const, height: "100%", background: theme.bg }}>

      {/* Header */}
      <div style={{ padding: "16px 20px 14px", flexShrink: 0, borderBottom: `1px solid ${theme.border}`, background: theme.card }}>
        <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: TEAL, fontSize: 14, fontWeight: 600, cursor: "pointer", padding: "0 0 10px" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M11 6l-6 6 6 6" stroke={TEAL} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Volver
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 46, height: 46, borderRadius: 15, background: `linear-gradient(135deg, ${TEAL}, #0a4f4f)`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
            boxShadow: `0 4px 16px ${TEAL}44`,
          }}>
            🦅
          </div>
          <div>
            <p style={{ margin: 0, fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 16, color: theme.ink }}>GaviotaBot</p>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22C55E" }} />
              <span style={{ fontSize: 11, color: "#22C55E", fontWeight: 600 }}>En línea · Asistente comunitario</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto" as const, padding: "16px 16px 0" }}>

        {/* Suggestions (only at top) */}
        {messages.length === 1 && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11, color: theme.muted, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 8 }}>
              Sugerencias rápidas
            </p>
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 7 }}>
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => sendMessage(s)} style={{
                  padding: "7px 13px", borderRadius: 100,
                  border: `1.5px solid ${TEAL}`,
                  background: TEAL + "12",
                  color: TEAL, fontSize: 12, fontWeight: 600,
                  cursor: "pointer", whiteSpace: "nowrap" as const,
                }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} style={{
            display: "flex",
            justifyContent: msg.from === "user" ? "flex-end" : "flex-start",
            marginBottom: 12,
            gap: 8,
            alignItems: "flex-end",
          }}>
            {msg.from === "bot" && (
              <div style={{ width: 30, height: 30, borderRadius: 10, background: `linear-gradient(135deg, ${TEAL}, #0a4f4f)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>
                🦅
              </div>
            )}
            <div style={{
              maxWidth: "78%",
              background: msg.from === "user"
                ? `linear-gradient(135deg, ${TEAL}, #0a4f4f)`
                : theme.card,
              border: msg.from === "bot" ? `1px solid ${theme.border}` : "none",
              borderRadius: msg.from === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
              padding: "10px 14px",
              boxShadow: msg.from === "user" ? `0 4px 16px ${TEAL}33` : "0 2px 8px rgba(0,0,0,0.06)",
            }}>
              <MessageText text={msg.text} fromBot={msg.from === "bot"} />
              <p style={{ margin: "5px 0 0", fontSize: 10, color: msg.from === "user" ? "rgba(255,255,255,0.5)" : theme.muted, textAlign: "right" as const }}>
                {msg.time}
              </p>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {typing && (
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 12 }}>
            <div style={{ width: 30, height: 30, borderRadius: 10, background: `linear-gradient(135deg, ${TEAL}, #0a4f4f)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>
              🦅
            </div>
            <div style={{
              background: theme.card, border: `1px solid ${theme.border}`,
              borderRadius: "18px 18px 18px 4px", padding: "12px 16px",
              display: "flex", gap: 5, alignItems: "center",
            }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{
                  width: 7, height: 7, borderRadius: "50%", background: TEAL,
                  animation: "pulse 1.2s ease-in-out infinite",
                  animationDelay: `${i * 0.2}s`,
                  opacity: 0.6,
                }} />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ flexShrink: 0, padding: "12px 16px 16px", borderTop: `1px solid ${theme.border}`, background: theme.card }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu pregunta..."
            style={{
              flex: 1, padding: "12px 16px", borderRadius: 100,
              border: `1.5px solid ${input ? TEAL : theme.border}`,
              background: theme.inputBg, color: theme.ink,
              fontSize: 14, fontFamily: "'Outfit', sans-serif",
              outline: "none", transition: "border-color 0.2s",
            }}
          />
          <button
            type="submit"
            disabled={!input.trim() || typing}
            style={{
              width: 46, height: 46, borderRadius: "50%", flexShrink: 0,
              background: input.trim() && !typing ? `linear-gradient(135deg, ${TEAL}, #0a4f4f)` : theme.surface,
              border: "none", cursor: input.trim() && !typing ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: input.trim() && !typing ? `0 4px 16px ${TEAL}44` : "none",
              transition: "all 0.2s",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke={input.trim() && !typing ? "white" : theme.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </form>
        <p style={{ textAlign: "center" as const, fontSize: 10, color: theme.muted, margin: "8px 0 0" }}>
          GaviotaBot responde preguntas frecuentes del barrio · No almacena datos personales
        </p>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.3); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
