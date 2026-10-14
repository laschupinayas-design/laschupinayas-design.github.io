// Texto de ubicación del evento: usa "location" y, si no existe, el punto de encuentro.
export const textoUbicacion = (e) => e.location || e.meeting_point || '';

// Enlace para abrir el mapa: el que pongas en map_url o una búsqueda en Google Maps.
export function enlaceMapa(e) {
  if (e.map_url) return e.map_url;
  const q = e.location || e.meeting_point;
  return q ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` : '';
}
