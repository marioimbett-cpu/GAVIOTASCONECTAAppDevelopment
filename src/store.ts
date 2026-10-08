// ── Gaviotas Conecta — Data Store (localStorage) ─────────────────────────────
// All data editable from the admin panel is stored here.

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
  adminPassword: string;
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
  adminPassword: "admin2026",
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

// ── Generic helpers ──────────────────────────────────────────────────────────
function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// ── Store API ─────────────────────────────────────────────────────────────────
export const store = {
  getNews: () => load<NewsItem[]>("gc_news", DEFAULT_NEWS),
  setNews: (v: NewsItem[]) => save("gc_news", v),

  getEvents: () => load<EventItem[]>("gc_events", DEFAULT_EVENTS),
  setEvents: (v: EventItem[]) => save("gc_events", v),

  getPlaces: () => load<Place[]>("gc_places", DEFAULT_PLACES),
  setPlaces: (v: Place[]) => save("gc_places", v),

  getDirectory: () => load<DirectoryBusiness[]>("gc_directory", DEFAULT_DIRECTORY),
  setDirectory: (v: DirectoryBusiness[]) => save("gc_directory", v),

  getGallery: () => load<GalleryPhoto[]>("gc_gallery", DEFAULT_GALLERY),
  setGallery: (v: GalleryPhoto[]) => save("gc_gallery", v),

  getChatbot: () => load<ChatbotEntry[]>("gc_chatbot", DEFAULT_CHATBOT),
  setChatbot: (v: ChatbotEntry[]) => save("gc_chatbot", v),

  getEmergency: () => load<EmergencyLine[]>("gc_emergency", DEFAULT_EMERGENCY),
  setEmergency: (v: EmergencyLine[]) => save("gc_emergency", v),

  getSettings: () => load<AppSettings>("gc_settings", DEFAULT_SETTINGS),
  setSettings: (v: AppSettings) => save("gc_settings", v),

  getCertificates: () => load<CertificateRequest[]>("gc_certificates", []),
  setCertificates: (v: CertificateRequest[]) => save("gc_certificates", v),

  getLostFound: () => load<LostFoundItem[]>("gc_lostfound", []),
  setLostFound: (v: LostFoundItem[]) => save("gc_lostfound", v),

  getWorkers: () => load<OfficioWorker[]>("gc_workers", DEFAULT_WORKERS),
  setWorkers: (v: OfficioWorker[]) => save("gc_workers", v),

  getReviews: () => load<OfficioReview[]>("gc_reviews", DEFAULT_REVIEWS),
  setReviews: (v: OfficioReview[]) => save("gc_reviews", v),

  getAuthorId: () => {
    let id = localStorage.getItem("gc_author_id");
    if (!id) { id = Date.now().toString(36) + Math.random().toString(36).slice(2); localStorage.setItem("gc_author_id", id); }
    return id;
  },
};
