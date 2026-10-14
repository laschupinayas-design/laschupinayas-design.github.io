// Iconos de las actividades de los eventos privados.
const ICONOS = {
  senderismo: { viewBox: '0 0 48 48', dibujo: (
    <>
      <circle cx="27" cy="8.5" r="3.6"/><path d="M26 14.5 22.5 27M25.5 17.5 32 22M33 15l3.5 27"/><path d="M22.5 27 17 42M22.5 27l7.5 6.5-1.5 8.5"/><path d="M24 15.5 20.5 17l2 8.5"/><path d="M4 42h40" opacity=".5"/>
    </>
  ) },
  bici: { viewBox: '0 0 52 48', dibujo: (
    <>
      <circle cx="11" cy="32" r="7.5"/><circle cx="41" cy="32" r="7.5"/><circle cx="11" cy="32" r="10" strokeDasharray="2.2 3" opacity=".6"/><circle cx="41" cy="32" r="10" strokeDasharray="2.2 3" opacity=".6"/><path d="M11 32 20 17M20 17h14M20 17l4 15M24 32 34 17M11 32h13M34 17l7 15M18 13.5h7M31.5 13.5H37M34 17v-3.5"/>
    </>
  ) },
  yoga: { viewBox: '0 0 48 48', dibujo: (
    <>
      <circle cx="24" cy="9" r="4.2"/><path d="M24 15v13"/><path d="M24 18C19 20 14.5 24.5 12 32M24 18c5 2 9.5 6.5 12 14"/><path d="M8 37c6 3.5 26 3.5 32 0M12 32c1 4.5 6 6 12 6s11-1.5 12-6"/><path d="M5 44h38" opacity=".5"/>
    </>
  ) },
  camping: { viewBox: '0 0 48 48', dibujo: (
    <>
      <path d="M3 41 24 8l21 33Z"/><path d="M24 41V24M24 24l-7 17M24 24l7 17"/><path d="M24 8V4" /><path d="M2 41h44" opacity=".5"/>
    </>
  ) },
};

export default function IconoActividad({ clave, size = 44, className }) {
  const i = ICONOS[clave];
  if (!i) return null;
  return (
    <svg
      className={className}
      viewBox={i.viewBox}
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {i.dibujo}
    </svg>
  );
}
