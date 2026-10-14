import { supabase } from '../supabase/supabaseClient';

// Guarda una solicitud de evento privado en Supabase (tabla private_event_requests).
// Sin Supabase configurado funciona en modo demostración: no guarda nada.
export async function crearSolicitudPrivada(datos) {
  if (!supabase) return { demo: true };
  const { error } = await supabase.from('private_event_requests').insert(datos);
  if (error) {
    console.error(error);
    throw new Error('No se pudo enviar tu solicitud. Revisa tu conexión e inténtalo de nuevo.');
  }
  return { demo: false };
}
