import { useEffect, useRef, useState } from 'react';
import { entrar, entrarConGoogle, registrar } from '../lib/auth';
import './LoginModal.css';

const MIN_PASSWORD = 8;

function validar(modo, v) {
  const e = {};
  if (modo === 'registrar' && v.nombre.trim().length < 2) e.nombre = 'Escribe tu nombre.';
  if (!/^\S+@\S+\.\S+$/.test(v.email.trim())) e.email = 'Escribe un correo válido, por ejemplo nombre@correo.com.';
  if (modo === 'entrar') {
    if (!v.password) e.password = 'Escribe tu contraseña.';
  } else if (v.password.length < MIN_PASSWORD) {
    e.password = `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.`;
  }
  return e;
}

function Campo({ id, label, error, children }) {
  return (
    <div className="auth-campo">
      <label htmlFor={id}>{label}</label>
      {children}
      {error && <p id={`${id}-error`} className="auth-error">{error}</p>}
    </div>
  );
}

function GoogleG() {
  return (
    <svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

export default function LoginModal({ onCerrar }) {
  const ref = useRef(null);
  const [modo, setModo] = useState('entrar'); // 'entrar' | 'registrar'
  const [v, setV] = useState({ nombre: '', email: '', password: '' });
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [confirmar, setConfirmar] = useState(false);

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const cerrar = () => ref.current?.close();
  const clickFuera = (e) => {
    if (e.target === ref.current) cerrar();
  };

  const cambiar = (e) => setV((a) => ({ ...a, [e.target.name]: e.target.value }));

  const cambiarModo = (nuevo) => {
    setModo(nuevo);
    setErrores({});
    setErrorGeneral('');
    setConfirmar(false);
  };

  const enviar = async (ev) => {
    ev.preventDefault();
    const errs = validar(modo, v);
    setErrores(errs);
    if (Object.keys(errs).length > 0) {
      requestAnimationFrame(() => ref.current?.querySelector('[aria-invalid="true"]')?.focus());
      return;
    }
    setEnviando(true);
    setErrorGeneral('');
    try {
      if (modo === 'entrar') {
        await entrar(v.email.trim(), v.password);
        cerrar();
      } else {
        const r = await registrar({ nombre: v.nombre.trim(), email: v.email.trim(), password: v.password });
        if (r.confirmar) setConfirmar(true);
        else cerrar();
      }
    } catch (err) {
      setErrorGeneral(err.message);
    } finally {
      setEnviando(false);
    }
  };

  const google = async () => {
    setErrorGeneral('');
    setEnviando(true);
    try {
      await entrarConGoogle(); // el navegador se va a la pantalla de Google
    } catch (err) {
      setErrorGeneral(err.message);
      setEnviando(false);
    }
  };

  const props = (nombre) => ({
    id: `auth-${nombre}`,
    name: nombre,
    value: v[nombre],
    onChange: cambiar,
    'aria-invalid': !!errores[nombre],
    'aria-describedby': errores[nombre] ? `auth-${nombre}-error` : undefined,
  });

  return (
    <dialog ref={ref} className="auth-modal" aria-labelledby="auth-titulo" onClose={onCerrar} onClick={clickFuera}>
      <div className="auth-head">
        <h2 id="auth-titulo">{modo === 'entrar' ? 'Iniciar sesión' : 'Crear cuenta'}</h2>
        <button type="button" className="auth-cerrar" aria-label="Cerrar" onClick={cerrar}>×</button>
      </div>

      {confirmar ? (
        <div className="auth-body">
          <p className="auth-aviso">
            Te enviamos un correo a <strong>{v.email.trim()}</strong>. Abre el enlace para confirmar tu cuenta y después inicia sesión.
          </p>
          <button type="button" className="auth-submit" onClick={() => cambiarModo('entrar')}>
            Ir a iniciar sesión
          </button>
        </div>
      ) : (
        <div className="auth-body">
          <button type="button" className="google-btn" onClick={google} disabled={enviando}>
            <GoogleG />
            <span>Continuar con Google</span>
          </button>

          <p className="auth-o"><span>o con tu correo</span></p>

          <form onSubmit={enviar} noValidate>
            {modo === 'registrar' && (
              <Campo id="auth-nombre" label="Nombre" error={errores.nombre}>
                <input {...props('nombre')} autoComplete="name" placeholder="Ej. Ana Torres" />
              </Campo>
            )}
            <Campo id="auth-email" label="Correo electrónico" error={errores.email}>
              <input {...props('email')} type="email" autoComplete="email" placeholder="ejemplo@correo.com" />
            </Campo>
            <Campo id="auth-password" label="Contraseña" error={errores.password}>
              <input
                {...props('password')}
                type="password"
                autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'}
                placeholder={modo === 'registrar' ? `Mínimo ${MIN_PASSWORD} caracteres` : ''}
              />
            </Campo>

            {errorGeneral && <p className="auth-error" role="alert">{errorGeneral}</p>}

            <button type="submit" className="auth-submit" disabled={enviando}>
              {enviando ? 'Un momento…' : modo === 'entrar' ? 'Iniciar sesión' : 'Crear cuenta'}
            </button>
          </form>

          <p className="auth-cambio">
            {modo === 'entrar' ? (
              <>
                ¿No tienes cuenta?{' '}
                <button type="button" className="auth-link" onClick={() => cambiarModo('registrar')}>Crear una cuenta</button>
              </>
            ) : (
              <>
                ¿Ya tienes cuenta?{' '}
                <button type="button" className="auth-link" onClick={() => cambiarModo('entrar')}>Iniciar sesión</button>
              </>
            )}
          </p>
        </div>
      )}
    </dialog>
  );
}
