import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabase/supabaseClient';

export const authDisponible = Boolean(supabase);

const AuthContext = createContext({ usuario: null, cargando: false, esAdmin: false });
export const useAuth = () => useContext(AuthContext);

// Dirección a la que regresan Google y los correos de confirmación (sin el #).
const urlRetorno = () => `${window.location.origin}${window.location.pathname}`;

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(authDisponible);
  const [esAdmin, setEsAdmin] = useState(false);

  useEffect(() => {
    if (!supabase) return undefined;
    supabase.auth.getSession().then(({ data }) => {
      setUsuario(data.session?.user ?? null);
      setCargando(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_evento, session) => {
      setUsuario(session?.user ?? null);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  // Revisa si quien inició sesión está en la tabla "admins" (ver sql/admin_eventos.sql).
  const idUsuario = usuario?.id;
  useEffect(() => {
    let vivo = true;
    if (!supabase || !idUsuario) {
      setEsAdmin(false);
      return undefined;
    }
    supabase
      .from('admins')
      .select('user_id')
      .eq('user_id', idUsuario)
      .maybeSingle()
      .then(({ data, error }) => {
        if (vivo) setEsAdmin(!error && Boolean(data));
      });
    return () => { vivo = false; };
  }, [idUsuario]);

  return <AuthContext.Provider value={{ usuario, cargando, esAdmin }}>{children}</AuthContext.Provider>;
}

export const nombreUsuario = (u) =>
  u.user_metadata?.full_name || u.user_metadata?.name || (u.email ? u.email.split('@')[0] : 'Mi cuenta');

function mensajeAuth(error) {
  const code = error.code || '';
  const msg = (error.message || '').toLowerCase();
  if (code === 'invalid_credentials' || msg.includes('invalid login credentials')) return 'Correo o contraseña incorrectos.';
  if (code === 'email_not_confirmed' || msg.includes('email not confirmed')) return 'Falta confirmar tu correo. Revisa tu bandeja de entrada.';
  if (code === 'user_already_exists' || msg.includes('already registered')) return 'Ya existe una cuenta con este correo. Inicia sesión.';
  if (code === 'weak_password') return 'La contraseña es muy débil. Usa al menos 8 caracteres, combinando letras y números.';
  if (code === 'over_email_send_rate_limit' || error.status === 429 || msg.includes('rate limit')) {
    return 'Se enviaron demasiados correos en poco tiempo. Inténtalo de nuevo en un rato.';
  }
  console.error(error);
  return 'No se pudo completar la acción. Inténtalo de nuevo.';
}

export async function entrar(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(mensajeAuth(error));
}

// Devuelve { confirmar: true } si Supabase mandó un correo para confirmar la cuenta.
export async function registrar({ nombre, email, password }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: nombre }, emailRedirectTo: urlRetorno() },
  });
  if (error) throw new Error(mensajeAuth(error));
  // Si el correo ya tiene cuenta, Supabase no da error pero devuelve la lista de identidades vacía.
  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    throw new Error('Ya existe una cuenta con este correo. Inicia sesión.');
  }
  return { confirmar: !data.session };
}

export async function entrarConGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: urlRetorno() },
  });
  if (error) throw new Error(mensajeAuth(error));
}

export async function salir() {
  await supabase.auth.signOut();
}
