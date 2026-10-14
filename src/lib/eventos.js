import { useEffect, useState } from 'react';
import { supabase } from '../supabase/supabaseClient';
import demo from '../data/eventos.json';

// Sin Supabase configurado se muestran eventos de ejemplo (src/data/eventos.json).
export const modoDemo = !supabase;

// Si la vista event_availability todavía no tiene la columna "audience",
// se lee directo de la tabla events y se mezcla (así siempre sale el valor de Supabase).
async function conAudience(filas) {
  if (!supabase || !filas || filas.length === 0 || 'audience' in filas[0]) return filas;
  const { data, error } = await supabase.from('events').select('id, audience');
  if (error || !data) return filas;
  const mapa = new Map(data.map((r) => [r.id, r.audience]));
  return filas.map((f) => ({ ...f, audience: mapa.get(f.id) ?? null }));
}

function useCarga(cargar, dependencia) {
  const [estado, setEstado] = useState({ datos: null, cargando: true, error: null });
  useEffect(() => {
    let vivo = true;
    setEstado({ datos: null, cargando: true, error: null });
    cargar()
      .then((datos) => vivo && setEstado({ datos, cargando: false, error: null }))
      .catch((error) => {
        console.error(error);
        if (vivo) setEstado({ datos: null, cargando: false, error });
      });
    return () => { vivo = false; };
  }, [dependencia]); // eslint-disable-line react-hooks/exhaustive-deps
  return estado;
}

// Próximos eventos, del más cercano al más lejano.
export function useEventos() {
  const { datos, cargando, error } = useCarga(async () => {
    if (!supabase) return [...demo].sort((a, b) => a.starts_at.localeCompare(b.starts_at));
    const { data, error: err } = await supabase
      .from('event_availability')
      .select('*')
      .gte('starts_at', new Date().toISOString())
      .order('starts_at', { ascending: true });
    if (err) throw err;
    return conAudience(data);
  }, 'lista');
  return { eventos: datos || [], cargando, error };
}

// Un evento por su slug (también eventos pasados, para mostrar "Evento finalizado").
export function useEvento(slug) {
  const { datos, cargando, error } = useCarga(async () => {
    if (!supabase) return demo.find((e) => e.slug === slug) || null;
    const { data, error: err } = await supabase
      .from('event_availability')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();
    if (err) throw err;
    return data ? (await conAudience([data]))[0] : data;
  }, slug);
  return { evento: datos, cargando, error };
}

// Guarda una reserva en Supabase (tabla reservations). Recibe los campos de la reserva
// (event_id, spots, full_name, email, ...) y devuelve { id, demo }.
// Si ocurre un error lanza un Error con un mensaje listo para mostrar.
export async function crearReserva(datos) {
  if (!supabase) return { id: null, demo: true };
  const id = datos.id || crypto.randomUUID();
  const { error } = await supabase.from('reservations').insert({ ...datos, id });
  if (error) {
    console.error(error);
    if (error.code === '23505') throw new Error('Ya existe una reserva con este correo para este evento.');
    if (/lugares suficientes/i.test(error.message)) throw new Error(error.message);
    throw new Error('No se pudo guardar tu reserva. Revisa tu conexión e inténtalo de nuevo.');
  }
  return { id, demo: false };
}
