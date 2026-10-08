import { useState } from "react";
import {
  MapContainer, TileLayer, Marker, Popup,
  Polygon, ZoomControl, useMap,
} from "react-leaflet";
import L from "leaflet";
import markerIconPng from "leaflet/dist/images/marker-icon.png";
import markerShadowPng from "leaflet/dist/images/marker-shadow.png";
import { store } from "./store";

// ── Fix Leaflet default icon en Vite ─────────────────────────────────────
L.Marker.prototype.options.icon = L.icon({
  iconUrl: markerIconPng,
  shadowUrl: markerShadowPng,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// ── Brand ────────────────────────────────────────────────────────────────
const TEAL  = "#0D6E6E";
const CORAL = "#E8643A";

// ── Coordenadas del Barrio Las Gaviotas, Cartagena de Indias ─────────────
// Fuente: OpenStreetMap / Nominatim (polígono oficial del barrio)
const CENTER: [number, number] = [10.4004, -75.4893];

// Polígono oficial del barrio según OpenStreetMap (OSM Way W1385977938)
const BARRIO_BOUNDARY: [number, number][] = [
  [10.3982196,-75.4931611],[10.3981014,-75.4930949],[10.3980439,-75.493056],
  [10.3979847,-75.4930038],[10.3979507,-75.4929742],[10.3979094,-75.4929381],
  [10.3978412,-75.4928786],[10.3978098,-75.4928521],[10.39773,-75.4927798],
  [10.396943,-75.4920796],[10.3968762,-75.4920193],[10.3968454,-75.4919901],
  [10.3968308,-75.4919762],[10.3968174,-75.4919643],[10.396723,-75.4918832],
  [10.396687,-75.4918511],[10.3974826,-75.4909333],[10.397644,-75.4907472],
  [10.3976625,-75.490717],[10.3976749,-75.4906837],[10.3976796,-75.4906559],
  [10.3976764,-75.4906249],[10.3975951,-75.4901239],[10.3975355,-75.4900526],
  [10.3973454,-75.4898734],[10.3972648,-75.4897946],[10.3971655,-75.4898978],
  [10.3967513,-75.4903541],[10.3966708,-75.4904429],[10.3966022,-75.4905184],
  [10.3964787,-75.4901193],[10.3964033,-75.4898551],[10.3964319,-75.4898548],
  [10.396427,-75.4898251],[10.396421,-75.4897882],[10.3963933,-75.4896184],
  [10.3963874,-75.4895823],[10.3963547,-75.4893818],[10.3963519,-75.4893647],
  [10.396346,-75.4893287],[10.396399,-75.4893043],[10.3964826,-75.4892679],
  [10.396557,-75.4892423],[10.3966041,-75.4892311],[10.396666,-75.4892219],
  [10.3968478,-75.4892201],[10.3971786,-75.4892219],[10.3973108,-75.4892254],
  [10.397529,-75.4892219],[10.3976061,-75.489219],[10.3976206,-75.488478],
  [10.397621,-75.4884598],[10.3976485,-75.487776],[10.397653,-75.4876124],
  [10.3976544,-75.4875164],[10.3976962,-75.4864437],[10.3977225,-75.4852596],
  [10.3987769,-75.4856954],[10.3996589,-75.48603],[10.3998746,-75.486105],
  [10.4000083,-75.4861358],[10.4011877,-75.4862561],[10.4012202,-75.4862617],
  [10.401611,-75.486372],[10.4019599,-75.4865014],[10.4025495,-75.4867567],
  [10.4026506,-75.4867973],[10.4026058,-75.4868698],[10.4022952,-75.4872593],
  [10.4028276,-75.4875211],[10.4030716,-75.4876078],[10.4033573,-75.487782],
  [10.4035562,-75.487907],[10.4037798,-75.4880567],[10.4039352,-75.4881683],
  [10.4041859,-75.4883695],[10.4043778,-75.4885485],[10.404013,-75.4885546],
  [10.4034288,-75.488575],[10.4033908,-75.48857],[10.4031366,-75.4885798],
  [10.4029147,-75.4885935],[10.4026521,-75.4886342],[10.402761,-75.488889],
  [10.4028591,-75.4891278],[10.4029501,-75.4893623],[10.4029747,-75.4894362],
  [10.4030426,-75.4896185],[10.403088,-75.4897476],[10.4031155,-75.4898192],
  [10.4033166,-75.490358],[10.4034374,-75.4906433],[10.4035488,-75.4909619],
  [10.4032209,-75.4910785],[10.4029372,-75.4911841],[10.4026635,-75.4912952],
  [10.4026223,-75.4913117],[10.4023895,-75.4914058],[10.4023353,-75.4914283],
  [10.4021183,-75.49152],[10.4020414,-75.4915534],[10.4018601,-75.491636],
  [10.4017898,-75.4916868],[10.4017313,-75.4917228],[10.4016827,-75.4917452],
  [10.4016026,-75.4917778],[10.4015217,-75.4917957],[10.4008155,-75.4918415],
  [10.4008158,-75.491868],[10.4008085,-75.491894],[10.4007887,-75.4919315],
  [10.400679,-75.4920294],[10.4004353,-75.4922685],[10.4003641,-75.4923384],
  [10.4003518,-75.4923534],[10.400339,-75.4923636],[10.4003115,-75.4923746],
  [10.40031,-75.4923649],[10.4002761,-75.4921232],[10.4000452,-75.492145],
  [10.3999173,-75.4921571],[10.399497,-75.4923406],[10.3996074,-75.4924706],
  [10.3990428,-75.4927147],[10.3987849,-75.4929256],[10.3985215,-75.4929608],
  [10.3984147,-75.4929731],[10.3983818,-75.4929991],[10.3983407,-75.4930219],
  [10.3982528,-75.4930554],[10.3982304,-75.4930904],[10.3982206,-75.4931216],
  [10.3982196,-75.4931611],
];

// Límites del mapa (no deja salir del barrio)
const MAP_BOUNDS = L.latLngBounds(
  [10.3950, -75.4945],  // SW
  [10.4055, -75.4840],  // NE
);

// ── Types ────────────────────────────────────────────────────────────────
type Category = "todos" | string;

const CATEGORIES: { id: Category; label: string; emoji: string; color: string }[] = [
  { id: "todos",         label: "Todos",     emoji: "🗺️", color: TEAL      },
  { id: "institucional", label: "JAC",       emoji: "🏛",  color: TEAL      },
  { id: "salud",         label: "Salud",     emoji: "🏥",  color: "#DC2626" },
  { id: "educacion",     label: "Educación", emoji: "🏫",  color: "#7B4FBF" },
  { id: "deporte",       label: "Deporte",   emoji: "⚽",  color: CORAL     },
  { id: "comercio",      label: "Comercio",  emoji: "🛒",  color: "#16A34A" },
  { id: "religion",      label: "Iglesia",   emoji: "⛪",  color: "#B45309" },
  { id: "parque",        label: "Parque",    emoji: "🌳",  color: "#16A34A" },
];

// ── Custom emoji marker ────────────────────────────────────────────────────
function makeMarker(color: string, emoji: string, selected: boolean) {
  return L.divIcon({
    html: `
      <div style="
        position:relative;
        width:36px; height:44px;
        display:flex; flex-direction:column;
        align-items:center;
      ">
        <div style="
          width:36px; height:36px;
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          background:${selected ? color : "white"};
          border:3px solid ${color};
          box-shadow:0 4px 14px rgba(0,0,0,${selected ? "0.35" : "0.20"});
          display:flex; align-items:center; justify-content:center;
        ">
          <span style="
            transform:rotate(45deg);
            font-size:16px;
            line-height:1;
            display:block;
          ">${emoji}</span>
        </div>
        <div style="
          width:5px; height:8px;
          background:${color};
          clip-path:polygon(50% 100%,0 0,100% 0);
          margin-top:-2px;
        "></div>
      </div>`,
    className: "",
    iconSize: [36, 44],
    iconAnchor: [18, 44],
    popupAnchor: [0, -46],
  });
}

// ── Fly to helper ─────────────────────────────────────────────────────────
function FlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  map.flyTo([lat, lng], 18, { duration: 0.8 });
  return null;
}

// ── Map Screen ────────────────────────────────────────────────────────────
interface MapScreenProps {
  onBack: () => void;
  theme: {
    bg: string; card: string; border: string; ink: string;
    muted: string; surface: string; dark: boolean;
  };
}

export default function MapScreen({ onBack, theme }: MapScreenProps) {
  const [activeCategory, setActiveCategory] = useState<Category>("todos");
  const [selected, setSelected] = useState<ReturnType<typeof store.getPlaces>[0] | null>(null);
  const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number } | null>(null);

  const PLACES = store.getPlaces();
  const filtered = PLACES.filter(
    (p) => activeCategory === "todos" || p.category === activeCategory
  );

  function handleSelect(place: ReturnType<typeof store.getPlaces>[0]) {
    setSelected(place);
    setFlyTarget({ lat: place.lat, lng: place.lng });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: theme.bg }}>

      {/* Header */}
      <div style={{ padding: "16px 20px 0", flexShrink: 0 }}>
        <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: TEAL, fontSize: 14, fontWeight: 600, cursor: "pointer", padding: "0 0 10px" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M11 6l-6 6 6 6" stroke={TEAL} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Volver
        </button>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <div>
            <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 700, margin: "0 0 2px", color: theme.ink }}>
              Mapa del Barrio
            </h1>
            <p style={{ color: theme.muted, fontSize: 12, margin: 0 }}>
              Las Gaviotas · Cartagena de Indias
            </p>
          </div>
          <div style={{ background: TEAL + "18", borderRadius: 10, padding: "5px 10px", flexShrink: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: TEAL }}>
              {filtered.length} lugar{filtered.length !== 1 ? "es" : ""}
            </span>
          </div>
        </div>

        {/* Filtros */}
        <div style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 12 }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setActiveCategory(cat.id); setSelected(null); }}
              style={{
                flexShrink: 0, padding: "6px 12px", borderRadius: 100,
                border: `1.5px solid ${activeCategory === cat.id ? cat.color : theme.border}`,
                background: activeCategory === cat.id ? cat.color : theme.card,
                color: activeCategory === cat.id ? "white" : theme.muted,
                fontSize: 11, fontWeight: 600, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 4,
                whiteSpace: "nowrap",
              }}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mapa Leaflet */}
      <div style={{ flex: 1, margin: "0 16px 10px", borderRadius: 18, overflow: "hidden", border: `1.5px solid ${theme.border}`, position: "relative", minHeight: 0 }}>
        <MapContainer
          center={CENTER}
          zoom={16}
          minZoom={15}
          maxZoom={19}
          maxBounds={MAP_BOUNDS}
          maxBoundsViscosity={1.0}
          style={{ width: "100%", height: "100%" }}
          zoomControl={false}
        >
          {/* Tiles ESRI — gratis, sin API key, sin bloqueos */}
          <TileLayer
            url={
              theme.dark
                ? "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
                : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
            }
            attribution="Tiles &copy; Esri"
            maxZoom={19}
          />

          <ZoomControl position="bottomright" />

          {/* Delimitación del barrio — polígono punteado */}
          <Polygon
            positions={BARRIO_BOUNDARY}
            pathOptions={{
              color: TEAL,
              weight: 3,
              dashArray: "10 6",
              fillColor: TEAL,
              fillOpacity: 0.08,
            }}
          />

          {/* Volar al lugar seleccionado */}
          {flyTarget && <FlyTo lat={flyTarget.lat} lng={flyTarget.lng} />}

          {/* Marcadores */}
          {filtered.map((place) => (
            <Marker
              key={place.id}
              position={[place.lat, place.lng]}
              icon={makeMarker(place.color, place.emoji, selected?.id === place.id)}
              eventHandlers={{
                click: () => {
                  handleSelect(place);
                },
              }}
            >
              <Popup>
                <div style={{ fontFamily: "'Outfit', sans-serif", minWidth: 180 }}>
                  {place.image && (
                    <img src={place.image} alt={place.name} style={{ width: "100%", height: 100, objectFit: "cover" as const, borderRadius: 8, marginBottom: 8, display: "block" }} />
                  )}
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 5 }}>
                    <span style={{ fontSize: 20 }}>{place.emoji}</span>
                    <strong style={{ fontSize: 13, color: "#162323", lineHeight: 1.3 }}>{place.name}</strong>
                  </div>
                  <p style={{ fontSize: 12, color: "#6B7A7A", margin: "0 0 5px", lineHeight: 1.5 }}>{place.desc}</p>
                  {place.hours && <p style={{ fontSize: 11, color: TEAL, margin: "3px 0", fontWeight: 600 }}>🕐 {place.hours}</p>}
                  {place.phone && <p style={{ fontSize: 11, color: TEAL, margin: "3px 0", fontWeight: 600 }}>📞 {place.phone}</p>}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Leyenda de la delimitación */}
        <div style={{
          position: "absolute", top: 10, left: 10, zIndex: 1000,
          background: theme.dark ? "rgba(14,26,26,0.92)" : "rgba(255,255,255,0.92)",
          backdropFilter: "blur(8px)",
          borderRadius: 10, padding: "7px 12px",
          border: `1px solid ${theme.border}`,
          display: "flex", alignItems: "center", gap: 7,
          pointerEvents: "none",
        }}>
          <svg width="22" height="10" viewBox="0 0 22 10">
            <line x1="0" y1="5" x2="22" y2="5" stroke={TEAL} strokeWidth="2.5" strokeDasharray="5 3" />
          </svg>
          <span style={{ fontSize: 11, fontWeight: 700, color: TEAL }}>Límite del barrio</span>
        </div>
      </div>

      {/* Card de detalle del lugar seleccionado */}
      <div style={{
        flexShrink: 0,
        margin: "0 16px 16px",
        borderRadius: 18,
        border: `1.5px solid ${selected ? selected.color : theme.border}`,
        background: theme.card,
        overflow: "hidden",
        transition: "border-color 0.2s",
      }}>
        {selected ? (
          <div style={{ padding: "14px 16px" }}>
            {selected.image && (
              <img src={selected.image} alt={selected.name} style={{ width: "100%", height: 110, objectFit: "cover" as const, borderRadius: 12, marginBottom: 10, display: "block" }} />
            )}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flex: 1 }}>
                <div style={{ width: 44, height: 44, borderRadius: 13, flexShrink: 0, background: selected.color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
                  {selected.emoji}
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 2px", color: theme.ink, fontFamily: "'Fraunces', serif", lineHeight: 1.3 }}>
                    {selected.name}
                  </p>
                  <span style={{ fontSize: 10, color: selected.color, fontWeight: 700, background: selected.color + "15", padding: "2px 8px", borderRadius: 100 }}>
                    {CATEGORIES.find((c) => c.id === selected.category)?.emoji}{" "}
                    {CATEGORIES.find((c) => c.id === selected.category)?.label}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                style={{ background: theme.surface, border: "none", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke={theme.muted} strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <p style={{ fontSize: 12, color: theme.muted, margin: "0 0 8px", lineHeight: 1.5 }}>
              {selected.desc}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
              {selected.hours && (
                <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
                  <span style={{ fontSize: 13 }}>🕐</span>
                  <span style={{ fontSize: 12, color: TEAL, fontWeight: 600 }}>{selected.hours}</span>
                </div>
              )}
              {selected.phone && (
                <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
                  <span style={{ fontSize: 13 }}>📞</span>
                  <span style={{ fontSize: 12, color: TEAL, fontWeight: 600 }}>{selected.phone}</span>
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => {
                  window.open(
                    `https://www.google.com/maps/dir/?api=1&destination=${selected.lat},${selected.lng}`,
                    "_blank"
                  );
                }}
                style={{ flex: 1, padding: "10px", borderRadius: 10, background: selected.color, color: "white", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer" }}
              >
                🗺️ Cómo llegar
              </button>
              <button
                onClick={() => handleSelect(selected)}
                style={{ padding: "10px 14px", borderRadius: 10, background: selected.color + "15", color: selected.color, fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer" }}
              >
                📍 Centrar
              </button>
            </div>
          </div>
        ) : (
          <div style={{ padding: "14px 16px", display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: TEAL + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
              👆
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 1px", color: theme.ink }}>
                Toca un marcador del mapa
              </p>
              <p style={{ fontSize: 11, color: theme.muted, margin: 0 }}>
                El contorno punteado muestra el límite del barrio
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
