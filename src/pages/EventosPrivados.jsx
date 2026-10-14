import { useState } from 'react';
import { grupo } from '../config';
import { modoDemo } from '../lib/eventos';
import { crearSolicitudPrivada } from '../lib/solicitudes';
import IconoActividad from '../components/IconoActividad';
import './EventosPrivados.css';

const PAISES = [
  ['+52', 'MX +52'],
  ['+1', 'US +1'],
  ['+34', 'ES +34'],
  ['+57', 'CO +57'],
  ['+54', 'AR +54'],
  ['+56', 'CL +56'],
  ['+51', 'PE +51'],
];

// Actividades que se pueden pedir para un evento privado.
const ACTIVIDADES = [
  { clave: 'senderismo', nombre: 'Senderismo', texto: 'Rutas a tu nivel y a tu ritmo' },
  { clave: 'bici', nombre: 'Bici de montaña', texto: 'Senderos y brechas en grupo' },
  { clave: 'yoga', nombre: 'Yoga', texto: 'Práctica al aire libre' },
  { clave: 'camping', nombre: 'Campamento', texto: 'Una noche entre árboles' },
];

const VACIO = {
  nombre: '',
  email: '',
  paisTel: '+52',
  tel: '',
  personas: '',
  fecha: '',
  mensaje: '',
  website: '', // campo trampa para bots
};

const soloDigitos = (t) => t.replace(/\D/g, '');

function validar(v, hoyISO) {
  const e = {};
  if (v.nombre.trim().length < 2) e.nombre = 'Escribe tu nombre completo.';
  if (!/^\S+@\S+\.\S+$/.test(v.email.trim())) e.email = 'Escribe un correo válido, por ejemplo nombre@correo.com.';
  if (v.tel.trim()) {
    const n = soloDigitos(v.tel).length;
    const ok = v.paisTel === '+52' ? n === 10 : n >= 7 && n <= 15;
    if (!ok) e.tel = v.paisTel === '+52' ? 'Escribe los 10 dígitos del celular.' : 'Escribe un número válido (de 7 a 15 dígitos).';
  }
  if (v.personas) {
    const n = Number(v.personas);
    if (!Number.isInteger(n) || n < 1 || n > 500) e.personas = 'Escribe un número de personas entre 1 y 500.';
  }
  if (v.fecha && v.fecha < hoyISO) e.fecha = 'Elige una fecha que no haya pasado.';
  if (v.mensaje.trim().length < 10) e.mensaje = 'Cuéntanos un poco más (al menos 10 caracteres).';
  return e;
}

function Campo({ id, label, error, children }) {
  return (
    <div className="cf-campo">
      <label htmlFor={id}>{label}</label>
      {children}
      {error && <p id={`${id}-error`} className="cf-error">{error}</p>}
    </div>
  );
}

export default function EventosPrivados() {
  const [v, setV] = useState(VACIO);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [demo, setDemo] = useState(false);
  const [actividades, setActividades] = useState([]);

  const hoyISO = new Date().toLocaleDateString('en-CA');
  const contacto = grupo.whatsapp || (grupo.email ? `mailto:${grupo.email}` : '');

  const alternar = (clave) =>
    setActividades((a) => (a.includes(clave) ? a.filter((x) => x !== clave) : [...a, clave]));
  const nombresElegidas = ACTIVIDADES.filter((a) => actividades.includes(a.clave)).map((a) => a.nombre);

  const cambiar = (e) => setV((a) => ({ ...a, [e.target.name]: e.target.value }));

  const campo = (nombre) => ({
    id: `cf-${nombre}`,
    name: nombre,
    value: v[nombre],
    onChange: cambiar,
    'aria-invalid': !!errores[nombre],
    'aria-describedby': errores[nombre] ? `cf-${nombre}-error` : undefined,
  });

  const enviar = async (ev) => {
    ev.preventDefault();
    if (v.website) {
      setEnviado(true); // un bot llenó el campo trampa
      return;
    }
    const errs = validar(v, hoyISO);
    setErrores(errs);
    if (Object.keys(errs).length > 0) {
      requestAnimationFrame(() => document.querySelector('.cf-card [aria-invalid="true"]')?.focus());
      return;
    }

    setEnviando(true);
    setErrorEnvio('');
    try {
      const res = await crearSolicitudPrivada({
        full_name: v.nombre.trim(),
        email: v.email.trim().toLowerCase(),
        phone_country: v.paisTel,
        phone: v.tel.trim() ? soloDigitos(v.tel) : null,
        group_size: v.personas ? Number(v.personas) : null,
        desired_date: v.fecha || null,
        message: (nombresElegidas.length ? `Actividades: ${nombresElegidas.join(', ')}\n\n` : '') + v.mensaje.trim(),
      });
      setDemo(res.demo);
      setV(VACIO);
      setActividades([]);
      setEnviado(true);
    } catch (err) {
      setErrorEnvio(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <main>
      <header className="page-head page-head-ciruela">
        <div className="wrap">
          <p className="cf-sobretitulo">Solo para tu grupo</p>
          <h1>Eventos privados</h1>
          <p>Cuéntanos qué tienes en mente y armamos una salida para tu grupo.</p>
        </div>
      </header>

      <div className="wrap cf-pagina">
        <section className="cf-info" aria-labelledby="cf-titulo-info">
          <h2 id="cf-titulo-info">Una salida a tu medida</h2>
          <p>{grupo.eventosPrivados.texto}</p>

          <h3 className="cf-sub">¿Qué quieren hacer?</h3>
          <ul className="act-lista">
            {ACTIVIDADES.map((a) => {
              const activa = actividades.includes(a.clave);
              return (
                <li key={a.clave}>
                  <button
                    type="button"
                    className={`act-card${activa ? ' act-card-activa' : ''}`}
                    aria-pressed={activa}
                    onClick={() => alternar(a.clave)}
                  >
                    <span className="act-icono"><IconoActividad clave={a.clave} size={56} /></span>
                    <span className="act-nombre">{a.nombre}</span>
                    <span className="act-texto">{a.texto}</span>
                    <span className="act-check" aria-hidden="true">✓</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="act-ayuda">Toca las que te interesen; puedes elegir varias.</p>

          <ul className="cf-puntos">
            {grupo.eventosPrivados.puntos.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          {contacto && (
            <p className="cf-directo">
              ¿Prefieres escribirnos directo?{' '}
              <a href={contacto} target={grupo.whatsapp ? '_blank' : undefined} rel={grupo.whatsapp ? 'noreferrer' : undefined}>
                {grupo.whatsapp ? 'Habla con nosotras por WhatsApp' : 'Envíanos un correo'}
              </a>
            </p>
          )}
        </section>

        <section className="cf-card" aria-labelledby="cf-titulo-form">
          {enviado ? (
            <div className="cf-ok" role="status">
              <h2 id="cf-titulo-form">Solicitud enviada</h2>
              <p>Gracias por escribirnos. Nos pondremos en contacto contigo.</p>
              {demo && (
                <p className="aviso">Modo demostración: esta solicitud no se guardó porque Supabase no está configurado.</p>
              )}
              <button type="button" className="cta cta-dark" onClick={() => setEnviado(false)}>
                Enviar otra solicitud
              </button>
            </div>
          ) : (
            <form onSubmit={enviar} noValidate>
              <h2 id="cf-titulo-form">Cuéntanos tu idea</h2>

              {modoDemo && (
                <p className="aviso">Modo demostración: Supabase no está configurado, así que la solicitud no se guardará.</p>
              )}

              <p className="act-resumen">
                {nombresElegidas.length > 0 ? (
                  <>
                    <span className="act-resumen-iconos">
                      {ACTIVIDADES.filter((a) => actividades.includes(a.clave)).map((a) => (
                        <IconoActividad key={a.clave} clave={a.clave} size={26} />
                      ))}
                    </span>
                    <span>{nombresElegidas.join(' · ')}</span>
                  </>
                ) : (
                  <span>Elige una o varias actividades en las tarjetas (opcional).</span>
                )}
              </p>

              <Campo id="cf-nombre" label="Nombre completo" error={errores.nombre}>
                <input {...campo('nombre')} autoComplete="name" placeholder="Ej. Ana Torres" />
              </Campo>

              <Campo id="cf-email" label="Correo electrónico" error={errores.email}>
                <input {...campo('email')} type="email" autoComplete="email" placeholder="ejemplo@correo.com" />
              </Campo>

              <Campo id="cf-tel" label="Celular (opcional)" error={errores.tel}>
                <div className="cf-telefono">
                  <select aria-label="Código de país" name="paisTel" value={v.paisTel} onChange={cambiar}>
                    {PAISES.map(([cod, texto]) => (
                      <option key={cod} value={cod}>{texto}</option>
                    ))}
                  </select>
                  <input {...campo('tel')} type="tel" inputMode="tel" autoComplete="tel-national" placeholder="Ej. 10 dígitos" />
                </div>
              </Campo>

              <div className="cf-fila">
                <Campo id="cf-personas" label="¿Cuántas personas? (opcional)" error={errores.personas}>
                  <input {...campo('personas')} type="number" inputMode="numeric" min="1" max="500" placeholder="Ej. 12" />
                </Campo>
                <Campo id="cf-fecha" label="Fecha tentativa (opcional)" error={errores.fecha}>
                  <input {...campo('fecha')} type="date" min={hoyISO} />
                </Campo>
              </div>

              <Campo id="cf-mensaje" label="¿Qué tienes en mente?" error={errores.mensaje}>
                <textarea {...campo('mensaje')} rows="5" maxLength={1900} placeholder="Cuéntanos qué celebran, qué nivel de caminata buscan y cualquier detalle que nos ayude." />
              </Campo>

              <div className="cf-trampa" aria-hidden="true">
                <label htmlFor="cf-website">No llenes este campo</label>
                <input id="cf-website" name="website" tabIndex={-1} autoComplete="off" value={v.website} onChange={cambiar} />
              </div>

              {errorEnvio && <p className="cf-error" role="alert">{errorEnvio}</p>}

              <button type="submit" className="cta cta-dark" disabled={enviando}>
                {enviando ? 'Enviando…' : 'Enviar solicitud'}
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
