import { useEffect, useRef, useState } from 'react';
import { supabase } from '../supabase/supabaseClient';
import { fechaLarga, hora, precioTexto } from '../lib/formato';
import './ReservaModal.css';

const INICIAL = {
  full_name: '', email: '', phone_country: '+52', phone: '', birth_date: '', medical_notes: '',
  emergency_name: '', emergency_relationship: '', emergency_phone_country: '+52', emergency_phone: '',
  waiver: false, website: '',
};

const soloDigitos = (v) => v.replace(/\D/g, '');

function validar(v) {
  const e = {};
  if (v.full_name.trim().length < 2) e.full_name = 'Escribe tu nombre completo.';
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.email.trim())) e.email = 'Escribe un correo válido, por ejemplo nombre@correo.com.';
  if (!/^\+[0-9]{1,3}$/.test(v.phone_country)) e.phone_country = 'Lada inválida (ej. +52).';
  if (!/^[0-9]{7,15}$/.test(v.phone)) e.phone = 'Escribe tu teléfono, solo números (7 a 15 dígitos).';
  if (!v.birth_date) e.birth_date = 'Indica tu fecha de nacimiento.';
  else if (new Date(v.birth_date) > new Date()) e.birth_date = 'La fecha no puede ser futura.';
  if (v.emergency_name.trim().length < 2) e.emergency_name = 'Escribe el nombre de tu contacto de emergencia.';
  if (v.emergency_relationship.trim().length < 2) e.emergency_relationship = 'Indica el parentesco (ej. mamá, pareja, amiga).';
  if (!/^[0-9]{7,15}$/.test(v.emergency_phone)) e.emergency_phone = 'Escribe su teléfono, solo números (7 a 15 dígitos).';
  if (!v.waiver) e.waiver = 'Debes aceptar la carta de responsabilidad.';
  return e;
}

function Campo({ id, label, error, children }) {
  return (
    <div className="campo">
      <label htmlFor={id}>{label}</label>
      {children}
      {error && <p id={`err-${id}`} className="campo-error">{error}</p>}
    </div>
  );
}

export default function ReservaModal({ evento, onCerrar, onListo }) {
  const dialogo = useRef(null);
  const [v, setV] = useState(INICIAL);
  const [lugares, setLugares] = useState(1);
  const [errores, setErrores] = useState({});
  const [estado, setEstado] = useState('idle'); // idle | enviando
  const [fallo, setFallo] = useState('');

  const maximo = Math.max(1, Math.min(10, evento.spots_left));
  const total = Number(evento.price_mxn) * lugares;

  useEffect(() => {
    const d = dialogo.current;
    if (d && !d.open) d.showModal();
  }, []);

  const cambiar = (e) => {
    const { name, value, type, checked } = e.target;
    setV((x) => ({ ...x, [name]: type === 'checkbox' ? checked : value }));
  };
  const cambiarTel = (e) => setV((x) => ({ ...x, [e.target.name]: soloDigitos(e.target.value) }));
  const cambiarLada = (e) => {
    const limpio = '+' + soloDigitos(e.target.value).slice(0, 3);
    setV((x) => ({ ...x, [e.target.name]: limpio }));
  };

  const enviar = async (ev) => {
    ev.preventDefault();
    setFallo('');
    if (v.website) { onCerrar(); return; } // campo trampa para bots

    const found = validar(v);
    setErrores(found);
    if (Object.keys(found).length > 0) {
      document.getElementById(Object.keys(found)[0])?.focus();
      return;
    }
    if (!supabase) {
      setFallo('Modo demostración: esta reserva no se guardó porque Supabase no está configurado.');
      return;
    }

    setEstado('enviando');
    const id = crypto.randomUUID();
    const { error } = await supabase.from('reservations').insert({
      id,
      event_id: evento.id,
      spots: lugares,
      full_name: v.full_name.trim(),
      email: v.email.trim().toLowerCase(),
      phone_country: v.phone_country,
      phone: v.phone,
      birth_date: v.birth_date,
      medical_notes: v.medical_notes.trim() || null,
      emergency_name: v.emergency_name.trim(),
      emergency_relationship: v.emergency_relationship.trim(),
      emergency_phone_country: v.emergency_phone_country,
      emergency_phone: v.emergency_phone,
      waiver_accepted: true,
    });

    if (error) {
      console.error(error);
      setEstado('idle');
      if (error.code === '23505') setFallo('Ya existe una reserva con este correo para este evento.');
      else if (/lugares suficientes/i.test(error.message)) setFallo(error.message);
      else setFallo('No se pudo guardar tu reserva. Revisa tu conexión e inténtalo de nuevo.');
      return;
    }
    onListo({ id, spots: lugares, total, full_name: v.full_name.trim(), email: v.email.trim().toLowerCase() });
  };

  const ariaError = (k) => ({ 'aria-invalid': !!errores[k], 'aria-describedby': errores[k] ? `err-${k}` : undefined });

  return (
    <dialog ref={dialogo} className="modal" aria-labelledby="modal-titulo" onClose={onCerrar} onCancel={onCerrar}>
      <form className="modal-panel" onSubmit={enviar} noValidate>
        <div className="modal-head">
          <div>
            <h2 id="modal-titulo">Apartar evento</h2>
            <p>Llena tus datos para reservar tu lugar.</p>
          </div>
          <button type="button" className="modal-cerrar" onClick={onCerrar} aria-label="Cerrar">×</button>
        </div>

        <div className="modal-body">
          <p className="modal-evento">
            <strong>{evento.title}</strong><br />
            {fechaLarga(evento.starts_at)}, {hora(evento.starts_at)} h
          </p>

          <div className="lugares">
            <p>¿Cuántos lugares?<br />Máximo {maximo} por reserva.</p>
            <div className="stepper">
              <button type="button" onClick={() => setLugares((n) => Math.max(1, n - 1))} disabled={lugares <= 1} aria-label="Quitar un lugar">−</button>
              <output aria-live="polite">{lugares}</output>
              <button type="button" onClick={() => setLugares((n) => Math.min(maximo, n + 1))} disabled={lugares >= maximo} aria-label="Agregar un lugar">+</button>
            </div>
          </div>

          <fieldset>
            <legend>Datos personales</legend>
            <Campo id="full_name" label="Nombre completo" error={errores.full_name}>
              <input id="full_name" name="full_name" value={v.full_name} onChange={cambiar} autoComplete="name" {...ariaError('full_name')} />
            </Campo>
            <Campo id="email" label="Correo electrónico" error={errores.email}>
              <input id="email" name="email" type="email" value={v.email} onChange={cambiar} autoComplete="email" {...ariaError('email')} />
            </Campo>
            <Campo id="phone" label="Teléfono / WhatsApp" error={errores.phone || errores.phone_country}>
              <div className="telefono">
                <input id="phone_country" name="phone_country" value={v.phone_country} onChange={cambiarLada} inputMode="tel" aria-label="Lada" />
                <input id="phone" name="phone" type="tel" inputMode="numeric" value={v.phone} onChange={cambiarTel} autoComplete="tel-national" {...ariaError('phone')} />
              </div>
            </Campo>
            <Campo id="birth_date" label="Fecha de nacimiento" error={errores.birth_date}>
              <input id="birth_date" name="birth_date" type="date" value={v.birth_date} onChange={cambiar} autoComplete="bday" {...ariaError('birth_date')} />
            </Campo>
            <Campo id="medical_notes" label="Alergias o condiciones médicas (opcional)">
              <textarea id="medical_notes" name="medical_notes" rows="3" maxLength={1000} value={v.medical_notes} onChange={cambiar} />
            </Campo>
          </fieldset>

          <fieldset>
            <legend>Contacto de emergencia</legend>
            <Campo id="emergency_name" label="Nombre" error={errores.emergency_name}>
              <input id="emergency_name" name="emergency_name" value={v.emergency_name} onChange={cambiar} {...ariaError('emergency_name')} />
            </Campo>
            <Campo id="emergency_relationship" label="Parentesco" error={errores.emergency_relationship}>
              <input id="emergency_relationship" name="emergency_relationship" value={v.emergency_relationship} onChange={cambiar} {...ariaError('emergency_relationship')} />
            </Campo>
            <Campo id="emergency_phone" label="Teléfono" error={errores.emergency_phone}>
              <div className="telefono">
                <input name="emergency_phone_country" value={v.emergency_phone_country} onChange={cambiarLada} inputMode="tel" aria-label="Lada del contacto" />
                <input id="emergency_phone" name="emergency_phone" type="tel" inputMode="numeric" value={v.emergency_phone} onChange={cambiarTel} {...ariaError('emergency_phone')} />
              </div>
            </Campo>
          </fieldset>

          <div className="carta">
            <h3>Carta de responsabilidad</h3>
            <p className="carta-aviso">
              Entiendo que el senderismo implica riesgos, que participo voluntariamente y bajo mi propia responsabilidad,
              y que debo seguir las indicaciones de las guías durante toda la actividad.
            </p>
            <label className="carta-check" htmlFor="waiver">
              <input id="waiver" name="waiver" type="checkbox" checked={v.waiver} onChange={cambiar} {...ariaError('waiver')} />
              <span>He leído y acepto la carta de responsabilidad.</span>
            </label>
            {errores.waiver && <p id="err-waiver" className="campo-error">{errores.waiver}</p>}
          </div>

          {/* Campo trampa anti-bots */}
          <div className="trampa" aria-hidden="true">
            <label htmlFor="website">No llenes este campo</label>
            <input id="website" name="website" tabIndex={-1} autoComplete="off" value={v.website} onChange={cambiar} />
          </div>

          {fallo && <p className="campo-error" role="alert">{fallo}</p>}
          <button className="reg-btn" type="submit" disabled={estado === 'enviando'}>
            {estado === 'enviando' ? 'Reservando…' : 'Reservar lugar'}
          </button>
        </div>

        <div className="modal-foot">
          <span>{lugares} {lugares === 1 ? 'lugar' : 'lugares'}</span>
          <strong>{total > 0 ? precioTexto(total) : 'Gratis'}</strong>
        </div>
      </form>
    </dialog>
  );
}
