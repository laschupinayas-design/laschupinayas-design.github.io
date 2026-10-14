import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEvento } from '../lib/eventos';
import { TIPOS, audienciaClave, audienciaTexto, badgeDias, fechaLarga, hora, precioTexto, textoLugares } from '../lib/formato';
import { enlaceMapa, textoUbicacion } from '../lib/ubicacion';
import ImagenEvento from '../components/ImagenEvento';
import IconoUbicacion from '../components/IconoUbicacion';
import ReservaModal from '../components/ReservaModal';
import { FAQ } from '../data/faq';
import './EventoDetalle.css';

const ICONOS = {
  fecha: <><rect x="3.5" y="5" width="17" height="15.5" rx="3" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>,
  hora: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  nivel: <path d="M4 20V14M10 20V9M16 20V4M22 20v0" />,
  distancia: <><circle cx="6" cy="18" r="2.2" /><circle cx="18" cy="6" r="2.2" /><path d="M8 18h6.5a3 3 0 0 0 0-6h-5a3 3 0 0 1 0-6H16" /></>,
  desnivel: <path d="M2.5 19.5 9 8l3.5 6 2.5-3.5 6.5 9z" />,
  audiencia: <><circle cx="9" cy="8.5" r="3.2" /><path d="M3 20c0-3.6 2.7-6 6-6s6 2.4 6 6" /><circle cx="17.5" cy="9.5" r="2.4" /><path d="M16.5 14.2c3 .2 5 2.3 5 5.3" /></>,
  encuentro: <><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" /><circle cx="12" cy="10" r="2.3" /></>,
};

function Icono({ clave }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONOS[clave]}
    </svg>
  );
}

function Dato({ icono, etiqueta, valor, ancho }) {
  return (
    <li className={`ev-dato${ancho ? ' ev-dato-ancho' : ''}`}>
      <span className="ev-dato-icono"><Icono clave={icono} /></span>
      <span>
        <span className="ev-dato-etiqueta">{etiqueta}</span>
        <strong className="ev-dato-valor">{valor}</strong>
      </span>
    </li>
  );
}

function Mensaje({ titulo, texto }) {
  return (
    <main className="page page-texto">
      <div className="wrap">
        <h1>{titulo}</h1>
        <p>{texto}</p>
        <Link className="cta cta-dark" to="/eventos">Ver todos los eventos</Link>
      </div>
    </main>
  );
}

export default function EventoDetalle() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { evento, cargando, error } = useEvento(slug);
  const [abierto, setAbierto] = useState(false);

  if (cargando) {
    return (
      <main className="page page-texto">
        <div className="wrap"><p className="vacio">Cargando evento…</p></div>
      </main>
    );
  }
  if (error) return <Mensaje titulo="No pudimos cargar el evento" texto="Inténtalo de nuevo en unos minutos." />;
  if (!evento) return <Mensaje titulo="No encontramos este evento" texto="Puede que ya haya terminado o que el enlace sea incorrecto." />;

  const pasado = new Date(evento.starts_at) < new Date();
  const agotado = evento.spots_left <= 0;
  const bloqueado = pasado || agotado;
  const textoBoton = pasado ? 'Evento finalizado' : agotado ? 'Sin lugares disponibles' : 'Registrarme';

  const ubicacion = textoUbicacion(evento);
  const mapa = enlaceMapa(evento);

  const alTerminar = (reserva) => {
    setAbierto(false);
    navigate(`/reserva/${reserva.id}`, {
      state: {
        ...reserva,
        evento: {
          slug: evento.slug,
          title: evento.title,
          starts_at: evento.starts_at,
          tipo: evento.tipo,
        },
      },
    });
  };

  const audiencia = audienciaClave(evento);
  const dias = badgeDias(evento.starts_at);
  const resumen = evento.tagline;
  const gratis = !(Number(evento.price_mxn) > 0);

  return (
    <main className="page ev">
      <div className="wrap">
        <Link className="volver" to="/eventos">← Todos los eventos</Link>

        <div className="ev-foto">
          <ImagenEvento src={evento.image_url} className="ev-img" />
          <div className="ev-etiquetas">
            <span className={`ev-tag ev-tag-${audiencia}`}>{audienciaTexto(evento)}</span>
            {dias && !pasado && <span className="ev-tag ev-tag-dias">{dias}</span>}
          </div>
        </div>

        <div className="ev-layout">
          <div className="ev-principal">
            <p className="ev-tipo">{TIPOS[evento.tipo] || 'Evento'}</p>
            <h1 className="ev-titulo">{evento.title}</h1>

            {ubicacion && (
              <p className="detalle-lugar">
                <IconoUbicacion size={20} />
                <span>{ubicacion}</span>
              </p>
            )}
            {resumen && <p className="ev-resumen">{resumen}</p>}

            <ul className="ev-datos">
              <Dato icono="fecha" etiqueta="Fecha" valor={fechaLarga(evento.starts_at)} />
              <Dato icono="hora" etiqueta="Hora" valor={`${hora(evento.starts_at)} h`} />
              <Dato icono="audiencia" etiqueta="Para quién" valor={audienciaTexto(evento)} />
              {evento.level && <Dato icono="nivel" etiqueta="Nivel" valor={<span className="cap">{evento.level}</span>} />}
              {evento.distance_km != null && <Dato icono="distancia" etiqueta="Distancia" valor={`${evento.distance_km} km`} />}
              {evento.elevation_m != null && <Dato icono="desnivel" etiqueta="Desnivel" valor={`${evento.elevation_m} m`} />}
              {evento.meeting_point && (
                <li className="ev-dato-ancho ubicacion-card">
                  <span className="ubicacion-icono"><IconoUbicacion size={26} /></span>
                  <div className="ubicacion-texto">
                    <p className="ubicacion-punto">Punto de encuentro</p>
                    <p className="ubicacion-lugar">{evento.meeting_point}</p>
                  </div>
                  {mapa && (
                    <a className="ubicacion-mapa" href={mapa} target="_blank" rel="noreferrer">
                      Cómo llegar <span aria-hidden="true">→</span>
                    </a>
                  )}
                </li>
              )}
            </ul>

            {evento.description && (
              <section className="ev-seccion" aria-labelledby="ev-sobre">
                <h2 id="ev-sobre" className="ev-h2">Sobre este evento</h2>
                <p className="ev-texto">{evento.description}</p>
              </section>
            )}
          </div>

          <aside className="ev-reserva" aria-label="Reservar lugar">
            <p className="ev-precio">{gratis ? 'Gratis' : precioTexto(evento.price_mxn)}</p>
            <p className="ev-precio-nota">{gratis ? 'Entrada libre' : 'por lugar'}</p>

            <p className={`ev-lugares${agotado ? ' ev-lugares-agotado' : ''}`}>{textoLugares(evento.spots_left)}</p>

            <button type="button" className="ev-boton" disabled={bloqueado} onClick={() => setAbierto(true)}>
              {textoBoton}
            </button>
            <p className="ev-nota">
              {gratis
                ? 'Aparta tu lugar con tus datos y el contacto de emergencia.'
                : 'Aparta tu lugar y paga por transferencia. Tu lugar se confirma al recibir el pago.'}
            </p>
          </aside>
        </div>

        <section className="ev-faq" aria-labelledby="ev-faq-titulo">
          <h2 id="ev-faq-titulo" className="ev-h2">Preguntas frecuentes</h2>
          <div className="faq-lista">
            {FAQ.map((f) => (
              <details className="faq-item" key={f.q}>
                <summary>
                  <span>{f.q}</span>
                  <span className="faq-mas" aria-hidden="true" />
                </summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>

      {abierto && (
        <ReservaModal evento={evento} onCerrar={() => setAbierto(false)} onListo={alTerminar} />
      )}
    </main>
  );
}
