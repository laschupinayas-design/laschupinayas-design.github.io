import { useState } from 'react';
import { Link } from 'react-router-dom';
import { grupo } from '../config';
import Paisaje from './Paisaje';
import './Hero.css';

// Textos de la portada. Para cambiarlos, edita estas líneas
// o agrega heroInicio, heroCursiva, heroDescripcion y heroBoton en src/config.js.
const TEXTO = {
  inicio: grupo.heroInicio || 'Mujeres que',
  cursiva: grupo.heroCursiva || 'caminan, conectan y florecen.',
  descripcion:
    grupo.heroDescripcion ||
    'Chupinayas, somos un grupo de Hike de mujeres enfocado a manifestar la energía femenina, para compartir experiencias, recrearnos y sanarnos en comunidad; una comunidad que cuida, ama, conecta y disfruta de la naturaleza.',
  boton: grupo.heroBoton || 'Camina con nosotras',
};

// Fases de la luna (decoración sobre el título)
function Lunas() {
  const lunas = [
    { cx: 12, cy: 24, r: 6, dx: 3.5 },
    { cx: 38, cy: 17, r: 9, dx: 4.5 },
    { cx: 76, cy: 13, r: 12, dx: 3 },
    { cx: 114, cy: 17, r: 9, dx: -4.5 },
    { cx: 140, cy: 24, r: 6, dx: -3.5 },
  ];
  return (
    <svg className="hero-lunas" viewBox="0 0 160 42" aria-hidden="true">
      <defs>
        {lunas.map((l, i) => (
          <mask id={`luna-${i}`} key={i}>
            <rect x="0" y="0" width="160" height="42" fill="white" />
            <circle cx={l.cx + l.dx} cy={l.cy - 1} r={l.r * 0.92} fill="black" />
          </mask>
        ))}
      </defs>
      {lunas.map((l, i) => (
        <circle key={i} cx={l.cx} cy={l.cy} r={l.r} fill="currentColor" mask={`url(#luna-${i})`} />
      ))}
      <path d="M60 28 L61.4 32.6 L66 34 L61.4 35.4 L60 40 L58.6 35.4 L54 34 L58.6 32.6 Z" fill="currentColor" />
    </svg>
  );
}

// Ramita dibujada con línea fina (decoración en las esquinas de abajo)
function Botanico({ className }) {
  const hojas = [
    { x: 17, y: 190, a: -25, s: 0.9 },
    { x: 21, y: 165, a: -150, s: 1 },
    { x: 26, y: 139, a: -35, s: 1.1 },
    { x: 33, y: 110, a: -150, s: 1.1 },
    { x: 42, y: 78, a: -40, s: 1 },
    { x: 53, y: 41, a: -145, s: 0.8 },
    { x: 62, y: 14, a: -80, s: 0.7 },
  ];
  return (
    <svg className={className} viewBox="0 0 120 220" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" aria-hidden="true">
      <path d="M14 215 C20 160 30 110 62 14" />
      {hojas.map((h, i) => (
        <g key={i} transform={`translate(${h.x} ${h.y}) rotate(${h.a}) scale(${h.s})`}>
          <path d="M0 0 C10 -9 26 -10 40 -4 C28 4 12 7 0 0 Z" />
          <path d="M2 0 Q18 -3 36 -4" />
        </g>
      ))}
    </svg>
  );
}

export default function Hero() {
  // Pon tu foto en public/hero.jpg. Si no existe, se muestra un paisaje ilustrado.
  // Para celular pon otra foto en public/hero-mobile.jpg. Si no existe, se usa hero.jpg.
  const [foto, setFoto] = useState(true);
  const [movil, setMovil] = useState(true);
  const base = import.meta.env.BASE_URL;
  const alFallar = () => (movil ? setMovil(false) : setFoto(false));

  return (
    <section id="inicio" className="hero">
      <Paisaje className="hero-ridges" />
      {foto && (
        <picture>
          {movil && <source media="(max-width: 700px)" srcSet={`${base}hero_2.jpeg`} />}
          <img className="hero-img" src={`${base}hero.png`} alt="" onError={alFallar} />
        </picture>
      )}
      <div className="hero-shade" aria-hidden="true" />
      <Botanico className="hero-bot hero-bot-izq" />
      <Botanico className="hero-bot hero-bot-der" />

      <div className="wrap hero-body">
        <div className="hero-texto">
          <Lunas />
          <h1>
            {TEXTO.inicio}
            <br />
            <em>{TEXTO.cursiva}</em>
          </h1>
          <p className="hero-lead">{TEXTO.descripcion}</p>
          <Link className="hero-cta" to="/eventos">
            {TEXTO.boton} <span aria-hidden="true">›</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
