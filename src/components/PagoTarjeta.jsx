import { useEffect, useRef, useState } from 'react';
import { precioTexto } from '../lib/formato';
import { cargarOpenpay, cobrarReserva, crearToken, sesionDispositivo } from '../lib/openpay';

const FORM_ID = 'openpay-form';
const CAMPO_DISPOSITIVO = 'openpay-device-id';

// Validación del número de tarjeta (algoritmo de Luhn)
function luhn(num) {
  let suma = 0;
  let doble = false;
  for (let i = num.length - 1; i >= 0; i -= 1) {
    let d = Number(num[i]);
    if (doble) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    suma += d;
    doble = !doble;
  }
  return suma % 10 === 0;
}

const soloDigitos = (t) => t.replace(/\D/g, '');

function validar(v) {
  const e = {};
  const num = soloDigitos(v.numero);
  if (num.length < 13 || num.length > 19 || !luhn(num)) e.numero = 'Revisa el número de tu tarjeta.';
  if (v.nombre.trim().length < 3) e.nombre = 'Escribe el nombre como aparece en la tarjeta.';
  const [mm, aa] = v.vence.split('/');
  const mes = Number(mm);
  const anio = Number(aa);
  const hoy = new Date();
  const vencida =
    !mm || !aa || aa.length !== 2 || mes < 1 || mes > 12 ||
    2000 + anio < hoy.getFullYear() || (2000 + anio === hoy.getFullYear() && mes < hoy.getMonth() + 1);
  if (vencida) e.vence = 'Escribe una fecha vigente (MM/AA).';
  if (!/^\d{3,4}$/.test(v.cvv)) e.cvv = 'Escribe los 3 o 4 dígitos del código.';
  return e;
}

export default function PagoTarjeta({ reservaId, total, onPagado }) {
  const [v, setV] = useState({ numero: '', nombre: '', vence: '', cvv: '' });
  const [errores, setErrores] = useState({});
  const [listo, setListo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [fallo, setFallo] = useState('');
  const dispositivo = useRef('');
  const OPref = useRef(null);

  // Carga Openpay al abrir la pantalla; así el antifraude mide el dispositivo antes de cobrar.
  useEffect(() => {
    let vivo = true;
    cargarOpenpay()
      .then((OP) => {
        if (!vivo) return;
        OPref.current = OP;
        dispositivo.current = sesionDispositivo(OP, FORM_ID, CAMPO_DISPOSITIVO);
        setListo(true);
      })
      .catch((e) => vivo && setFallo(e.message));
    return () => { vivo = false; };
  }, []);

  const cambiar = (campo, valor) => setV((a) => ({ ...a, [campo]: valor }));

  const alNumero = (e) => {
    const d = soloDigitos(e.target.value).slice(0, 19);
    cambiar('numero', d.replace(/(.{4})/g, '$1 ').trim());
  };
  const alVence = (e) => {
    const d = soloDigitos(e.target.value).slice(0, 4);
    cambiar('vence', d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d);
  };

  const pagar = async (ev) => {
    ev.preventDefault();
    setFallo('');
    const errs = validar(v);
    setErrores(errs);
    if (Object.keys(errs).length > 0) {
      requestAnimationFrame(() => document.querySelector(`#${FORM_ID} [aria-invalid="true"]`)?.focus());
      return;
    }
    if (!listo || !OPref.current) {
      setFallo('El sistema de pagos todavía está cargando. Espera un momento e inténtalo de nuevo.');
      return;
    }
    setEnviando(true);
    try {
      const [mm, aa] = v.vence.split('/');
      const token = await crearToken(OPref.current, {
        card_number: soloDigitos(v.numero),
        holder_name: v.nombre.trim(),
        expiration_year: aa,
        expiration_month: mm,
        cvv2: v.cvv,
      });
      const idDispositivo = dispositivo.current || document.getElementById(CAMPO_DISPOSITIVO)?.value || '';
      const r = await cobrarReserva(reservaId, token, idDispositivo);
      if (r.estado === 'confirmada') {
        setV({ numero: '', nombre: '', vence: '', cvv: '' });
        onPagado();
      } else if (r.estado === 'redirigir' && r.url) {
        window.location.href = r.url; // verificación 3D Secure con el banco
      } else {
        setFallo(r.mensaje || 'No se pudo procesar el pago. Inténtalo de nuevo.');
      }
    } catch (err) {
      setFallo(err.message);
    } finally {
      setEnviando(false);
    }
  };

  const campo = (n) => ({
    'aria-invalid': !!errores[n],
    'aria-describedby': errores[n] ? `pt-${n}-error` : undefined,
  });
  const msg = (n) => errores[n] && <p id={`pt-${n}-error`} className="rv-error">{errores[n]}</p>;

  return (
    <form id={FORM_ID} className="rv-tarjeta" onSubmit={pagar} noValidate>
      <input type="hidden" id={CAMPO_DISPOSITIVO} name={CAMPO_DISPOSITIVO} />

      <div className="rv-campo">
        <label htmlFor="pt-numero">Número de tarjeta</label>
        <input id="pt-numero" inputMode="numeric" autoComplete="cc-number" placeholder="0000 0000 0000 0000"
          value={v.numero} onChange={alNumero} {...campo('numero')} />
        {msg('numero')}
      </div>

      <div className="rv-campo">
        <label htmlFor="pt-nombre">Nombre en la tarjeta</label>
        <input id="pt-nombre" autoComplete="cc-name" placeholder="Como aparece en la tarjeta"
          value={v.nombre} onChange={(e) => cambiar('nombre', e.target.value)} {...campo('nombre')} />
        {msg('nombre')}
      </div>

      <div className="rv-fila-campos">
        <div className="rv-campo">
          <label htmlFor="pt-vence">Vence (MM/AA)</label>
          <input id="pt-vence" inputMode="numeric" autoComplete="cc-exp" placeholder="MM/AA"
            value={v.vence} onChange={alVence} {...campo('vence')} />
          {msg('vence')}
        </div>
        <div className="rv-campo">
          <label htmlFor="pt-cvv">Código (CVV)</label>
          <input id="pt-cvv" inputMode="numeric" autoComplete="cc-csc" placeholder="123" type="password"
            value={v.cvv} onChange={(e) => cambiar('cvv', soloDigitos(e.target.value).slice(0, 4))} {...campo('cvv')} />
          {msg('cvv')}
        </div>
      </div>

      {fallo && <p className="rv-error rv-error-envio" role="alert">{fallo}</p>}

      <button type="submit" className="rv-boton rv-boton-verde rv-pagar" disabled={enviando}>
        {enviando ? 'Procesando pago…' : `Pagar ${precioTexto(total)}`}
      </button>
      <p className="rv-seguro">
        Pago seguro procesado por Openpay. Los datos de tu tarjeta no se guardan en este sitio.
      </p>
    </form>
  );
}
