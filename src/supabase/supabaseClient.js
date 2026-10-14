import { createClient } from '@supabase/supabase-js';

const url = 'https://zamiqcgvilpbzlkzuzlc.supabase.co';
const key = 'sb_publishable_K5u8Mh9da5MBuL0Epz65tw_E2xa0Q9T';

export const supabase = url && key ? createClient(url, key) : null;

if (!supabase) {
  console.warn('Supabase no está configurado: faltan la URL o la clave de Supabase');
}