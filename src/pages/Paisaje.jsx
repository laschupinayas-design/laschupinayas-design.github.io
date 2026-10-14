// Paisaje ilustrado que se muestra cuando no hay foto.
export default function Paisaje({ className }) {
  return (
    <svg className={className} viewBox="0 0 1200 800" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <path d="M0 520 L140 420 L260 500 L420 330 L560 470 L700 380 L860 500 L1000 400 L1200 520 L1200 800 L0 800 Z" fill="#3d6b64" opacity="0.7" />
      <path d="M0 600 L180 470 L320 580 L520 400 L700 590 L880 460 L1040 580 L1200 500 L1200 800 L0 800 Z" fill="#2a5550" />
      <path d="M0 700 L200 590 L360 680 L560 560 L760 700 L960 600 L1200 700 L1200 800 L0 800 Z" fill="#14372c" />
    </svg>
  );
}
