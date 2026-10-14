const fecha = (iso, opciones) => new Date(iso).toLocaleDateString('es', opciones);

export const fechaLarga = (iso) =>
  fecha(iso, { weekday: 'long', day: 'numeric', month: 'long' });

export const fechaCorta = (iso) => ({
  dia: fecha(iso, { day: 'numeric' }),
  mes: fecha(iso, { month: 'short' }),
});

export const hora = (iso) =>
  new Date(iso).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', hour12: false });

export const precioTexto = (n) => (n > 0 ? `$${Number(n).toLocaleString('es-MX')} MXN` : 'Gratis');

export const TIPOS = { tour: 'Tour', gratuito: 'Evento gratuito' };

// Quién puede asistir. Si el evento no tiene el dato, se toma como mixto.
export const AUDIENCIA = { mixto: 'Evento mixto', mujeres: 'Solo mujeres' };
const sinAcentos = (t) => String(t).normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();

// Clave de la audiencia tal como está en Supabase (columna "audience").
// "mixto" y "mujeres" tienen texto propio; cualquier otro valor se muestra tal cual.
export const audienciaClave = (e) => {
  const v = sinAcentos(e?.audience ?? '');
  if (!v || v === 'mixto' || v === 'mixta') return 'mixto';
  if (v.includes('mujer')) return 'mujeres';
  return v.replace(/[^a-z0-9]+/g, '-');
};

// Texto que se ve en la tarjeta y en la página del evento.
export const audienciaTexto = (e) => {
  const k = audienciaClave(e);
  if (AUDIENCIA[k]) return AUDIENCIA[k];
  const crudo = String(e.audience).trim();
  return crudo.charAt(0).toUpperCase() + crudo.slice(1);
};

// "En 6 días", "Mañana", "Hoy". Devuelve null si falta más de un mes.
export function badgeDias(iso) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const dia = new Date(iso);
  dia.setHours(0, 0, 0, 0);
  const d = Math.round((dia - hoy) / 86400000);
  if (d < 0) return null;
  if (d === 0) return 'Hoy';
  if (d === 1) return 'Mañana';
  if (d <= 30) return `En ${d} días`;
  return null;
}

export function textoLugares(n) {
  if (n <= 0) return 'Agotado';
  if (n === 1) return 'Último lugar';
  if (n <= 5) return `Últimos ${n} lugares`;
  return 'Lugares disponibles';
}
