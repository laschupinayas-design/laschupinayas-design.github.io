import { Link } from 'react-router-dom';
import { fechaCorta, fechaLarga, hora, precioTexto } from '../lib/formato';

export default function EventoFila({ e }) {
  const f = fechaCorta(e.starts_at);
  return (
    <li className="salida-item">
      <Link className="salida" to={`/eventos/${e.slug}`}>
        <div className="salida-fecha" aria-label={fechaLarga(e.starts_at)}>
          <span className="dia">{f.dia}</span>
          <span className="mes">{f.mes}</span>
        </div>
        <div className="salida-info">
          <h3>{e.title}</h3>
          <p>{hora(e.starts_at)} h, {e.meeting_point}</p>
        </div>
        <p className="salida-datos">
          {e.distance_km} km, {e.elevation_m} m de desnivel, nivel {e.level}
          <strong className="precio">{precioTexto(e.price_mxn)}</strong>
        </p>
      </Link>
    </li>
  );
}
