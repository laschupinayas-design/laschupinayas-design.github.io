import { supabase } from '../supabase/supabaseClient';

// Guarda una reseña en Supabase (tabla reviews). Sin Supabase funciona en modo demostración.
export async function crearResena(datos) {
  if (!supabase) return { demo: true };
  const { error } = await supabase.from('reviews').insert(datos);
  if (error) {
    console.error(error);
    throw new Error('No se pudo enviar tu reseña. Revisa tu conexión e inténtalo de nuevo.');
  }
  return { demo: false };
}
