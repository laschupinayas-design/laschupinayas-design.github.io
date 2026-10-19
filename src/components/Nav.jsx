import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { grupo } from '../config';
import { authDisponible, nombreUsuario, salir, useAuth } from '../lib/auth';
import LoginModal from './LoginModal';
import './Nav.css';

const MENU = [
  { texto: 'Inicio', to: '/' },
  { texto: 'Próximos eventos', to: '/eventos' },
  { texto: 'Eventos privados', to: '/eventos-privados' },
  { texto: 'Quiénes somos', to: '/quienes-somos' },
];

export default function Nav() {
  const [abierto, setAbierto] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [loginAbierto, setLoginAbierto] = useState(false);
  const { usuario, esAdmin } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const enHome = pathname === '/';
  const compacto = scrolled || abierto || !enHome;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setAbierto(false);
  }, [pathname]);

  useEffect(() => {
    if (!abierto) return undefined;
    const onKey = (e) => e.key === 'Escape' && setAbierto(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [abierto]);

  const irASeccion = (id) => (e) => {
    e.preventDefault();
    setAbierto(false);
    if (enHome) document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    else navigate('/', { state: { scrollTo: id } });
  };

  const alInicio = () => {
    setAbierto(false);
    if (enHome) window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <nav className={`nav ${compacto ? 'nav-compacto' : ''}`} aria-label="Principal">
        <div className="nav-bar">
          <Link className="nav-brand" to="/" onClick={alInicio} aria-label={`${grupo.nombre}, ir al inicio`}>
            <img
              className="nav-logo"
              src={`${import.meta.env.BASE_URL}logo-chupinayas.png`}
              alt=""
              width="900"
              height="431"
            />
          </Link>

          <button
            type="button"
            className="nav-toggle"
            aria-expanded={abierto}
            aria-controls="menu-principal"
            aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setAbierto((a) => !a)}
          >
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
              {abierto ? <path d="M5 5l14 14M19 5L5 19" /> : <path d="M3 7h18M3 12h18M3 17h18" />}
            </svg>
          </button>

          <ul id="menu-principal" className={`nav-links ${abierto ? 'open' : ''}`}>
            {MENU.map((m) => (
              <li key={m.texto} className="nav-item">
                {m.to ? (
                  <Link to={m.to} onClick={m.to === '/' ? alInicio : undefined}>{m.texto}</Link>
                ) : (
                  <a href={`#${m.seccion}`} onClick={irASeccion(m.seccion)}>{m.texto}</a>
                )}
              </li>
            ))}
            {esAdmin && (
              <li className="nav-item">
                <Link to="/admin/eventos">Registrar evento</Link>
              </li>
            )}
            {authDisponible &&
              (usuario ? (
                <>
                  <li className="nav-user" title={usuario.email}>{nombreUsuario(usuario)}</li>
                  <li className="nav-auth">
                    <button
                      type="button"
                      className="nav-boton"
                      onClick={() => {
                        setAbierto(false);
                        salir();
                      }}
                    >
                      Cerrar sesión
                    </button>
                  </li>
                </>
              ) : (
                <li className="nav-auth">
                  <button
                    type="button"
                    className="nav-boton"
                    onClick={() => {
                      setAbierto(false);
                      setLoginAbierto(true);
                    }}
                  >
                    Iniciar sesión
                  </button>
                </li>
              ))}
          </ul>
        </div>
      </nav>
      {loginAbierto && <LoginModal onCerrar={() => setLoginAbierto(false)} />}
    </>
  );
}
