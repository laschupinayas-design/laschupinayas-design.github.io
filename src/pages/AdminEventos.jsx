import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { authDisponible, useAuth } from '../lib/auth';
import { actualizarEvento, crearEvento, eliminarEvento, listarEventosAdmin } from '../lib/admin';
import { audienciaTexto, fechaLarga, hora, precioTexto, TIPOS } from '../lib/formato';
import AdminReservaciones from './AdminReservaciones';
import './AdminEventos.css';

const VACIO = {
  title: '',
  slug: '',
  tipo: 'tour',
  audience: 'mixto',
  tagline: '',
  description: '',
  location: '',
  map_url: '',
  meeting_point: '',
  starts_at: '',
  level: '',
  distance_km: '',
  elevation_m: '',
  image_url: '',
  capacity: '',
  price_mxn: '',
  is_published: true,
};

const pad = (n) => String(n).padStart(2, '0');
// ISO (UTC) -> valor para <input type="datetime-local"> en la hora local
function aInputFecha(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const aSlug = (t) =>
  t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

function desdeEvento(e) {
  return {
    title: e.title || '',
    slug: e.slug || '',
    tipo: e.tipo || 'tour',
    audience: e.audience || 'mixto',
    tagline: e.tagline || '',
    description: e.description || '',
    location: e.location || '',
    map_url: e.map_url || '',
    meeting_point: e.meeting_point || '',
    starts_at: aInputFecha(e.starts_at),
    level: e.level || '',
    distance_km: e.distance_km ?? '',
    elevation_m: e.elevation_m ?? '',
    image_url: e.image_url || '',
    capacity: e.capacity ?? '',
    price_mxn: e.price_mxn ?? '',
    is_published: e.is_published !== false,
  };
}

function validar(v) {
  const e = {};
  if (v.title.trim().length < 3) e.title = 'Escribe el nombre del evento.';
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(v.slug)) e.slug = 'Solo minúsculas, números y guiones. Ej. campamento-holistico';
  if (!v.starts_at) e.starts_at = 'Elige la fecha y la hora.';
  const cap = Number(v.capacity);
  if (!Number.isInteger(cap) || cap < 1) e.capacity = 'Escribe un número de lugares, mínimo 1.';
  if (v.tipo !== 'gratuito') {
    const p = Number(v.price_mxn);
    if (v.price_mxn === '' || Number.isNaN(p) || p < 0) e.price_mxn = 'Escribe el precio por lugar (0 si no cuesta).';
  }
  if (v.distance_km !== '' && !(Number(v.distance_km) >= 0)) e.distance_km = 'Escribe un número válido.';
  if (v.elevation_m !== '' && !(Number.isInteger(Number(v.elevation_m)) && Number(v.elevation_m) >= 0)) e.elevation_m = 'Escribe metros enteros.';
  if (v.map_url.trim() && !/^https?:\/\//i.test(v.map_url.trim())) e.map_url = 'El enlace debe empezar con https://';
  return e;
}

function aPayload(v) {
  const texto = (t) => (t.trim() ? t.trim() : null);
  const num = (n) => (n === '' || n == null ? null : Number(n));
  return {
    title: v.title.trim(),
    slug: v.slug,
    tipo: v.tipo,
    audience: v.audience,
    tagline: texto(v.tagline),
    description: texto(v.description),
    location: texto(v.location),
    map_url: texto(v.map_url),
    meeting_point: texto(v.meeting_point),
    starts_at: new Date(v.starts_at).toISOString(),
    level: v.level || null,
    distance_km: num(v.distance_km),
    elevation_m: num(v.elevation_m),
    image_url: texto(v.image_url),
    capacity: Number(v.capacity),
    price_mxn: v.tipo === 'gratuito' ? 0 : Number(v.price_mxn),
    is_published: v.is_published,
  };
}

function Campo({ id, label, error, ayuda, children, ancho }) {
  return (
    <div className={`adm-campo${ancho ? ' adm-ancho' : ''}`}>
      <label htmlFor={id}>{label}</label>
      {children}
      {ayuda && !error && <p className="adm-ayuda">{ayuda}</p>}
      {error && <p id={`${id}-error`} className="adm-error">{error}</p>}
    </div>
  );
}

function Formulario({ evento, onGuardado, onCancelar }) {
  const editando = Boolean(evento);
  const [v, setV] = useState(evento ? desdeEvento(evento) : VACIO);
  const [slugManual, setSlugManual] = useState(editando);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [fallo, setFallo] = useState('');

  const cambiar = (e) => {
    const { name, value, type, checked } = e.target;
    setV((a) => {
      const nuevo = { ...a, [name]: type === 'checkbox' ? checked : value };
      if (name === 'title' && !slugManual) nuevo.slug = aSlug(value);
      return nuevo;
    });
  };
  const campo = (n) => ({
    id: `adm-${n}`,
    name: n,
    value: v[n],
    onChange: cambiar,
    'aria-invalid': !!errores[n],
    'aria-describedby': errores[n] ? `adm-${n}-error` : undefined,
  });

  const enviar = async (ev) => {
    ev.preventDefault();
    const errs = validar(v);
    setErrores(errs);
    if (Object.keys(errs).length > 0) {
      requestAnimationFrame(() => document.querySelector('.adm-form [aria-invalid="true"]')?.focus());
      return;
    }
    setEnviando(true);
    setFallo('');
    try {
      const datos = aPayload(v);
      if (editando) await actualizarEvento(evento.id, datos);
      else await crearEvento(datos);
      onGuardado(editando ? 'Evento actualizado.' : 'Evento creado.');
    } catch (err) {
      setFallo(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form className="adm-form" onSubmit={enviar} noValidate>
      <h2>{editando ? 'Editar evento' : 'Registrar nuevo evento'}</h2>

      <div className="adm-grid">
        <Campo id="adm-title" label="Nombre del evento" error={errores.title} ancho>
          <input {...campo('title')} placeholder="Ej. Campamento Holístico" />
        </Campo>

        <Campo
          id="adm-slug"
          label="Dirección en el sitio (slug)"
          error={errores.slug}
          ayuda="Se llena sola con el nombre. Quedará como /#/eventos/…"
          ancho
        >
          <input
            {...campo('slug')}
            onChange={(e) => {
              setSlugManual(true);
              cambiar(e);
            }}
            placeholder="campamento-holistico"
          />
        </Campo>

        <Campo id="adm-tipo" label="Tipo">
          <select {...campo('tipo')}>
            {Object.entries(TIPOS).map(([k, t]) => (
              <option key={k} value={k}>{t}</option>
            ))}
          </select>
        </Campo>

        <Campo id="adm-audience" label="Para quién">
          <select {...campo('audience')}>
            <option value="mixto">Evento mixto</option>
            <option value="mujeres">Solo mujeres</option>
          </select>
        </Campo>

        <Campo id="adm-starts_at" label="Fecha y hora" error={errores.starts_at}>
          <input {...campo('starts_at')} type="datetime-local" />
        </Campo>

        <Campo id="adm-level" label="Nivel (opcional)">
          <select {...campo('level')}>
            <option value="">Sin nivel</option>
            <option value="principiante">Principiante</option>
            <option value="intermedio">Intermedio</option>
            <option value="avanzado">Avanzado</option>
          </select>
        </Campo>

        <Campo id="adm-capacity" label="Lugares disponibles" error={errores.capacity}>
          <input {...campo('capacity')} type="number" min="1" inputMode="numeric" placeholder="Ej. 20" />
        </Campo>

        <Campo
          id="adm-price_mxn"
          label="Precio por lugar (MXN)"
          error={errores.price_mxn}
          ayuda={v.tipo === 'gratuito' ? 'Los eventos gratuitos siempre cuestan $0.' : undefined}
        >
          <input
            {...campo('price_mxn')}
            value={v.tipo === 'gratuito' ? 0 : v.price_mxn}
            disabled={v.tipo === 'gratuito'}
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            placeholder="Ej. 500"
          />
        </Campo>

        <Campo id="adm-distance_km" label="Distancia en km (opcional)" error={errores.distance_km}>
          <input {...campo('distance_km')} type="number" min="0" step="0.1" inputMode="decimal" placeholder="Ej. 5" />
        </Campo>

        <Campo id="adm-elevation_m" label="Desnivel en metros (opcional)" error={errores.elevation_m}>
          <input {...campo('elevation_m')} type="number" min="0" inputMode="numeric" placeholder="Ej. 300" />
        </Campo>

        <Campo id="adm-tagline" label="Frase corta para la tarjeta (opcional)" ancho>
          <input {...campo('tagline')} maxLength={140} placeholder="Una línea que invite a participar" />
        </Campo>

        <Campo id="adm-location" label="Lugar o dirección (opcional)" ancho>
          <input {...campo('location')} placeholder="Ej. Bosque de la primavera, río caliente" />
        </Campo>

        <Campo id="adm-meeting_point" label="Punto de encuentro (opcional)">
          <input {...campo('meeting_point')} placeholder="Ej. La primavera" />
        </Campo>

        <Campo id="adm-map_url" label="Enlace del mapa (opcional)" error={errores.map_url}>
          <input {...campo('map_url')} type="url" placeholder="https://maps.google.com/…" />
        </Campo>

        <Campo id="adm-image_url" label="Imagen (enlace, opcional)" ayuda="Pega la dirección de la foto." ancho>
          <input {...campo('image_url')} placeholder="https://…" />
        </Campo>

        <Campo id="adm-description" label="Descripción (opcional)" ancho>
          <textarea {...campo('description')} rows="6" placeholder="Cada renglón se muestra como una línea aparte." />
        </Campo>

        <label className="adm-check adm-ancho">
          <input type="checkbox" name="is_published" checked={v.is_published} onChange={cambiar} />
          <span>Publicado (visible para todas en el sitio)</span>
        </label>
      </div>

      {fallo && <p className="adm-error" role="alert">{fallo}</p>}

      <div className="adm-acciones">
        <button type="submit" className="cta cta-dark" disabled={enviando}>
          {enviando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Crear evento'}
        </button>
        <button type="button" className="adm-sec" onClick={onCancelar} disabled={enviando}>Cancelar</button>
      </div>
    </form>
  );
}

export default function AdminEventos() {
  const { usuario, cargando, esAdmin } = useAuth();
  const [eventos, setEventos] = useState(null);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [pestana, setPestana] = useState('eventos'); // eventos | reservas
  const [vista, setVista] = useState({ modo: 'lista' }); // lista | form
  const [confirmando, setConfirmando] = useState(null);
  const [ocupado, setOcupado] = useState(null);

  const cargar = useCallback(async () => {
    try {
      setError('');
      setEventos(await listarEventosAdmin());
    } catch (e) {
      setError(e.message);
      setEventos([]);
    }
  }, []);

  useEffect(() => {
    if (esAdmin) cargar();
  }, [esAdmin, cargar]);

  const guardado = (texto) => {
    setAviso(texto);
    setVista({ modo: 'lista' });
    cargar();
  };

  const alternarPublicado = async (e) => {
    setOcupado(e.id);
    setAviso('');
    try {
      await actualizarEvento(e.id, { is_published: !e.is_published });
      await cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setOcupado(null);
    }
  };

  const borrar = async (e) => {
    setOcupado(e.id);
    setAviso('');
    setError('');
    try {
      await eliminarEvento(e.id);
      setConfirmando(null);
      setAviso('Evento eliminado.');
      await cargar();
    } catch (err) {
      setError(err.message);
      setConfirmando(null);
    } finally {
      setOcupado(null);
    }
  };

  let cuerpo;
  if (!authDisponible) {
    cuerpo = <p className="aviso">Esta página necesita Supabase configurado.</p>;
  } else if (cargando) {
    cuerpo = <p className="vacio">Cargando…</p>;
  } else if (!usuario) {
    cuerpo = <p className="aviso">Inicia sesión con tu cuenta de administradora para registrar eventos.</p>;
  } else if (!esAdmin) {
    cuerpo = <p className="aviso">Tu cuenta no tiene permisos de administradora.</p>;
  } else if (vista.modo === 'form') {
    cuerpo = (
      <Formulario
        key={vista.evento?.id || 'nuevo'}
        evento={vista.evento}
        onGuardado={guardado}
        onCancelar={() => setVista({ modo: 'lista' })}
      />
    );
  } else {
    cuerpo = (
      <>
        <div className="adm-barra">
          <p>{eventos ? `${eventos.length} evento${eventos.length === 1 ? '' : 's'}` : 'Cargando eventos…'}</p>
          <button type="button" className="cta cta-dark" onClick={() => { setAviso(''); setVista({ modo: 'form' }); }}>
            + Nuevo evento
          </button>
        </div>

        {aviso && <p className="adm-ok" role="status">{aviso}</p>}
        {error && <p className="adm-error" role="alert">{error}</p>}

        <ul className="adm-lista">
          {(eventos || []).map((e) => (
            <li key={e.id} className={`adm-item${e.is_published ? '' : ' adm-borrador'}`}>
              <div className="adm-info">
                <p className="adm-titulo">
                  {e.title}
                  {!e.is_published && <span className="adm-badge">Sin publicar</span>}
                </p>
                <p className="adm-meta">
                  {fechaLarga(e.starts_at)} · {hora(e.starts_at)} h · {TIPOS[e.tipo] || e.tipo} · {audienciaTexto(e)} ·{' '}
                  {e.capacity} lugares · {precioTexto(e.price_mxn)}
                </p>
              </div>
              <div className="adm-botones">
                {confirmando === e.id ? (
                  <>
                    <span className="adm-pregunta">¿Eliminar?</span>
                    <button type="button" className="adm-peligro" disabled={ocupado === e.id} onClick={() => borrar(e)}>
                      Sí, eliminar
                    </button>
                    <button type="button" className="adm-sec" onClick={() => setConfirmando(null)}>No</button>
                  </>
                ) : (
                  <>
                    <Link className="adm-sec" to={`/eventos/${e.slug}`}>Ver</Link>
                    <button type="button" className="adm-sec" onClick={() => { setAviso(''); setVista({ modo: 'form', evento: e }); }}>
                      Editar
                    </button>
                    <button type="button" className="adm-sec" disabled={ocupado === e.id} onClick={() => alternarPublicado(e)}>
                      {e.is_published ? 'Despublicar' : 'Publicar'}
                    </button>
                    <button type="button" className="adm-peligro-suave" onClick={() => setConfirmando(e.id)}>
                      Eliminar
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
          {eventos && eventos.length === 0 && !error && <li className="vacio">Todavía no hay eventos. Crea el primero.</li>}
        </ul>
      </>
    );
  }

  return (
    <main>
      <header className="page-head">
        <div className="wrap">
          <h1>Panel de administración</h1>
          <p>Crea eventos y revisa las reservaciones.</p>
        </div>
      </header>
      <div className="wrap adm-pagina">
        {authDisponible && esAdmin && (
          <div className="adm-tabs" role="tablist" aria-label="Secciones del panel">
            <button type="button" role="tab" aria-selected={pestana === 'eventos'} className={`adm-tab${pestana === 'eventos' ? ' adm-tab-activa' : ''}`} onClick={() => setPestana('eventos')}>
              Eventos
            </button>
            <button type="button" role="tab" aria-selected={pestana === 'reservas'} className={`adm-tab${pestana === 'reservas' ? ' adm-tab-activa' : ''}`} onClick={() => setPestana('reservas')}>
              Reservaciones
            </button>
          </div>
        )}
        {esAdmin && pestana === 'reservas' ? <AdminReservaciones /> : cuerpo}
      </div>
    </main>
  );
}
