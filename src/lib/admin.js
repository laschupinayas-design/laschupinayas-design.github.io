import { supabase } from '../supabase/supabaseClient';

function mensaje(error) {
  console.error(error);
  if (error.code === '23505') return 'Ya existe un evento con esa dirección (slug). Cámbiala por otra.';
  if (error.code === '23503') return 'Este evento ya tiene reservas, así que no se puede borrar. Mejor desmárcalo como publicado.';
  if (error.code === '42501' || /row-level security/i.test(error.message || '')) {
    return 'Tu cuenta no tiene permiso de administradora. Revisa que corriste sql/admin_eventos.sql.';
  }
  if (error.code === '23514') return 'Algún dato no cumple las reglas (por ejemplo, un evento gratuito debe costar $0).';
  return 'No se pudo completar la acción. Inténtalo de nuevo.';
}

// Todos los eventos (publicados o no), del más reciente al más antiguo.
export async function listarEventosAdmin() {
  const { data, error } = await supabase.from('events').select('*').order('starts_at', { ascending: false });
  if (error) throw new Error(mensaje(error));
  return data;
}

export async function crearEvento(datos) {
  const { error } = await supabase.from('events').insert(datos);
  if (error) throw new Error(mensaje(error));
}

export async function actualizarEvento(id, datos) {
  const { error } = await supabase.from('events').update(datos).eq('id', id);
  if (error) throw new Error(mensaje(error));
}

export async function eliminarEvento(id) {
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) throw new Error(mensaje(error));
}

// ---------- Reservaciones ----------

// Resumen para la lista de eventos: una fila por reserva (solo lo necesario para contar).
export async function resumenReservas() {
  const { data, error } = await supabase.from('reservations').select('event_id, status, spots');
  if (error) throw new Error(mensaje(error));
  return data;
}

export async function listarReservas(eventId) {
  const { data, error } = await supabase
    .from('reservations')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(mensaje(error));
  return data;
}

// status: 'pendiente' o 'confirmada' (autorizado)
export async function cambiarEstadoReserva(id, status) {
  const { error } = await supabase.from('reservations').update({ status }).eq('id', id);
  if (error) throw new Error(mensaje(error));
}
