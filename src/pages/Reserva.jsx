import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { grupo } from '../config';
import { fechaLarga, hora, precioTexto } from '../lib/formato';
import { consultarReserva, pagoConTarjeta } from '../lib/openpay';
import PagoTarjeta from '../components/PagoTarjeta';
import './Reserva.css';

// Busca los datos de la cuenta en src/config.js sin importar cómo se llame el bloque
// (transferencia, pago, etc.): el primero que tenga una CLABE.
function datosCuenta() {
  const bloque =
    Object.values(grupo).find(
      (v) => v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).some((k) => /clabe/i.test(k)),
    ) || {};
  const tomar = (re, excluir) => {
    const k = Object.keys(bloque).find((c) => re.test(c) && !(excluir && excluir.test(c)));
    return k ? String(bloque[k]) : '';
  };
  return {
    banco: tomar(/banco|bank/i),
    titular: tomar(/titular|benef|nombre|name/i),
    clabe: tomar(/clabe/i),
    cuenta: tomar(/cuenta|account/i, /clabe/i),
  };
}

function Copiar({ texto }) {
  const [ok, setOk] = useState(false);
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(texto);
      setOk(true);
      setTimeout(() => setOk(false), 1800);
    } catch {
      /* si el navegador no deja copiar, se puede seleccionar el texto */
    }
  };
  return (
    <button type="button" className="rv-copiar" onClick={copiar} aria-live="polite">
      {ok ? '✓ Copiado' : 'Copiar'}
    </button>
  );
}

function Fila({ etiqueta, valor, copiable, destacado }) {
  if (!valor) return null;
  return (
    <div className={`rv-fila${destacado ? ' rv-fila-destacada' : ''}`}>
      <dt>{etiqueta}</dt>
      <dd>
        <span className="rv-valor">{valor}</span>
        {copiable && <Copiar texto={valor} />}
      </dd>
    </div>
  );
}

export default function Reserva() {
  const { id } = useParams();
  const { state } = useLocation();
  const cuenta = datosCuenta();

  // Estado real del pago (servidor). También sirve al volver de la verificación 3D Secure del banco.
  const [info, setInfo] = useState(null);
  const [verificando, setVerificando] = useState(pagoConTarjeta);
  const [metodo, setMetodo] = useState(pagoConTarjeta ? 'tarjeta' : 'transferencia');

  useEffect(() => {
    if (!pagoConTarjeta) return undefined;
    let vivo = true;
    consultarReserva(id)
      .then((r) => vivo && setInfo(r))
      .catch(() => {}) // si no hay conexión, se muestra la pantalla normal
      .finally(() => vivo && setVerificando(false));
    return () => { vivo = false; };
  }, [id]);

  const referencia = String(id).slice(0, 8).toUpperCase();
  const dato = info?.reserva;
  const nombre = state?.full_name ?? state?.nombre ?? state?.name ?? dato?.full_name ?? '';
  const lugares = state?.spots ?? state?.lugares ?? dato?.spots ?? null;
  const totalBruto = state?.total ?? state?.monto ?? state?.total_mxn ?? dato?.total ?? null;
  const total = totalBruto == null ? null : Number(totalBruto);
  const evento = state?.evento ?? dato?.evento;
  const requierePago = total == null || total > 0;
  const pagado = info?.estado === 'confirmada';
  const rechazado = info?.estado === 'rechazado';
  const cancelada = info?.estado === 'cancelada';
  const verTarjeta = pagoConTarjeta && requierePago && total != null && !pagado && !cancelada;
  const verTransferencia = requierePago && !pagado && !cancelada && (!verTarjeta || metodo === 'transferencia');

  const contacto = grupo.whatsapp
    ? `${grupo.whatsapp}${grupo.whatsapp.includes('?') ? '&' : '?'}text=${encodeURIComponent(
        `Hola, envío mi comprobante de pago. Referencia: ${referencia}${nombre ? `, a nombre de ${nombre}` : ''}.`,
      )}`
    : grupo.email
      ? `mailto:${grupo.email}?subject=${encodeURIComponent(`Comprobante ${referencia}`)}`
      : '';

  const alPagar = () => {
    setInfo((a) => ({ ...(a || {}), estado: 'confirmada' }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className="page rv">
      <div className="wrap rv-wrap">
        <header className="rv-cabecera">
          <span className="rv-check" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          </span>
          <div>
            <h1 className="rv-titulo">{pagado ? 'Pago recibido' : cancelada ? 'Reserva cancelada' : 'Reserva recibida'}</h1>
            <p className="rv-lead">
              {pagado && 'Tu pago se confirmó y tu lugar quedó asegurado. ¡Nos vemos pronto!'}
              {cancelada && 'Esta reserva fue cancelada. Escríbenos si crees que es un error.'}
              {!pagado && !cancelada && (
                <>
                  Tu lugar queda apartado como pendiente hasta que confirmemos tu pago.
                  {requierePago && (verTarjeta ? ' Elige cómo quieres pagar.' : ' Haz tu transferencia con los datos de abajo.')}
                </>
              )}
            </p>
          </div>
        </header>

        {verificando && <p className="rv-aviso">Revisando el estado de tu pago…</p>}
        {rechazado && !pagado && (
          <p className="rv-aviso rv-aviso-error" role="alert">
            El pago con tarjeta no se completó. Puedes intentarlo de nuevo o pagar por transferencia.
          </p>
        )}

        <div className="rv-grid">
          <section className="rv-card" aria-labelledby="rv-t-resumen">
            <h2 id="rv-t-resumen" className="rv-h2">Resumen</h2>
            <dl className="rv-lista">
              {evento && <Fila etiqueta="Evento" valor={evento.title} />}
              {evento?.starts_at && (
                <Fila etiqueta="Fecha" valor={`${fechaLarga(evento.starts_at)}, ${hora(evento.starts_at)} h`} />
              )}
              {lugares != null && <Fila etiqueta="Lugares" valor={String(lugares)} />}
              <Fila etiqueta="A nombre de" valor={nombre} />
              {total != null && <Fila etiqueta="Total" valor={total > 0 ? precioTexto(total) : 'Gratis'} />}
              <Fila etiqueta="Referencia" valor={referencia} copiable />
              {pagado && <Fila etiqueta="Estado del pago" valor="Pagado" />}
            </dl>
          </section>

          {verTarjeta && (
            <section className="rv-card rv-card-pago" aria-labelledby="rv-t-pago">
              <h2 id="rv-t-pago" className="rv-h2">Forma de pago</h2>
              <div className="rv-metodos" role="tablist" aria-label="Forma de pago">
                <button type="button" role="tab" aria-selected={metodo === 'tarjeta'}
                  className={`rv-metodo${metodo === 'tarjeta' ? ' rv-metodo-activo' : ''}`} onClick={() => setMetodo('tarjeta')}>
                  Tarjeta
                </button>
                <button type="button" role="tab" aria-selected={metodo === 'transferencia'}
                  className={`rv-metodo${metodo === 'transferencia' ? ' rv-metodo-activo' : ''}`} onClick={() => setMetodo('transferencia')}>
                  Transferencia
                </button>
              </div>
              {metodo === 'tarjeta' && <PagoTarjeta reservaId={id} total={total} onPagado={alPagar} />}
              {metodo === 'transferencia' && (
                <p className="rv-nota-metodo">Hacer la transferencia con los datos de abajo. Tu lugar se confirma cuando recibimos el pago.</p>
              )}
            </section>
          )}

          {verTransferencia && (
            <section className="rv-card rv-card-pago" aria-labelledby="rv-t-transf">
              <h2 id="rv-t-transf" className="rv-h2">Datos de transferencia</h2>

              {total != null && total > 0 && (
                <p className="rv-monto">
                  <span>Monto exacto</span>
                  <strong>{precioTexto(total)}</strong>
                </p>
              )}

              <dl className="rv-lista">
                <Fila etiqueta="Banco" valor={cuenta.banco} />
                <Fila etiqueta="Titular" valor={cuenta.titular} />
                <Fila etiqueta="CLABE" valor={cuenta.clabe} copiable destacado />
                <Fila etiqueta="Cuenta" valor={cuenta.cuenta} copiable />
                <Fila etiqueta="Referencia o concepto" valor={referencia} copiable destacado />
              </dl>
            </section>
          )}
        </div>

        {verTransferencia && (
          <section className="rv-pasos" aria-labelledby="rv-t-pasos">
            <h2 id="rv-t-pasos" className="rv-h2">Qué sigue</h2>
            <ol>
              <li>Haz la transferencia por el monto exacto y escribe la referencia como concepto.</li>
              <li>Envía tu comprobante a quien organiza el evento indicando tu nombre y la referencia.</li>
              <li>Cuando confirmemos tu pago, tu lugar queda asegurado.</li>
            </ol>
          </section>
        )}

        <div className="rv-acciones">
          {contacto && !pagado && verTransferencia && (
            <a className="rv-boton rv-boton-morado" href={contacto} target="_blank" rel="noreferrer">
              {grupo.whatsapp ? 'Enviar comprobante por WhatsApp' : 'Enviar comprobante por correo'}
            </a>
          )}
          <Link className="rv-boton rv-boton-verde" to="/eventos">Ver más eventos</Link>
        </div>
      </div>
    </main>
  );
}
