import { useEffect } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import Nav from './components/Nav';
import Footer from './components/Footer';
import Home from './pages/Home';
import Eventos from './pages/Eventos';
import EventoDetalle from './pages/EventoDetalle';
import Reserva from './pages/Reserva';
import EventosPrivados from './pages/EventosPrivados';
import QuienesSomos from './pages/QuienesSomos';
import AdminEventos from './pages/AdminEventos';
import Resenas from './pages/Resenas';

// Al cambiar de página, vuelve arriba (salvo que se pida bajar a una sección de la home).
function ScrollToTop() {
  const { pathname, state } = useLocation();
  useEffect(() => {
    if (!state?.scrollTo) window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

function NoEncontrada() {
  return (
    <main className="page page-texto">
      <div className="wrap">
        <h1>Página no encontrada</h1>
        <p>El enlace no existe o cambió de lugar.</p>
        <Link className="cta cta-dark" to="/">Ir al inicio</Link>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Nav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/eventos" element={<Eventos />} />
        <Route path="/eventos/:slug" element={<EventoDetalle />} />
        <Route path="/reserva/:id" element={<Reserva />} />
        <Route path="/eventos-privados" element={<EventosPrivados />} />
        <Route path="/quienes-somos" element={<QuienesSomos />} />
        <Route path="/admin/eventos" element={<AdminEventos />} />
        <Route path="/resenas" element={<Resenas />} />
        <Route path="*" element={<NoEncontrada />} />
      </Routes>
      <Footer />
    </>
  );
}
