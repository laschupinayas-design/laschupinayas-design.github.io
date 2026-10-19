import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { cambiarEstadoReserva, listarEventosAdmin, listarReservas, resumenReservas } from '../lib/admin';
import { fechaLarga, hora, precioTexto } from '../lib/formato';

// "confirmada" en la base de datos es el estado "Autorizado" en el panel.
const ESTADOS = {
  pendiente: { texto: 'Pendiente', clase: 'rs-pendiente' },
  pagada: { texto: 'Pagada', clase: 'rs-pendiente' },
  confirmada: { texto: 'Autorizado', clase: 'rs-autorizado' },
  cancelada: { texto: 'Cancelada', clase: 'rs-cancelada' },
};

const fechaCorta = (iso) =>
  new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });

function contar(filas) {
  const r = { autorizados: 0, pendientes: 0, registros: 0 };
  filas.forEach((x) => {
    if (x.status === 'cancelada') return;
    r.registros += 1;
    if (x.status === 'confirmada') r.autorizados += x.spots;
    else r.pendientes += x.spots;
  });
  return r;
}

function Detalle({ r }) {
  return (
    <dl className="rs-detalle">
      <div><dt>Fecha de nacimiento</dt><dd>{r.birth_date ? fechaCorta(`${r.birth_date}T12:00:00`) : '—'}</dd></div>
      <div><dt>Notas médicas</dt><dd>{r.medical_notes || 'Sin notas'}</dd></div>
      <div>
        <dt>Contacto de emergencia</dt>
        <dd>{r.emergency_name} ({r.emergency_relationship}) · {r.emergency_phone_country} {r.emergency_phone}</dd>
      </div>
      <div><dt>Referencia de pago</dt><dd>{r.payment_ref || '—'}</dd></div>
    </dl>
  );
}

export default function AdminReservaciones() {
  const [eventos, setEventos] = useState(null);
  const [resumen, setResumen] = useState([]);
  const [elegido, setElegido] = useState(null);
  const [reservas, setReservas] = useState(null);
  const [error, setError] = useState('');
  const [ocupado, setOcupado] = useState(null);
  const [abierta, setAbierta] = useState(null);

  const cargarEventos = useCallback(async () => {
    try {
      const [ev, res] = await Promise.all([listarEventosAdmin(), resumenReservas()]);
      setEventos(ev);
      setResumen(res);
    } catch (e) {
      setError(e.message);
      setEventos([]);
    }
  }, []);

  const cargarReservas = useCallback(async (id) => {
    setReservas(null);
    try {
      setReservas(await listarReservas(id));
    } catch (e) {
      setError(e.message);
      setReservas([]);
    }
  }, []);

  useEffect(() => { cargarEventos(); }, [cargarEventos]);

  const porEvento = useMemo(() => {
    const m = new Map();
    resumen.forEach((x) => {
      if (!m.has(x.event_id)) m.set(x.event_id, []);
      m.get(x.event_id).push(x);
    });
    return m;
  }, [resumen]);

  const abrir = (e) => {
    setError('');
    setAbierta(null);
    setElegido(e);
    cargarReservas(e.id);
  };

  const volver = () => {
    setElegido(null);
    setReservas(null);
    setError('');
    cargarEventos();
  };

  const cambiar = async (r) => {
    const nuevo = r.status === 'confirmada' ? 'pendiente' : 'confirmada';
    setOcupado(r.id);
    setError('');
    try {
      await cambiarEstadoReserva(r.id, nuevo);
      setReservas((lista) => lista.map((x) => (x.id === r.id ? { ...x, status: nuevo } : x)));
    } catch (e) {
      setError(e.message);
    } finally {
      setOcupado(null);
    }
  };

  // ----- Detalle de un evento: tabla de personas registradas -----
  if (elegido) {
    const c = contar(reservas || []);
    return (
      <div>
        <button type="button" className="adm-sec rs-volver" onClick={volver}>← Todos los eventos</button>
        <h2 className="rs-titulo">{elegido.title}</h2>
        <p className="adm-meta">
          {fechaLarga(elegido.starts_at)} · {hora(elegido.starts_at)} h · {precioTexto(elegido.price_mxn)} por lugar
        </p>

        {reservas && (
          <ul className="rs-cifras">
            <li><strong>{c.autorizados}</strong><span>lugares autorizados</span></li>
            <li><strong>{c.pendientes}</strong><span>lugares pendientes</span></li>
            <li><strong>{Math.max(elegido.capacity - c.autorizados - c.pendientes, 0)}</strong><span>lugares libres de {elegido.capacity}</span></li>
          </ul>
        )}

        {error && <p className="adm-error" role="alert">{error}</p>}
        {!reservas && <p className="vacio">Cargando personas registradas…</p>}
        {reservas && reservas.length === 0 && <p className="vacio">Todavía no hay personas registradas en este evento.</p>}

        {reservas && reservas.length > 0 && (
          <div className="rs-tabla-wrap">
            <table className="rs-tabla">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Teléfono</th>
                  <th className="rs-num">Lugares</th>
                  <th>Registro</th>
                  <th>Pago</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {reservas.map((r) => {
                  const est = ESTADOS[r.status] || { texto: r.status, clase: 'rs-pendiente' };
                  const cancelada = r.status === 'cancelada';
                  return (
                    <Fragment key={r.id}>
                      <tr className={cancelada ? 'rs-fila-cancelada' : undefined}>
                        <td data-label="Nombre"><strong>{r.full_name}</strong></td>
                        <td data-label="Correo">{r.email}</td>
                        <td data-label="Teléfono">{r.phone_country} {r.phone}</td>
                        <td data-label="Lugares" className="rs-num">{r.spots}</td>
                        <td data-label="Registro">{fechaCorta(r.created_at)}</td>
                        <td data-label="Pago"><span className={`rs-estado ${est.clase}`}>{est.texto}</span></td>
                        <td data-label="Acciones" className="rs-acciones">
                          {!cancelada && (
                            <button
                              type="button"
                              className={r.status === 'confirmada' ? 'adm-sec' : 'rs-autorizar'}
                              disabled={ocupado === r.id}
                              onClick={() => cambiar(r)}
                            >
                              {ocupado === r.id ? 'Guardando…' : r.status === 'confirmada' ? 'Marcar pendiente' : 'Autorizar pago'}
                            </button>
                          )}
                          <button
                            type="button"
                            className="adm-sec"
                            aria-expanded={abierta === r.id}
                            onClick={() => setAbierta(abierta === r.id ? null : r.id)}
                          >
                            {abierta === r.id ? 'Ocultar' : 'Detalle'}
                          </button>
                        </td>
                      </tr>
                      {abierta === r.id && (
                        <tr className="rs-fila-detalle">
                          <td colSpan={7}><Detalle r={r} /></td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // ----- Lista de eventos -----
  return (
    <div>
      <p className="adm-intro">Elige un evento para ver quién se registró y confirmar su pago.</p>
      {error && <p className="adm-error" role="alert">{error}</p>}
      {!eventos && <p className="vacio">Cargando eventos…</p>}
      {eventos && eventos.length === 0 && !error && <p className="vacio">Todavía no hay eventos.</p>}
      <ul className="adm-lista">
        {(eventos || []).map((e) => {
          const c = contar(porEvento.get(e.id) || []);
          return (
            <li key={e.id} className="adm-item">
              <div className="adm-info">
                <p className="adm-titulo">{e.title}</p>
                <p className="adm-meta">
                  {fechaLarga(e.starts_at)} · {hora(e.starts_at)} h · {c.registros} registro{c.registros === 1 ? '' : 's'} ·{' '}
                  {c.autorizados} autorizado{c.autorizados === 1 ? '' : 's'} · {c.pendientes} pendiente{c.pendientes === 1 ? '' : 's'}
                </p>
              </div>
              <div className="adm-botones">
                <button type="button" className="adm-sec" onClick={() => abrir(e)}>Ver registrados →</button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
