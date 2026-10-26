import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { modoDemo } from '../lib/eventos';
import { crearResena } from '../lib/resenas';
import './Resenas.css';

const ACTIVIDADES = [
  ['senderismo', 'Senderismo'],
  ['campamento', 'Campamento'],
  ['yoga', 'Yoga'],
  ['temazcal', 'Temazcal'],
  ['otro', 'Otro'],
];

const FRASES = ['Necesita mejorar mucho', 'Mala', 'Regular', 'Buena', 'Muy buena', '¡Excelente!'];

const RECOMIENDA = [
  ['si', 'Sí, definitivamente 💜'],
  ['tal-vez', 'Tal vez'],
  ['no', 'No'],
];

const VACIO = {
  nombre: '',
  actividad: '',
  otra: '',
  rating: null,
  comentario: '',
  recomienda: '',
  autoriza: false,
  website: '', // campo trampa para bots
};

function validar(v) {
  const e = {};
  if (!v.actividad) e.actividad = 'Elige la actividad en la que participaste.';
  if (v.actividad === 'otro' && v.otra.trim().length < 2) e.otra = 'Cuéntanos qué actividad fue.';
  if (v.rating === null) e.rating = 'Elige una calificación.';
  if (v.comentario.trim().length < 10) e.comentario = 'Cuéntanos un poco más (al menos 10 caracteres).';
  if (!v.recomienda) e.recomienda = 'Elige una opción.';
  return e;
}

function Estrella({ llena }) {
  return (
    <svg viewBox="0 0 24 24" width="40" height="40" aria-hidden="true">
      <path
        d="M12 2.6l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.4 6.1 20.7l1.3-6.6L2.5 9.5l6.6-.8z"
        fill={llena ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Resenas() {
  const [v, setV] = useState(VACIO);
  const [errores, setErrores] = useState({});
  const [sobre, setSobre] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [fallo, setFallo] = useState('');
  const [enviado, setEnviado] = useState(false);

  // Esta página solo se comparte por link: que los buscadores no la indexen.
  useEffect(() => {
    const m = document.createElement('meta');
    m.name = 'robots';
    m.content = 'noindex';
    document.head.appendChild(m);
    return () => m.remove();
  }, []);

  const cambiar = (e) => {
    const { name, value, type, checked } = e.target;
    setV((a) => ({ ...a, [name]: type === 'checkbox' ? checked : value }));
  };

  const calificacion = sobre ?? v.rating;

  const enviar = async (ev) => {
    ev.preventDefault();
    if (v.website) {
      setEnviado(true); // un bot llenó el campo trampa
      return;
    }
    const errs = validar(v);
    setErrores(errs);
    if (Object.keys(errs).length > 0) {
      requestAnimationFrame(() => document.querySelector('.rsn-form [aria-invalid="true"]')?.focus());
      return;
    }
    setEnviando(true);
    setFallo('');
    try {
      await crearResena({
        name: v.nombre.trim() || null, // sin nombre = anónima
        activity: v.actividad,
        activity_other: v.actividad === 'otro' ? v.otra.trim() : null,
        rating: v.rating,
        comment: v.comentario.trim(),
        recommend: v.recomienda,
        publish_consent: v.autoriza,
      });
      setEnviado(true);
      setV(VACIO);
    } catch (err) {
      setFallo(err.message);
    } finally {
      setEnviando(false);
    }
  };

  const ariaError = (k) => ({ 'aria-invalid': !!errores[k], 'aria-describedby': errores[k] ? `rsn-${k}-error` : undefined });
  const msg = (k) => errores[k] && <p id={`rsn-${k}-error`} className="rsn-error">{errores[k]}</p>;

  return (
    <main>
      <header className="page-head">
        <div className="wrap">
          <h1>Formulario de reseñas</h1>
          <p>En Chupinayas queremos conocer tu experiencia y seguir creando momentos especiales en comunidad. 💜</p>
        </div>
      </header>

      <div className="wrap rsn-pagina">
        {enviado ? (
          <section className="rsn-card rsn-ok" role="status">
            <h2>¡Gracias por compartir tu experiencia! 💜</h2>
            <p>Tu reseña nos ayuda a seguir creando momentos especiales en comunidad.</p>
            {modoDemo && <p className="aviso">Modo demostración: la reseña no se guardó porque Supabase no está configurado.</p>}
            <div className="rsn-acciones">
              <Link className="cta cta-dark" to="/eventos">Ver próximos eventos</Link>
              <button type="button" className="rsn-sec" onClick={() => setEnviado(false)}>Enviar otra reseña</button>
            </div>
          </section>
        ) : (
          <form className="rsn-card rsn-form" onSubmit={enviar} noValidate>
            {modoDemo && <p className="aviso">Modo demostración: Supabase no está configurado, así que la reseña no se guardará.</p>}

            <div className="rsn-campo">
              <label htmlFor="rsn-nombre">1. ¿Cómo te llamas? <span className="rsn-opc">(opcional)</span></label>
              <input id="rsn-nombre" name="nombre" value={v.nombre} onChange={cambiar} maxLength={100} autoComplete="given-name" placeholder="Anónima" />
              <p className="rsn-ayuda">Si lo dejas vacío, tu reseña será anónima.</p>
            </div>

            <div className="rsn-campo">
              <label htmlFor="rsn-actividad">2. ¿En qué actividad participaste?</label>
              <select id="rsn-actividad" name="actividad" value={v.actividad} onChange={cambiar} {...ariaError('actividad')}>
                <option value="">Elige una opción</option>
                {ACTIVIDADES.map(([k, t]) => <option key={k} value={k}>{t}</option>)}
              </select>
              {msg('actividad')}
            </div>

            {v.actividad === 'otro' && (
              <div className="rsn-campo">
                <label htmlFor="rsn-otra">¿Qué actividad fue?</label>
                <input id="rsn-otra" name="otra" value={v.otra} onChange={cambiar} maxLength={100} placeholder="Cuéntanos qué actividad fue" {...ariaError('otra')} />
                {msg('otra')}
              </div>
            )}

            <fieldset className="rsn-campo rsn-estrellas" aria-describedby={errores.rating ? 'rsn-rating-error' : undefined}>
              <legend>3. ¿Cómo calificarías tu experiencia?</legend>
              <div className="rsn-fila-estrellas" onMouseLeave={() => setSobre(null)}>
                <label className={`rsn-cero${calificacion === 0 ? ' rsn-cero-activo' : ''}`} onMouseEnter={() => setSobre(0)}>
                  <input type="radio" name="rating" value="0" checked={v.rating === 0}
                    onChange={() => setV((a) => ({ ...a, rating: 0 }))} aria-label="0 estrellas" />
                  <span>0</span>
                </label>
                {[1, 2, 3, 4, 5].map((n) => (
                  <label key={n} className={`rsn-estrella${calificacion !== null && n <= calificacion ? ' rsn-llena' : ''}`} onMouseEnter={() => setSobre(n)}>
                    <input type="radio" name="rating" value={n} checked={v.rating === n}
                      onChange={() => setV((a) => ({ ...a, rating: n }))} aria-label={`${n} estrella${n === 1 ? '' : 's'}`} />
                    <Estrella llena={calificacion !== null && n <= calificacion} />
                  </label>
                ))}
              </div>
              <p className="rsn-frase" aria-live="polite">{calificacion !== null ? FRASES[calificacion] : 'Toca las estrellas'}</p>
              {errores.rating && <p id="rsn-rating-error" className="rsn-error">{errores.rating}</p>}
            </fieldset>

            <div className="rsn-campo">
              <label htmlFor="rsn-comentario">4. Cuéntanos cómo fue tu experiencia</label>
              <textarea id="rsn-comentario" name="comentario" rows="6" maxLength={2000} value={v.comentario} onChange={cambiar}
                placeholder="¿Qué fue lo que más disfrutaste? ¿Qué te llevas de la experiencia?" {...ariaError('comentario')} />
              {msg('comentario')}
            </div>

            <fieldset className="rsn-campo" aria-describedby={errores.recomienda ? 'rsn-recomienda-error' : undefined}>
              <legend>5. ¿Recomendarías Chupinayas a otras mujeres?</legend>
              <div className="rsn-opciones">
                {RECOMIENDA.map(([k, t]) => (
                  <label key={k} className={`rsn-opcion${v.recomienda === k ? ' rsn-opcion-activa' : ''}`}>
                    <input type="radio" name="recomienda" value={k} checked={v.recomienda === k} onChange={cambiar} />
                    <span>{t}</span>
                  </label>
                ))}
              </div>
              {errores.recomienda && <p id="rsn-recomienda-error" className="rsn-error">{errores.recomienda}</p>}
            </fieldset>

            <label className="rsn-autoriza">
              <input type="checkbox" name="autoriza" checked={v.autoriza} onChange={cambiar} />
              <span>Autorizo que mi reseña se publique en la página web de Chupinayas.</span>
            </label>
            <p className="rsn-ayuda rsn-nota">
              Puedes dejar tu nombre vacío para compartir tu experiencia de forma anónima. La publicación debe respetar tu autorización.
            </p>

            <div className="rsn-trampa" aria-hidden="true">
              <label htmlFor="rsn-website">No llenes este campo</label>
              <input id="rsn-website" name="website" tabIndex={-1} autoComplete="off" value={v.website} onChange={cambiar} />
            </div>

            {fallo && <p className="rsn-error rsn-error-envio" role="alert">{fallo}</p>}

            <button type="submit" className="cta cta-dark rsn-enviar" disabled={enviando}>
              {enviando ? 'Enviando…' : 'Enviar reseña'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
