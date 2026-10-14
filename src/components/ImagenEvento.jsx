import Paisaje from './Paisaje';

// Foto del evento. Si no hay foto, muestra un paisaje ilustrado.
// La foto puede ser una URL completa o un archivo de la carpeta public/.
export default function ImagenEvento({ src, className = '', alt = '' }) {
  const estilo = { display: 'block', width: '100%', objectFit: 'cover' };
  if (className.includes('modal-img')) estilo.height = '100%';

  if (!src) return <Paisaje className={className} />;
  const url = /^(https?:|data:)/.test(src) ? src : `${import.meta.env.BASE_URL}${src.replace(/^\//, '')}`;
  return <img src={url} alt={alt} className={className} style={estilo} loading="lazy" />;
}
