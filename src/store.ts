// ── Gaviotas Conecta — Data Store (Supabase) ──────────────────────────────────
// Los datos viven en Supabase. Se cargan al abrir la app (store.init) en una
// caché en memoria para que las pantallas los lean de forma síncrona; cada
// set*() actualiza la caché y sincroniza los cambios con la base de datos.

import { supabase, openedFromRecoveryLink } from "./supabase";

export interface NewsItem {
  id: number;
  category: "Noticia" | "Comunicado" | "Proyecto";
  color: string;
  title: string;
  summary: string;
  date: string;
  image: string | null;
  readTime: string;
}

export interface EventItem {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  category: string;
  color: string;
  emoji: string;
  spots: string;
  desc: string;
  day: string;
}

export interface Place {
  id: number;
  name: string;
  desc: string;
  category: string;
  emoji: string;
  color: string;
  lat: number;
  lng: number;
  address?: string;
  phone?: string;
  hours?: string;
  image?: string | null;
}

export interface DirectoryBusiness {
  id: number;
  name: string;
  category: string;
  phone: string;
  emoji: string;
  hours: string;
  address?: string;
}

export interface GalleryPhoto {
  id: string;
  url: string;
  caption: string;
  category: string;
}

export interface ChatbotEntry {
  id: number;
  patterns: string;
  answer: string;
}

export interface EmergencyLine {
  id: number;
  emoji: string;
  label: string;
  num: string;
  desc: string;
}

// ── Lost & Found ──────────────────────────────────────────────────────────────
export type LFStatus = "activo" | "resuelto" | "archivado" | "oculto";
export type LFType = "Perdido" | "Encontrado";
export type LFCategory = "Mascota" | "Objeto";
export type LFSpecies = "Perro" | "Gato" | "Pájaro" | "Otro";
export type LFSize = "Pequeño" | "Mediano" | "Grande";
export type LFObjectCat = "Documentos" | "Llaves" | "Celular" | "Billetera" | "Ropa" | "Otro";

export interface LostFoundItem {
  id: string;
  type: LFType;
  category: LFCategory;
  status: LFStatus;
  createdAt: string;
  resolvedAt?: string;
  authorId: string;
  // Location (approximate sector, never exact address)
  sector: string;
  // Pet fields
  petName?: string;
  species?: LFSpecies;
  breed?: string;
  color?: string;
  size?: LFSize;
  distinctive?: string;
  hasCollar?: boolean;
  hasTag?: boolean;
  reward?: boolean;
  rewardNote?: string;
  // Object fields
  objectCat?: LFObjectCat;
  // Shared
  description: string;
  dateLostFound: string;
  photos: string[];
  phone: string;
  showWhatsApp: boolean;
}

export type CertStatus = "Enviada" | "En revisión" | "Aprobada" | "Requiere corrección" | "Rechazada";

export interface CertificateRequest {
  id: string;
  consecutive: string;
  createdAt: string;
  status: CertStatus;
  adminComment?: string;
  approvedAt?: string;
  // Step 1 — datos
  fullName: string;
  docType: string;
  docNumber: string;
  docPlace: string;
  address: string;
  residenceTime: string;
  quality: "Propietario" | "Arrendatario" | "Familiar";
  purpose: string;
  phone: string;
  email: string;
  // Step 2 — fotos (base64)
  photoCedulaFront: string;
  photoCedulaBack: string;
  photoRecibo: string;
  photoContrato?: string;
  photoSelfie?: string;
}

export interface AppSettings {
  appName: string;
  logoEmoji: string;
  neighborhood: string;
  city: string;
  adminPassword?: string; // obsoleto: el acceso admin ahora es con Supabase Auth
  presidentName: string;
  presidentEmail: string;
  resolutionNumber: string;
  nit: string;
  presidentSignature?: string;
  certTextP2?: string;
  certTextDisclaimer?: string;
}

// ── Defaults ──────────────────────────────────────────────────────────────────
const TEAL = "#0D6E6E";
const CORAL = "#E8643A";

const DEFAULT_NEWS: NewsItem[] = [
  { id: 1, category: "Proyecto", color: "#7B4FBF", title: "Nueva cancha de microfútbol para Las Gaviotas", summary: "La JAC gestiona la construcción de una cancha sintética en el sector sur, con presupuesto aprobado por la Alcaldía de Cartagena.", date: "10 sep 2026", image: "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=600&h=300&fit=crop&auto=format", readTime: "3 min" },
  { id: 2, category: "Comunicado", color: CORAL, title: "Suspensión de agua — 13 de septiembre", summary: "Aguas de Cartagena informa suspensión entre las 8 a.m. y las 4 p.m. del jueves 13 de septiembre por mantenimiento de redes.", date: "9 sep 2026", image: null, readTime: "2 min" },
  { id: 3, category: "Noticia", color: TEAL, title: "Programa de becas para jóvenes del barrio", summary: "El SENA abre 40 cupos de formación técnica gratuita para jóvenes entre 16 y 28 años residentes en Las Gaviotas y barrios aledaños.", date: "7 sep 2026", image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600&h=300&fit=crop&auto=format", readTime: "4 min" },
  { id: 4, category: "Comunicado", color: CORAL, title: "Asamblea general de copropietarios — sep 18", summary: "Se convoca a todos los residentes a la asamblea ordinaria. Temas: seguridad, zonas comunes y presupuesto 2027.", date: "6 sep 2026", image: null, readTime: "2 min" },
  { id: 5, category: "Noticia", color: TEAL, title: "Brigada de salud gratuita este sábado", summary: "La Secretaría de Salud Distrital realizará jornada de vacunación, toma de presión y consulta médica gratuita para residentes.", date: "5 sep 2026", image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&h=300&fit=crop&auto=format", readTime: "3 min" },
];

const DEFAULT_EVENTS: EventItem[] = [
  { id: 101, title: "Jornada de limpieza — Parque Central", date: "14 sep 2026", time: "7:00 a.m.", location: "Parque Principal Las Gaviotas", category: "Actividad comunitaria", color: TEAL, emoji: "🌱", spots: "Cupos ilimitados", desc: "Únete a la brigada de embellecimiento del parque. Trae guantes y buena energía.", day: "14" },
  { id: 102, title: "Asamblea general de residentes", date: "18 sep 2026", time: "5:00 p.m.", location: "Salón Comunal Las Gaviotas", category: "Reunión", color: "#7B4FBF", emoji: "🏛", spots: "Abierto a todos", desc: "Discusión sobre seguridad, presupuesto y proyectos para 2027.", day: "18" },
  { id: 103, title: "Torneo de microfútbol barrial", date: "21 sep 2026", time: "2:00 p.m.", location: "Cancha Las Gaviotas", category: "Deporte", color: CORAL, emoji: "⚽", spots: "12 equipos", desc: "Inscribe tu equipo antes del 19 de septiembre. Categorías infantil, juvenil y adultos.", day: "21" },
  { id: 104, title: "Taller de emprendimiento digital", date: "25 sep 2026", time: "9:00 a.m.", location: "Biblioteca barrial", category: "Formación", color: "#2E86AB", emoji: "💻", spots: "20 cupos", desc: "Aprende a crear tu negocio en línea. Gratuito para residentes de Las Gaviotas.", day: "25" },
];

const DEFAULT_PLACES: Place[] = [
  { id: 1, name: "Salón Comunal JAC", desc: "Sede de la Junta de Acción Comunal.", category: "institucional", emoji: "🏛", color: TEAL, lat: 10.4004, lng: -75.4893, hours: "Lun–Vie 8 a.m.–5 p.m." },
  { id: 2, name: "Parque Principal", desc: "Zona verde central.", category: "deporte", emoji: "🌳", color: "#16A34A", lat: 10.4010, lng: -75.4880 },
  { id: 3, name: "Cancha de Microfútbol", desc: "Cancha deportiva barrial.", category: "deporte", emoji: "⚽", color: CORAL, lat: 10.3995, lng: -75.4870, hours: "6 a.m.–10 p.m." },
  { id: 4, name: "Puesto de Salud", desc: "Atención médica básica.", category: "salud", emoji: "🏥", color: "#DC2626", lat: 10.4020, lng: -75.4910, hours: "Lun–Vie 7 a.m.–4 p.m." },
  { id: 5, name: "Institución Educativa", desc: "Centro educativo del barrio.", category: "educacion", emoji: "🏫", color: "#7B4FBF", lat: 10.4015, lng: -75.4895 },
  { id: 6, name: "Biblioteca Barrial", desc: "Lectura, formación y talleres.", category: "educacion", emoji: "📚", color: "#2E86AB", lat: 10.3988, lng: -75.4905, hours: "Lun–Sáb 8 a.m.–6 p.m." },
  { id: 7, name: "Iglesia Comunitaria", desc: "Parroquia del barrio.", category: "religion", emoji: "⛪", color: "#B45309", lat: 10.4025, lng: -75.4875 },
  { id: 8, name: "Tienda Doña Carmen", desc: "Abarrotes y víveres.", category: "comercio", emoji: "🛒", color: "#16A34A", lat: 10.3992, lng: -75.4888, phone: "300 123 4567", hours: "6 a.m.–9 p.m." },
  { id: 9, name: "Droguería San Rafael", desc: "Farmacia comunitaria.", category: "salud", emoji: "💊", color: "#DC2626", lat: 10.4000, lng: -75.4878, phone: "306 789 0123", hours: "8 a.m.–8 p.m." },
  { id: 10, name: "Polideportivo Comunal", desc: "Instalaciones deportivas.", category: "deporte", emoji: "🏟", color: CORAL, lat: 10.4030, lng: -75.4900 },
];

const DEFAULT_DIRECTORY: DirectoryBusiness[] = [
  { id: 1, name: "Tienda Doña Carmen", category: "Abarrotes", phone: "300 123 4567", emoji: "🛒", hours: "6 a.m. – 9 p.m." },
  { id: 2, name: "Peluquería Estilo Gaviotas", category: "Belleza", phone: "301 234 5678", emoji: "✂️", hours: "8 a.m. – 7 p.m." },
  { id: 3, name: "Moto-Taxis Las Gaviotas", category: "Transporte", phone: "302 345 6789", emoji: "🛵", hours: "5 a.m. – 11 p.m." },
  { id: 4, name: "Papelería El Estudiante", category: "Papelería", phone: "303 456 7890", emoji: "📚", hours: "7 a.m. – 6 p.m." },
  { id: 5, name: "Comidas Rápidas Marisol", category: "Alimentos", phone: "304 567 8901", emoji: "🍖", hours: "11 a.m. – 10 p.m." },
  { id: 6, name: "Ferretería El Constructor", category: "Ferretería", phone: "305 678 9012", emoji: "🔧", hours: "7 a.m. – 5 p.m." },
  { id: 7, name: "Droguería San Rafael", category: "Salud", phone: "306 789 0123", emoji: "💊", hours: "8 a.m. – 8 p.m." },
  { id: 8, name: "Lavandería Rápida", category: "Servicios", phone: "307 890 1234", emoji: "👕", hours: "8 a.m. – 6 p.m." },
];

const DEFAULT_GALLERY: GalleryPhoto[] = [
  { id: "1", url: "https://images.unsplash.com/photo-1519689680058-324335573bb0?w=600&h=600&fit=crop&auto=format", caption: "Vista del barrio Las Gaviotas", category: "Barrio" },
  { id: "2", url: "https://images.unsplash.com/photo-1583900985737-3f9fd8e62aef?w=600&h=600&fit=crop&auto=format", caption: "Parque principal", category: "Espacios" },
  { id: "3", url: "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=600&h=600&fit=crop&auto=format", caption: "Cancha deportiva", category: "Deporte" },
  { id: "4", url: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600&h=600&fit=crop&auto=format", caption: "Jóvenes en actividad formativa", category: "Comunidad" },
  { id: "5", url: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&h=600&fit=crop&auto=format", caption: "Brigada de salud", category: "Salud" },
  { id: "6", url: "https://images.unsplash.com/photo-1570639066095-8e09ece90bc0?w=600&h=600&fit=crop&auto=format", caption: "Actividades culturales", category: "Cultura" },
];

const DEFAULT_CHATBOT: ChatbotEntry[] = [
  { id: 1, patterns: "jac, junta, accion comunal, reunion, asamblea", answer: "🏛 *JAC Las Gaviotas*\n\nReuniones: primer sábado de cada mes, 9 a.m.\nLugar: Salón Comunal\nHorario: Lun–Vie, 8 a.m. – 5 p.m." },
  { id: 2, patterns: "agua, acueducto, aguas de cartagena, corte de agua", answer: "💧 *Aguas de Cartagena*\n\nReportar fallas: 6415001\nLínea nacional: 018000 111 100" },
  { id: 3, patterns: "salud, medico, doctor, hospital, urgencias", answer: "🏥 *Salud*\n\nPuesto de Salud: Lun–Vie 7 a.m.–4 p.m.\nUrgencias: Hospital Universitario del Caribe\nEmergencias: 123" },
];

const DEFAULT_EMERGENCY: EmergencyLine[] = [
  { id: 1, emoji: "👮", label: "Policía Nacional", num: "112", desc: "Emergencias policiales" },
  { id: 2, emoji: "🚒", label: "Bomberos Cartagena", num: "119", desc: "Incendios y rescates" },
  { id: 3, emoji: "🚑", label: "Ambulancia (SAMU)", num: "125", desc: "Emergencias médicas" },
  { id: 4, emoji: "📞", label: "Línea de Emergencias", num: "123", desc: "Central única de emergencias" },
  { id: 5, emoji: "🏥", label: "Hospital Univ. del Caribe", num: "6644000", desc: "Urgencias hospitalarias" },
  { id: 6, emoji: "💧", label: "Aguas de Cartagena", num: "6415001", desc: "Averías acueducto" },
  { id: 7, emoji: "⚡", label: "Afinia (Electricidad)", num: "6644444", desc: "Fallas eléctricas" },
  { id: 8, emoji: "🔥", label: "Defensa Civil", num: "144", desc: "Desastres naturales" },
  { id: 9, emoji: "👧", label: "ICBF (niñez)", num: "018000918080", desc: "Protección de niños y familias" },
  { id: 10, emoji: "🆘", label: "Línea 155 (violencia)", num: "155", desc: "Violencia intrafamiliar y género" },
  { id: 11, emoji: "🏛", label: "JAC Las Gaviotas", num: "3001234567", desc: "Junta de Acción Comunal" },
];

const DEFAULT_SETTINGS: AppSettings = {
  appName: "Gaviotas Conecta",
  logoEmoji: "🦅",
  neighborhood: "Barrio Las Gaviotas",
  city: "Cartagena de Indias",
  presidentName: "[Nombre del Presidente]",
  presidentEmail: "jac.lasgaviotas@correo.com",
  resolutionNumber: "[Número]",
  nit: "[NIT]",
  presidentSignature: "",
  certTextP2: "Que, según la información y los soportes aportados por el(la) interesado(a), y hasta la fecha de expedición, se le reconoce como vecino(a) de esta comunidad.",
  certTextDisclaimer: "Este certificado se expide con base en la información suministrada por el(la) solicitante, quien responde por su veracidad. Cualquier alteración lo invalida.",
};

// ── Oficios del Barrio ────────────────────────────────────────────────────────
export type OfficioStatus = "pendiente" | "aprobado" | "pausado" | "rechazado";
export type OfficioCategory =
  | "Plomería" | "Electricidad" | "Albañilería" | "Pintura" | "Carpintería"
  | "Soldadura" | "Aires y neveras" | "Mecánica" | "Modistería" | "Belleza a domicilio"
  | "Refuerzo escolar" | "Cuidado adultos mayores" | "Lavandería" | "Cocina y eventos" | "Otros";

export interface OfficioReview {
  id: string;
  authorName: string;
  authorId: string;
  workerId: string;
  stars: number;
  comment: string;
  date: string;
}

export interface OfficioWorker {
  id: string;
  authorId: string;
  status: OfficioStatus;
  rejectionReason?: string;
  createdAt: string;
  // Personal
  fullName: string;
  cedula: string; // admin-only, never shown publicly
  phone: string;
  whatsapp: string;
  sector: string;
  isAdult: boolean;
  // Work
  categories: OfficioCategory[];
  yearsExp: number;
  schedule: string;
  urgency: boolean;
  description: string;
  // Profile
  photo?: string;
  workPhotos: string[];
  // Admin badges
  verified: boolean; // "Vecino verificado JAC"
  // Availability
  availableToday: boolean;
  // Stats
  hiredCount: number;
}

const DEFAULT_WORKERS: OfficioWorker[] = [
  {
    id: "w1", authorId: "demo1", status: "aprobado", createdAt: "2026-09-01T10:00:00Z",
    fullName: "Carlos Herrera", cedula: "73001234", phone: "3001112233", whatsapp: "3001112233",
    sector: "Sector Norte", isAdult: true,
    categories: ["Plomería", "Albañilería"], yearsExp: 8, schedule: "Lun–Sáb 7 a.m.–5 p.m.", urgency: true,
    description: "Trabajo en plomería residencial y obras menores. Puntual y garantizo mis trabajos.",
    photo: undefined, workPhotos: [], verified: true, availableToday: true, hiredCount: 24,
  },
  {
    id: "w2", authorId: "demo2", status: "aprobado", createdAt: "2026-09-05T09:00:00Z",
    fullName: "María González", cedula: "45678901", phone: "3112223344", whatsapp: "3112223344",
    sector: "Sector Central", isAdult: true,
    categories: ["Belleza a domicilio"], yearsExp: 5, schedule: "Mar–Dom 9 a.m.–6 p.m.", urgency: false,
    description: "Cortes, tintes, manicure y pedicure a domicilio. Productos de calidad.",
    photo: undefined, workPhotos: [], verified: true, availableToday: false, hiredCount: 61,
  },
  {
    id: "w3", authorId: "demo3", status: "aprobado", createdAt: "2026-09-10T14:00:00Z",
    fullName: "Andrés Martínez", cedula: "80234567", phone: "3201234567", whatsapp: "3201234567",
    sector: "Sector Sur", isAdult: true,
    categories: ["Electricidad"], yearsExp: 12, schedule: "Lun–Vie 8 a.m.–6 p.m., urgencias 24h", urgency: true,
    description: "Electricista certificado RETIE. Instalaciones, cableado, tableros y urgencias.",
    photo: undefined, workPhotos: [], verified: false, availableToday: true, hiredCount: 37,
  },
  {
    id: "w4", authorId: "demo4", status: "aprobado", createdAt: "2026-09-12T08:00:00Z",
    fullName: "Lucía Romero", cedula: "52345678", phone: "3156789012", whatsapp: "3156789012",
    sector: "Sector Norte", isAdult: true,
    categories: ["Refuerzo escolar"], yearsExp: 3, schedule: "Lun–Sáb 2 p.m.–8 p.m.", urgency: false,
    description: "Clases de matemáticas, español e inglés para primaria y bachillerato. Resultados garantizados.",
    photo: undefined, workPhotos: [], verified: true, availableToday: true, hiredCount: 18,
  },
];

const DEFAULT_REVIEWS: OfficioReview[] = [
  { id: "r1", authorName: "Sandra P.", authorId: "user1", workerId: "w1", stars: 5, comment: "Excelente trabajo, arregló la tubería rápido y no dejó desorden.", date: "2026-09-15" },
  { id: "r2", authorName: "Jorge M.", authorId: "user2", workerId: "w1", stars: 4, comment: "Buen trabajo, cumplió lo acordado.", date: "2026-09-10" },
  { id: "r3", authorName: "Carmen V.", authorId: "user3", workerId: "w2", stars: 5, comment: "María es una artista, quedé muy satisfecha con el trabajo.", date: "2026-09-18" },
  { id: "r4", authorName: "Pedro L.", authorId: "user4", workerId: "w3", stars: 5, comment: "Resolvió la emergencia eléctrica a las 11 pm. Muy profesional.", date: "2026-09-20" },
];

// ── Supabase sync ────────────────────────────────────────────────────────────
type Row = Record<string, any>;
type ContentKey = "news" | "events" | "places" | "directory" | "gallery" | "chatbot" | "emergency";

const CONTENT_DEFAULTS: Record<ContentKey, { id: string | number }[]> = {
  news: DEFAULT_NEWS, events: DEFAULT_EVENTS, places: DEFAULT_PLACES, directory: DEFAULT_DIRECTORY,
  gallery: DEFAULT_GALLERY, chatbot: DEFAULT_CHATBOT, emergency: DEFAULT_EMERGENCY,
};

const session: { userId: string; isAdmin: boolean; user: { name: string; email: string } | null } = { userId: "", isAdmin: false, user: null };

const cache = {
  news: [...DEFAULT_NEWS] as NewsItem[],
  events: [...DEFAULT_EVENTS] as EventItem[],
  places: [...DEFAULT_PLACES] as Place[],
  directory: [...DEFAULT_DIRECTORY] as DirectoryBusiness[],
  gallery: [...DEFAULT_GALLERY] as GalleryPhoto[],
  chatbot: [...DEFAULT_CHATBOT] as ChatbotEntry[],
  emergency: [...DEFAULT_EMERGENCY] as EmergencyLine[],
  settings: { ...DEFAULT_SETTINGS } as AppSettings,
  certificates: [] as CertificateRequest[],
  lostFound: [] as LostFoundItem[],
  workers: [] as OfficioWorker[],
  reviews: [] as OfficioReview[],
};

// Última versión sincronizada de cada registro, para enviar solo lo que cambió.
const synced: Record<string, Map<string, string>> = {};
function snapshot(key: string, list: { id: string | number }[]) {
  synced[key] = new Map(list.map((i) => [String(i.id), JSON.stringify(i)]));
}
function diff<T extends { id: string | number }>(key: string, list: T[]) {
  const prev = synced[key] ?? new Map<string, string>();
  const added: T[] = [], changed: T[] = [];
  const ids = new Set<string>();
  for (const item of list) {
    const id = String(item.id);
    ids.add(id);
    const json = JSON.stringify(item);
    if (!prev.has(id)) added.push(item);
    else if (prev.get(id) !== json) changed.push(item);
  }
  const removed = [...prev.keys()].filter((id) => !ids.has(id));
  snapshot(key, list);
  return { added, changed, removed };
}

function report(action: string, error: { message: string } | null, loud = true) {
  if (!error) return;
  console.error(`[Gaviotas] ${action}:`, error.message);
  if (!loud) return;
  const m = error.message;
  if (m.includes("LIMITE_DIARIO")) alert("Alcanzaste el máximo de publicaciones permitidas por hoy. Inténtalo de nuevo mañana.");
  else if (m.includes("_data_size") || m.includes("_len")) alert("El contenido es demasiado grande. Usa menos fotos o un texto más corto.");
  else if (m.includes("row-level security")) alert("No tienes permiso para hacer esta acción.");
  else alert(`No se pudo ${action}. Revisa tu conexión e inténtalo de nuevo.`);
}

const uuid = () => crypto.randomUUID();

function omit(obj: Row, keys: string[]): Row {
  const out: Row = {};
  for (const k of Object.keys(obj)) if (!keys.includes(k) && obj[k] !== undefined) out[k] = obj[k];
  return out;
}

// ── Fotos: se suben al almacenamiento y en la base de datos queda solo el enlace ──
// "publico": fotos que cualquiera puede ver (perdidos, oficios, noticias, galería).
// "certificados": documentos privados (cédulas, recibos, firma); solo dueño y JAC,
// mediante enlaces firmados que vencen.
type Bucket = "publico" | "certificados";
const DATA_URL = /^data:image\/(png|jpe?g|webp);base64,/i;
const PRIVATE_PREFIX = "storage://certificados/";
const signedToPrivate = new Map<string, string>();

async function uploadDataUrl(bucket: Bucket, dataUrl: string): Promise<string> {
  const blob = await (await fetch(dataUrl)).blob();
  const ext = blob.type === "image/png" ? "png" : blob.type === "image/webp" ? "webp" : "jpg";
  const path = `${session.userId}/${uuid()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, blob, { contentType: blob.type, upsert: false });
  if (error) throw error;
  return bucket === "publico" ? supabase.storage.from("publico").getPublicUrl(path).data.publicUrl : PRIVATE_PREFIX + path;
}

/** Sube cada foto en base64 del objeto y la reemplaza (en el mismo objeto) por su enlace. */
async function externalizeImages(obj: Row, bucket: Bucket): Promise<boolean> {
  let changed = false;
  const visit = async (o: Row) => {
    for (const k of Object.keys(o)) {
      const v = o[k];
      if (typeof v === "string" && DATA_URL.test(v)) { o[k] = await uploadDataUrl(bucket, v); changed = true; }
      else if (v && typeof v === "object") await visit(v);
    }
  };
  await visit(obj);
  return changed;
}

/** Copia del objeto con los enlaces firmados convertidos de nuevo a referencias privadas. */
function restorePrivate<T>(value: T): T {
  if (typeof value === "string") return (signedToPrivate.get(value) ?? value) as T;
  if (Array.isArray(value)) return value.map(restorePrivate) as T;
  if (value && typeof value === "object") {
    const out: Row = {};
    for (const [k, v] of Object.entries(value)) out[k] = restorePrivate(v);
    return out as T;
  }
  return value;
}

/** Reemplaza (en el mismo objeto) las referencias privadas por enlaces firmados de 12 horas. */
async function resolvePrivate(objs: Row[]) {
  const refs: { o: Row; k: string; path: string }[] = [];
  const visit = (o: Row) => {
    for (const k of Object.keys(o)) {
      const v = o[k];
      if (typeof v === "string" && v.startsWith(PRIVATE_PREFIX)) refs.push({ o, k, path: v.slice(PRIVATE_PREFIX.length) });
      else if (v && typeof v === "object") visit(v);
    }
  };
  objs.forEach(visit);
  if (!refs.length) return;
  const { data } = await supabase.storage.from("certificados").createSignedUrls([...new Set(refs.map((r) => r.path))], 60 * 60 * 12);
  const byPath = new Map((data ?? []).filter((d) => d.signedUrl).map((d) => [d.path, d.signedUrl]));
  for (const r of refs) {
    const url = byPath.get(r.path);
    if (url) { signedToPrivate.set(url, PRIVATE_PREFIX + r.path); r.o[r.k] = url; }
  }
}

function markSynced(key: string, item: { id: string | number }) {
  synced[key]?.set(String(item.id), JSON.stringify(item));
}

// ── Mapeo filas ⇄ objetos de la app ──────────────────────────────────────────
const CERT_COLS = ["id", "consecutive", "createdAt", "status", "adminComment", "approvedAt"];
const certFromRow = (r: Row): CertificateRequest => ({
  ...r.data, id: r.id, consecutive: r.consecutive, createdAt: r.created_at, status: r.status,
  adminComment: r.admin_comment ?? undefined, approvedAt: r.approved_at ?? undefined,
});
const certToRow = (c: CertificateRequest): Row => ({
  id: c.id, status: c.status, admin_comment: c.adminComment ?? null, approved_at: c.approvedAt ?? null,
  data: restorePrivate(omit(c as unknown as Row, CERT_COLS)),
});

const LF_COLS = ["id", "status", "createdAt", "resolvedAt", "authorId"];
const lfFromRow = (r: Row): LostFoundItem => ({
  ...r.data, id: r.id, status: r.status, createdAt: r.created_at, resolvedAt: r.resolved_at ?? undefined, authorId: r.author_id,
});
const lfToRow = (i: LostFoundItem): Row => ({
  id: i.id, status: i.status, resolved_at: i.resolvedAt ?? null, data: omit(i as unknown as Row, LF_COLS),
});

const W_COLS = ["id", "authorId", "status", "rejectionReason", "createdAt", "verified", "hiredCount", "cedula"];
const workerFromRow = (r: Row, cedulas: Map<string, string>): OfficioWorker => ({
  ...r.data, id: r.id, authorId: r.author_id, status: r.status, rejectionReason: r.rejection_reason ?? undefined,
  createdAt: r.created_at, verified: r.verified, hiredCount: r.hired_count, cedula: cedulas.get(r.id) ?? "",
});
const workerToRow = (w: OfficioWorker): Row => ({
  id: w.id, status: w.status, rejection_reason: w.rejectionReason ?? null, verified: w.verified,
  hired_count: w.hiredCount, data: omit(w as unknown as Row, W_COLS),
});

const reviewFromRow = (r: Row): OfficioReview => ({
  id: r.id, workerId: r.worker_id, authorId: r.author_id, authorName: r.author_name,
  stars: r.stars, comment: r.comment, date: String(r.created_at).slice(0, 10),
});

// ── Escritura ────────────────────────────────────────────────────────────────
async function syncContent(key: ContentKey, list: { id: string | number }[]) {
  const { removed } = diff(key, list);
  try {
    for (const item of list) await externalizeImages(item as Row, "publico");
    snapshot(key, list);
  } catch (e) { report("subir las fotos", e as { message: string }); return; }
  const rows = list.map((item, i) => ({ collection: key, id: String(item.id), sort_order: i, data: item, updated_at: new Date().toISOString() }));
  if (rows.length) report("guardar los cambios", (await supabase.from("content_items").upsert(rows)).error);
  if (removed.length) report("borrar", (await supabase.from("content_items").delete().eq("collection", key).in("id", removed)).error);
}

async function syncTable<T extends { id: string }>(
  key: string, table: string, list: T[], toRow: (t: T) => Row, canEdit: (t: T) => boolean,
  afterInsert?: (t: T) => Promise<void>, bucket?: Bucket,
) {
  const { added, changed, removed } = diff(key, list);
  // Sube primero las fotos nuevas; si falla, no se guarda el registro.
  for (const item of [...added, ...changed.filter(canEdit)]) {
    if (!bucket) break;
    try { if (await externalizeImages(item as Row, bucket)) markSynced(key, item); }
    catch (e) { report("subir las fotos", e as { message: string }); return; }
  }
  for (const item of added) {
    const { error } = await supabase.from(table).insert(toRow(item));
    report("guardar", error);
    if (!error && afterInsert) await afterInsert(item);
  }
  for (const item of changed) {
    if (!canEdit(item)) continue;
    const row = toRow(item);
    delete row.id;
    report("actualizar", (await supabase.from(table).update(row).eq("id", item.id)).error, session.isAdmin);
  }
  if (removed.length && session.isAdmin) report("borrar", (await supabase.from(table).delete().in("id", removed)).error);
}

// ── Lectura ──────────────────────────────────────────────────────────────────
async function loadAll() {
  const { data: adm } = await supabase.rpc("is_admin");
  session.isAdmin = adm === true;

  const [content, settings, certs, lf, workers, priv, reviews] = await Promise.all([
    supabase.from("content_items").select("collection,id,data").order("sort_order"),
    supabase.from("app_settings").select("data").eq("id", 1).maybeSingle(),
    supabase.from("certificates").select("*").order("created_at").limit(500),
    supabase.from("lost_found").select("*").order("created_at", { ascending: false }).limit(300),
    supabase.from("workers").select("*").order("created_at").limit(500),
    supabase.from("worker_private").select("worker_id,cedula"),
    supabase.from("reviews").select("*").order("created_at", { ascending: false }).limit(2000),
  ]);

  if (!content.error && content.data) {
    for (const key of Object.keys(CONTENT_DEFAULTS) as ContentKey[]) {
      (cache[key] as Row[]) = content.data.filter((r) => r.collection === key).map((r) => r.data);
    }
  } else report("cargar el contenido", content.error, false);
  if (settings.data) cache.settings = { ...DEFAULT_SETTINGS, ...settings.data.data };

  const cedulas = new Map<string, string>((priv.data ?? []).map((p) => [p.worker_id, p.cedula]));
  cache.certificates = (certs.data ?? []).map(certFromRow);
  cache.lostFound = (lf.data ?? []).map(lfFromRow);
  cache.workers = (workers.data ?? []).map((r) => workerFromRow(r, cedulas));
  cache.reviews = (reviews.data ?? []).map(reviewFromRow).reverse();
  await resolvePrivate([...cache.certificates, cache.settings] as Row[]);

  for (const key of Object.keys(CONTENT_DEFAULTS) as ContentKey[]) snapshot(key, cache[key]);
  snapshot("certificates", cache.certificates);
  snapshot("lostFound", cache.lostFound);
  snapshot("workers", cache.workers);
  snapshot("reviews", cache.reviews);
}

type AuthUser = { id: string; email?: string; is_anonymous?: boolean; user_metadata?: Row };
function setUser(u: AuthUser | null | undefined) {
  session.userId = u?.id ?? "";
  session.user = u && !u.is_anonymous && u.email
    ? { name: u.user_metadata?.full_name || u.email.split("@")[0], email: u.email }
    : null;
}

async function startClaim(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  if (!data.session?.user.is_anonymous) return null;
  const { data: code } = await supabase.rpc("start_claim");
  return (code as string | null) ?? null;
}

async function afterAccountLogin(claimCode: string | null) {
  const { data } = await supabase.auth.getUser();
  setUser(data.user);
  if (claimCode) await supabase.rpc("finish_claim", { claim_code: claimCode });
  await loadAll();
}

function authError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login")) return "Correo o contraseña incorrectos.";
  if (m.includes("already registered") || m.includes("already been registered")) return "Ese correo ya tiene una cuenta. Inicia sesión.";
  if (m.includes("email not confirmed")) return "Debes confirmar tu correo antes de iniciar sesión.";
  if (m.includes("password")) return "La contraseña no es válida (mínimo 6 caracteres).";
  if (m.includes("rate limit") || m.includes("too many")) return "Demasiados intentos. Espera unos minutos.";
  return "No se pudo completar. Revisa tu conexión e inténtalo de nuevo.";
}

async function ensureVisitorSession() {
  const { data } = await supabase.auth.getSession();
  if (data.session) { setUser(data.session.user); return; }
  const { data: anon, error } = await supabase.auth.signInAnonymously();
  report("iniciar la sesión", error, false);
  setUser(anon.user);
}

// ── Store API ─────────────────────────────────────────────────────────────────
export const store = {
  /** Abre sesión (anónima para vecinos) y carga todos los datos. Llamar antes de renderizar. */
  async init() {
    try { await ensureVisitorSession(); await loadAll(); }
    catch (e) { console.error("[Gaviotas] init", e); }
  },
  reload: loadAll,

  isAdmin: () => session.isAdmin,

  /** Vecino con cuenta (no anónimo), o null. */
  currentUser: () => session.user,

  /** Crea una cuenta de vecino. Lo que publicó sin cuenta en este celular pasa a su cuenta. */
  async signUp(name: string, email: string, phone: string, password: string): Promise<string | null> {
    const code = await startClaim();
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(), password,
      options: { data: { full_name: name.trim(), phone: phone.trim() } },
    });
    if (error) return authError(error.message);
    if (!data.session) return "Te enviamos un correo para confirmar tu cuenta. Ábrelo y luego inicia sesión.";
    await afterAccountLogin(code);
    return null;
  },

  /** Inicia sesión de vecino con correo y contraseña. */
  async signIn(email: string, password: string): Promise<string | null> {
    const code = await startClaim();
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) return authError(error.message);
    await afterAccountLogin(code);
    return null;
  },

  async signOut() {
    await supabase.auth.signOut();
    session.isAdmin = false;
    session.user = null;
    await ensureVisitorSession();
    await loadAll();
  },

  /** true si la app se abrió desde el enlace de recuperar contraseña. */
  isPasswordRecovery: () => openedFromRecoveryLink && !!session.user,

  /** Guarda la contraseña nueva después de abrir el enlace de recuperación. */
  async setNewPassword(password: string): Promise<string | null> {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return authError(error.message);
    history.replaceState(null, "", window.location.pathname);
    return null;
  },

  async sendPasswordReset(email: string): Promise<string | null> {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin });
    return error ? authError(error.message) : null;
  },

  /** Inicia sesión de administrador. Devuelve un mensaje de error o null si todo salió bien. */
  async adminSignIn(email: string, password: string): Promise<string | null> {
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) return "Correo o contraseña incorrectos";
    setUser(data.user);
    await loadAll();
    if (!session.isAdmin) { await store.adminSignOut(); return "Esta cuenta no tiene permisos de administrador"; }
    return null;
  },
  async adminSignOut() { await store.signOut(); },
  async changeAdminPassword(password: string): Promise<string | null> {
    const { error } = await supabase.auth.updateUser({ password });
    return error ? error.message : null;
  },

  getNews: () => cache.news,
  setNews: (v: NewsItem[]) => { cache.news = v; void syncContent("news", v); },

  getEvents: () => cache.events,
  setEvents: (v: EventItem[]) => { cache.events = v; void syncContent("events", v); },

  getPlaces: () => cache.places,
  setPlaces: (v: Place[]) => { cache.places = v; void syncContent("places", v); },

  getDirectory: () => cache.directory,
  setDirectory: (v: DirectoryBusiness[]) => { cache.directory = v; void syncContent("directory", v); },

  getGallery: () => cache.gallery,
  setGallery: (v: GalleryPhoto[]) => { cache.gallery = v; void syncContent("gallery", v); },

  getChatbot: () => cache.chatbot,
  setChatbot: (v: ChatbotEntry[]) => { cache.chatbot = v; void syncContent("chatbot", v); },

  getEmergency: () => cache.emergency,
  setEmergency: (v: EmergencyLine[]) => { cache.emergency = v; void syncContent("emergency", v); },

  getSettings: () => cache.settings,
  setSettings: (v: AppSettings) => {
    const { adminPassword: _ignored, ...data } = v;
    cache.settings = data;
    void (async () => {
      // La firma del presidente se guarda en el almacenamiento privado, no pública.
      try { await externalizeImages(data as Row, "certificados"); }
      catch (e) { report("subir la firma", e as { message: string }); return; }
      await resolvePrivate([data as Row]);
      const { error } = await supabase.from("app_settings")
        .update({ data: restorePrivate(data), updated_at: new Date().toISOString() }).eq("id", 1);
      report("guardar los ajustes", error);
    })();
  },

  getCertificates: () => cache.certificates,
  setCertificates: (v: CertificateRequest[]) => {
    cache.certificates = v;
    void syncTable("certificates", "certificates", v, certToRow, () => true, undefined, "certificados");
  },
  /** Envía una solicitud nueva; las fotos van al almacenamiento privado y el servidor asigna el consecutivo. */
  async addCertificate(req: CertificateRequest): Promise<CertificateRequest | null> {
    const copy = structuredClone(req);
    try { await externalizeImages(copy as unknown as Row, "certificados"); }
    catch (e) { report("subir las fotos", e as { message: string }); return null; }
    const { data, error } = await supabase.from("certificates").insert({ ...certToRow(copy), status: "Enviada" }).select().single();
    report("enviar la solicitud", error);
    if (error || !data) return null;
    const saved = certFromRow(data);
    await resolvePrivate([saved as unknown as Row]);
    cache.certificates = [...cache.certificates, saved];
    snapshot("certificates", cache.certificates);
    return saved;
  },

  getLostFound: () => cache.lostFound,
  setLostFound: (v: LostFoundItem[]) => {
    cache.lostFound = v;
    void syncTable("lostFound", "lost_found", v, lfToRow, (i) => session.isAdmin || i.authorId === session.userId, undefined, "publico");
  },

  getWorkers: () => cache.workers,
  setWorkers: (v: OfficioWorker[]) => {
    cache.workers = v;
    void syncTable("workers", "workers", v, workerToRow,
      (w) => session.isAdmin || w.authorId === session.userId,
      async (w) => {
        if (w.cedula) report("guardar la cédula", (await supabase.from("worker_private").insert({ worker_id: w.id, cedula: w.cedula })).error);
      }, "publico");
  },

  getReviews: () => cache.reviews,
  setReviews: (v: OfficioReview[]) => {
    cache.reviews = v;
    void syncTable("reviews", "reviews", v,
      (r) => ({ id: r.id, worker_id: r.workerId, author_name: r.authorName, stars: r.stars, comment: r.comment }),
      () => false);
  },

  /** Id del usuario actual (anónimo o admin) en Supabase. */
  getAuthorId: () => session.userId,
  newId: uuid,
};
