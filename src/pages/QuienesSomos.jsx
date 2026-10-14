import { useState } from 'react';
import { Link } from 'react-router-dom';
import { grupo } from '../config';
import Paisaje from '../components/Paisaje';
import './QuienesSomos.css';

// ---- Textos de la página: edítalos aquí ----
// La foto va en public/quienes-somos.jpg.
// Para poner la foto a la derecha, agrega  quienesFotoDerecha: true  en src/config.js.
const PARRAFOS = [
  'Chupinayas somos un grupo de hike de mujeres enfocado a manifestar la energía femenina, para compartir experiencias, recrearnos y sanarnos en comunidad.',
  'Somos una comunidad que cuida, ama, conecta y disfruta de la naturaleza.',
];
const LEMA = ['Fuerza en comunidad.', 'Libertad en la naturaleza.'];
const PILARES = [
  {
    icono: 'monte',
    titulo: 'Compartimos experiencias',
    texto: 'Rutas, historias, aprendizajes y momentos inolvidables que nos inspiran a ser mejores, dentro y fuera del sendero.',
  },
  {
    icono: 'luna',
    titulo: 'Nos recreamos y sanamos',
    texto: 'El movimiento, la naturaleza y la energía del grupo nos dan fuerza, equilibrio y paz.',
  },
  {
    icono: 'hoja',
    titulo: 'Cuidamos la naturaleza',
    texto: 'Dejamos huella positiva, respetamos los ecosistemas y caminamos con conciencia por un planeta más vivo.',
  },
];

const BASE = import.meta.env.BASE_URL;

function Foto() {
  // Si todavía no existe la foto, se ve un paisaje ilustrado.
  const [hay, setHay] = useState(Boolean(grupo.quienesFoto));
  const src = grupo.quienesFoto || `${BASE}quienes-somos.jpg`;

  return (
    <div className="qs-foto">
      <Paisaje className="qs-foto-paisaje" />
      {hay && (
        <img
          src={src}
          alt="Fotografía del grupo"
          onError={() => setHay(false)}
        />
      )}
    </div>
  );
}

// Hojas del fondo: son PNG/WebP transparentes que van en public/
function Flora({ archivo, ancho, alto, className }) {
  return (
    <img
      className={`qs-flora ${className}`}
      src={`${BASE}${archivo}`}
      width={ancho}
      height={alto}
      alt=""
      aria-hidden="true"
    />
  );
}

function Divisor() {
  return (
    <svg className="qs-divisor" viewBox="0 0 112 16" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 8 H40 M72 8 H111" />
      <path d="M56 2 C50.5 6 50.5 11 56 14.5 C61.5 11 61.5 6 56 2 Z" />
      <path d="M56 6 V14.5" />
    </svg>
  );
}

function Icono({ tipo }) {
  const props = {
    viewBox: '0 0 24 24',
    width: 28,
    height: 28,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };
  if (tipo === 'luna') {
    return (
      <svg {...props}>
        <path d="M20.5 13.2A8.5 8.5 0 1 1 10.8 3.5a6.6 6.6 0 0 0 9.7 9.7z" />
      </svg>
    );
  }
  if (tipo === 'hoja') {
    return (
      <svg {...props}>
        <path d="M12 21V9" />
        <path d="M12 9c-1.4-1.6-1.4-3.4 0-5 1.4 1.6 1.4 3.4 0 5z" />
        <path d="M12 12.5c-3 0-5-2-5-5 3 0 5 2 5 5z" />
        <path d="M12 11c3 0 5-2 5-5-3 0-5 2-5 5z" />
        <path d="M12 17.5c-2.5 0-4.2-1.6-4.4-4 2.5 0 4.2 1.6 4.4 4z" />
        <path d="M12 16c2.5 0 4.2-1.6 4.4-4-2.5 0-4.2 1.6-4.4 4z" />
      </svg>
    );
  }
  return (
    <svg {...props}>
      <path d="M3 19 9.5 7 13 13l2.5-3.5L21 19z" />
      <path d="M9.5 7 8 10l1.7-.9 1.5 1.4" />
    </svg>
  );
}

export default function QuienesSomos() {
  const invertida = Boolean(grupo.quienesFotoDerecha);

  return (
    <main className="qs">
      {/* Mitad foto, mitad texto */}
      <section className={`qs-split${invertida ? ' qs-invertida' : ''}`}>
        <Foto />

        <div className="qs-texto">
          {invertida ? (
            <Flora archivo="botanico-izq-inf.webp" ancho={319} alto={580} className="qs-flora-panel-izq" />
          ) : (
            <Flora archivo="botanico-der-sup.webp" ancho={335} alto={332} className="qs-flora-panel-der" />
          )}

          <div className="qs-texto-in">
            <h1>Quiénes somos</h1>
            <Divisor />
            <p className="qs-lead">{PARRAFOS[0]}</p>
            {PARRAFOS.slice(1).map((p) => (
              <p key={p} className="qs-parrafo">{p}</p>
            ))}
            <p className="qs-lema">
              {LEMA[0]} <em>{LEMA[1]}</em>
            </p>
            <Link className="qs-cta" to="/eventos">
              Camina con nosotras <span aria-hidden="true">›</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Lo que nos une */}
      <section className="qs-pilares" aria-label="Lo que nos une">
        <Flora archivo="botanico-izq-inf.webp" ancho={319} alto={580} className="qs-flora-izq" />
        <Flora archivo="botanico-der-inf.webp" ancho={238} alto={260} className="qs-flora-der" />

        <ul className="qs-lista">
          {PILARES.map((p) => (
            <li key={p.titulo} className={`qs-pilar qs-pilar-${p.icono}`}>
              <span className="qs-icono"><Icono tipo={p.icono} /></span>
              <h2>{p.titulo}</h2>
              <Divisor />
              <p>{p.texto}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
