// Edita estos datos con la información de tu grupo.
export const grupo = {
  nombre: 'Nuestro grupo de senderismo',
  lema: 'Caminemos juntos, cada quien a su ritmo.',
  descripcion: 'Salidas a la naturaleza para todos los niveles, a paso tranquilo.',

  // Enlace a tu WhatsApp (ej. https://wa.me/521XXXXXXXXXX). Déjalo vacío si no lo usas.
  whatsapp: '',
  // Correo de contacto (se usa si no hay WhatsApp). Déjalo vacío si no lo usas.
  email: '',

  // Carta de responsabilidad que la gente acepta al reservar.
  // Pon tu PDF en public/carta-responsabilidad.pdf y deja esta ruta, o usa un enlace completo.
  cartaUrl: `${import.meta.env.BASE_URL}carta-responsabilidad.pdf`,

  // Datos que se muestran después de reservar un evento de pago.
  transferencia: {
    banco: 'Banorte',
    titular: 'Angelica Aranda Castillo',
    clabe: '072320013653536930',
  },

  // Imagen para la sección "Quiénes somos". Guarda tu archivo en public/ y pon su nombre aquí.
  quienesFoto: `${import.meta.env.BASE_URL}quienes_somos.jpeg`,
  quienesFotoDerecha: false,

  eventosPrivados: {
    texto:
      'Organizamos una salida solo para tu grupo: amigos, familia o equipo de trabajo. Elegimos contigo la ruta, el nivel y el horario.',
    puntos: [
      'Ruta y nivel a la medida del grupo',
      'Fecha y horario a tu elección',
      'Para amigos, familias o equipos de trabajo',
    ],
  },

  quienesSomos: [
    'Somos Chupinayas, mujeres que encuentran su camino en la naturaleza.',

'Somos una comunidad de mujeres senderistas que encuentra en la naturaleza un espacio para explorar, compartir, descubrir nuevas rutas y crear vínculos auténticos. Creemos en el poder de caminar juntas, en la libertad de aventurarnos y en la magia de esos momentos que nos recuerdan lo maravilloso que es estar vivas.',

'Organizamos caminatas gratuitas para acercar a más mujeres al senderismo, excursiones y experiencias especiales para descubrir nuevos lugares, así como aventuras privadas diseñadas para quienes quieren vivir la naturaleza a su manera.',

'Más que llegar a la cima, nos mueve todo lo que descubrimos en el camino.',
  ],

  principios: [
    { titulo: 'Cada quien a su ritmo', texto: 'Nadie se queda atrás. Esperamos al grupo en cada tramo.' },
    { titulo: 'Seguridad primero', texto: 'Pedimos datos de contacto de emergencia y avisamos qué llevar en cada ruta.' },
    { titulo: 'Cuidamos el sendero', texto: 'Nos llevamos nuestra basura y respetamos el entorno.' },
  ],
};
