import { Link, useSearchParams } from 'react-router-dom';
import { modoDemo, useEventos } from '../lib/eventos';
import EventoCard from '../components/EventoCard';

const FILTROS = [
  { clave: null, texto: 'Todos', to: '/eventos' },
  { clave: 'tour', texto: 'Eventos', to: '/eventos?tipo=tour' },
  { clave: 'gratuito', texto: 'Eventos gratuitos', to: '/eventos?tipo=gratuito' },
];

export default function Eventos() {
  const [params] = useSearchParams();
  const tipo = params.get('tipo');
  const { eventos, cargando, error } = useEventos();
  const lista = tipo ? eventos.filter((e) => e.tipo === tipo) : eventos;
  const titulo = tipo === 'tour' ? 'Eventos' : tipo === 'gratuito' ? 'Eventos gratuitos' : 'Próximos eventos';

  return (
    <main>
      <header className="page-head page-head-eventos">
        <div className="wrap">
          <h1>{titulo}</h1>
          <p>Elige un evento para ver los detalles y registrarte.</p>
        </div>
      </header>

      <div className="wrap page-lista">
        {modoDemo && (
          <p className="aviso">
            Estás viendo eventos de ejemplo. Configura Supabase (archivo .env.local) para mostrar tus eventos reales.
          </p>
        )}

        <div className="filtros" role="navigation" aria-label="Filtrar eventos">
          {FILTROS.map((f) => (
            <Link key={f.texto} to={f.to} aria-current={tipo === f.clave ? 'page' : undefined}>
              {f.texto}
            </Link>
          ))}
        </div>

        {cargando && <p className="vacio">Cargando eventos…</p>}
        {error && <p className="vacio">No pudimos cargar los eventos. Inténtalo de nuevo en unos minutos.</p>}
        {!cargando && !error && lista.length === 0 && (
          <p className="vacio">No hay eventos próximos en esta categoría.</p>
        )}
        {lista.length > 0 && (
          <ul className="cards">
            {lista.map((e) => (
              <EventoCard key={e.id} e={e} />
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
