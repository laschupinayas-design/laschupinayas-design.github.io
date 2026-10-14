import { Link } from 'react-router-dom';
import { audienciaClave, audienciaTexto, badgeDias, fechaLarga, precioTexto, textoLugares } from '../lib/formato';
import ImagenEvento from './ImagenEvento';
import IconoUbicacion from './IconoUbicacion';
import { textoUbicacion } from '../lib/ubicacion';
import './EventoCard.css';

function Icono({ tipo }) {
  const props = {
    viewBox: '0 0 24 24',
    width: 26,
    height: 26,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };
  return tipo === 'gratuito' ? (
    <svg {...props}>
      <path d="M12 21V9" />
      <path d="M12 9c-1.4-1.6-1.4-3.4 0-5 1.4 1.6 1.4 3.4 0 5z" />
      <path d="M12 12.5c-3 0-5-2-5-5 3 0 5 2 5 5z" />
      <path d="M12 11c3 0 5-2 5-5-3 0-5 2-5 5z" />
      <path d="M12 17.5c-2.5 0-4.2-1.6-4.4-4 2.5 0 4.2 1.6 4.4 4z" />
      <path d="M12 16c2.5 0 4.2-1.6 4.4-4-2.5 0-4.2 1.6-4.4 4z" />
    </svg>
  ) : (
    <svg {...props}>
      <path d="M3 19 9.5 7 13 13l2.5-3.5L21 19z" />
      <path d="M9.5 7 8 10l1.7-.9 1.5 1.4" />
    </svg>
  );
}

// Hojas rellenas en las esquinas de abajo (decoración)
function Hojas({ className }) {
  const hojas = [
    { x: 8, y: 58, a: -72, s: 0.85, c: '#2a5550' },
    { x: 4, y: 60, a: -38, s: 1.05, c: '#14372c' },
    { x: 14, y: 60, a: -12, s: 0.95, c: '#3d6b64' },
    { x: 7, y: 56, a: -95, s: 0.7, c: '#1d4a3d' },
  ];
  return (
    <svg className={className} viewBox="0 0 100 60" aria-hidden="true">
      {hojas.map((h, i) => (
        <g key={i} transform={`translate(${h.x} ${h.y}) rotate(${h.a}) scale(${h.s})`}>
          <path d="M0 0 C14 -12 34 -14 52 -6 C36 6 14 9 0 0 Z" fill={h.c} />
          <path d="M3 0 Q26 -4 48 -6" fill="none" stroke="rgba(243,236,225,0.45)" strokeWidth="1" />
        </g>
      ))}
    </svg>
  );
}

// Línea con una hoja al centro, debajo del título
function Divisor() {
  return (
    <svg className="card-divisor" viewBox="0 0 112 16" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 8 H40 M72 8 H111" />
      <path d="M56 2 C50.5 6 50.5 11 56 14.5 C61.5 11 61.5 6 56 2 Z" />
      <path d="M56 6 V14.5" />
    </svg>
  );
}

export default function EventoCard({ e }) {
  const badge = badgeDias(e.starts_at);
  const resumen = e.tagline || e.description;
  const agotado = e.spots_left <= 0;
  const ubicacion = textoUbicacion(e);
  const audiencia = audienciaClave(e);

  return (
    <li className="card-item">
      <Link className={`card card-${e.tipo}`} to={`/eventos/${e.slug}`}>
        <div className="card-media">
          <div className="card-foto">
            <ImagenEvento src={e.image_url} className="card-img" />
          </div>
          <span className="card-icono"><Icono tipo={e.tipo} /></span>
          <span className={`card-audiencia card-audiencia-${audiencia}`}>{audienciaTexto(e)}</span>
          {badge && <span className="card-badge">{badge}</span>}
        </div>

        <div className="card-cuerpo">
          <Hojas className="card-hojas card-hojas-izq" />
          <Hojas className="card-hojas card-hojas-der" />

          <p className="card-fecha">{fechaLarga(e.starts_at)}</p>
          <h3>{e.title}</h3>
          {ubicacion && (
            <p className="card-ubicacion">
              <IconoUbicacion size={17} />
              <span>{ubicacion}</span>
            </p>
          )}
          <Divisor />
          {resumen && <p className="card-resumen">{resumen}</p>}

          <div className="card-pie">
            <span className="card-boton">
              Más información
              <span className="card-flecha" aria-hidden="true">→</span>
            </span>
            <span className="card-datos">
              <strong>{precioTexto(e.price_mxn)}</strong>
              <span className={agotado ? 'card-agotado' : undefined}>{textoLugares(e.spots_left)}</span>
            </span>
          </div>
        </div>
      </Link>
    </li>
  );
}
