import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { grupo } from '../config';
import { useEventos } from '../lib/eventos';
import EventoCard from '../components/EventoCard';
import Hero from '../components/Hero';

export default function Home() {
  const { state } = useLocation();
  const { eventos, cargando } = useEventos();
  const proximos = eventos.slice(0, 3);

  // Si venimos del menú desde otra página, baja a la sección pedida.
  useEffect(() => {
    if (!state?.scrollTo) return;
    requestAnimationFrame(() => document.getElementById(state.scrollTo)?.scrollIntoView());
  }, [state]);

  return (
    <main>
      <Hero />

      <section id="proximos-eventos" className="band">
        <div className="wrap">
          <h2>Próximos eventos</h2>
          <p className="band-lead">Elige tu próxima salida y apunta tu lugar.</p>
          {cargando ? (
            <p className="vacio">Cargando eventos…</p>
          ) : proximos.length === 0 ? (
            <p className="vacio">Pronto publicaremos los próximos eventos.</p>
          ) : (
            <ul className="cards">
              {proximos.map((e) => (
                <EventoCard key={e.id} e={e} />
              ))}
            </ul>
          )}
          <Link className="cta cta-dark" to="/eventos">Ver todos los eventos</Link>
        </div>
      </section>

      {/* <section id="quienes-somos" className="band band-sage">
        <div className="wrap quienes">
          <div>
            <h2>Quiénes somos</h2>
            {grupo.quienesSomos.map((p) => (
              <p key={p} className="band-lead">{p}</p>
            ))}
          </div>
          <ul className="principios">
            {grupo.principios.map((p) => (
              <li key={p.titulo}>
                <h3>{p.titulo}</h3>
                <p>{p.texto}</p>
              </li>
            ))}
          </ul>
        </div>
      </section> */}
    </main>
  );
}
