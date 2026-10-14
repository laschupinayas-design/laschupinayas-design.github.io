import { grupo } from '../config';
import './Footer.css';

// Redes sociales: agrega los enlaces en src/config.js, por ejemplo:
//   redes: { instagram: 'https://instagram.com/tu_usuario', facebook: '...', tiktok: '...' }
// El WhatsApp usa grupo.whatsapp. Las redes sin enlace se ocultan al publicar la página.
const ICONO = {
  instagram: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  facebook: <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />,
  tiktok: (
    <>
      <path d="M14.5 3v11.2a3.7 3.7 0 1 1-3.7-3.7" />
      <path d="M14.5 3c.3 2.5 2 4.2 4.6 4.5" />
    </>
  ),
  whatsapp: (
    <>
      <path d="M20.5 11.6a8.5 8.5 0 0 1-12.6 7.4L3.5 20.5l1.5-4.3a8.5 8.5 0 1 1 15.5-4.6z" />
      <path d="M9 8.4c0 3.5 3 6.5 6.4 6.6l1.1-1.5-2.1-1-.9.8a4.6 4.6 0 0 1-2.3-2.3l.8-.9-1-2.1z" />
    </>
  ),
};

const REDES = [
  { clave: 'instagram', nombre: 'Instagram', url: grupo.redes?.instagram },
  { clave: 'facebook', nombre: 'Facebook', url: grupo.redes?.facebook },
  { clave: 'tiktok', nombre: 'TikTok', url: grupo.redes?.tiktok },
  { clave: 'whatsapp', nombre: 'WhatsApp', url: grupo.redes?.whatsapp || grupo.whatsapp },
];

function IconoRed({ clave }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONO[clave]}
    </svg>
  );
}

export default function Footer() {
  const visibles = REDES.filter((r) => r.url || import.meta.env.DEV);
  const anio = new Date().getFullYear();

  return (
    <footer className="pie">
      <div className="pie-banner">
        {/* Banner con el paisaje, el logo y la frase. Archivo: public/footer-chupinayas.jpg */}
        <img
          className="pie-img"
          src={`${import.meta.env.BASE_URL}footer-chupinayas.jpg`}
          alt={`${grupo.nombre}. Tu camino también tiene un lugar aquí.`}
          width="1920"
          height="640"
        />

        {visibles.length > 0 && (
          <ul className="pie-redes" aria-label="Redes sociales">
            {visibles.map((r) => (
              <li key={r.clave}>
                {r.url ? (
                  <a className="pie-red" href={r.url} target="_blank" rel="noreferrer" aria-label={r.nombre}>
                    <IconoRed clave={r.clave} />
                  </a>
                ) : (
                  <span className="pie-red pie-red-vacia" title={`Agrega el enlace de ${r.nombre} en src/config.js`} aria-hidden="true">
                    <IconoRed clave={r.clave} />
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="pie-legal">
        © {anio} {grupo.nombre}. Lleva agua, calzado cómodo y avisa si no puedes asistir.
      </p>
    </footer>
  );
}
