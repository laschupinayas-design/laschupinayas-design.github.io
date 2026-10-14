import { useEffect, useRef, useState } from 'react';
import { grupo } from '../config';
import { crearReserva } from '../lib/eventos';
import { fechaLarga, hora, precioTexto } from '../lib/formato';
import ImagenEvento from './ImagenEvento';
import './ReservaModal.css';

const PAISES = [
  ['+52', 'MX +52'],
  ['+1', 'US +1'],
  ['+34', 'ES +34'],
  ['+57', 'CO +57'],
  ['+54', 'AR +54'],
  ['+56', 'CL +56'],
  ['+51', 'PE +51'],
];

const VACIO = {
  lugares: 1,
  nombre: '',
  email: '',
  paisTel: '+52',
  tel: '',
  nacimiento: '',
  salud: '',
  emNombre: '',
  emRelacion: '',
  emPais: '+52',
  emTel: '',
  carta: false,
  website: '', // campo trampa para bots
};

const soloDigitos = (t) => t.replace(/\D/g, '');
const telValido = (pais, t) => {
  const n = soloDigitos(t).length;
  return pais === '+52' ? n === 10 : n >= 7 && n <= 15;
};
const msgTel = (pais) =>
  pais === '+52' ? 'Escribe los 10 dígitos del celular.' : 'Escribe un número válido (de 7 a 15 dígitos).';

function validar(v) {
  const e = {};
  if (v.nombre.trim().length < 2) e.nombre = 'Escribe tu nombre completo.';
  if (!/^\S+@\S+\.\S+$/.test(v.email.trim())) e.email = 'Escribe un correo válido, por ejemplo nombre@correo.com.';
  if (!telValido(v.paisTel, v.tel)) e.tel = msgTel(v.paisTel);
  if (!v.nacimiento) {
    e.nacimiento = 'Indica tu fecha de nacimiento.';
  } else {
    const d = new Date(`${v.nacimiento}T00:00:00`);
    if (Number.isNaN(d.getTime()) || d > new Date() || d.getFullYear() < 1900) {
      e.nacimiento = 'Revisa tu fecha de nacimiento.';
    }
  }
  if (v.emNombre.trim().length < 2) e.emNombre = 'Escribe el nombre de tu contacto de emergencia.';
  if (v.emRelacion.trim().length < 2) e.emRelacion = 'Indica qué relación tienes con esa persona.';
  if (!telValido(v.emPais, v.emTel)) e.emTel = msgTel(v.emPais);
  if (!v.carta) e.carta = 'Debes aceptar la carta de responsabilidad para reservar.';
  return e;
}

function Campo({ id, label, error, children }) {
  return (
    <div className="campo">
      <label htmlFor={id}>{label}</label>
      {children}
      {error && <p id={`${id}-error`} className="campo-error">{error}</p>}
    </div>
  );
}

function Telefono({ id, label, pais, tel, error, nombrePais, nombreTel, onChange }) {
  return (
    <Campo id={id} label={label} error={error}>
      <div className="telefono">
        <select aria-label="Código de país" name={nombrePais} value={pais} onChange={onChange}>
          {PAISES.map(([cod, texto]) => (
            <option key={cod} value={cod}>{texto}</option>
          ))}
        </select>
        <input
          id={id}
          name={nombreTel}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="Ej. 10 dígitos"
          value={tel}
          onChange={onChange}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
        />
      </div>
    </Campo>
  );
}

export default function ReservaModal({ evento, onCerrar, onListo }) {
  const ref = useRef(null);
  const [v, setV] = useState(VACIO);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState('');

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const maxLugares = Math.max(1, Math.min(10, evento.spots_left));
  const total = evento.price_mxn * v.lugares;
  const hoyISO = new Date().toLocaleDateString('en-CA');

  const cambiar = (e) => {
    const { name, value, type, checked } = e.target;
    setV((a) => ({ ...a, [name]: type === 'checkbox' ? checked : value }));
  };
  const cambiarLugares = (delta) =>
    setV((a) => ({ ...a, lugares: Math.min(maxLugares, Math.max(1, a.lugares + delta)) }));

  const cerrar = () => ref.current?.close();
  const clickFuera = (e) => {
    if (e.target === ref.current) cerrar();
  };

  const enviar = async (ev) => {
    ev.preventDefault();
    if (v.website) return; // un bot llenó el campo trampa

    const errs = validar(v);
    setErrores(errs);
    if (Object.keys(errs).length > 0) {
      requestAnimationFrame(() => ref.current?.querySelector('[aria-invalid="true"]')?.focus());
      return;
    }

    setEnviando(true);
    setErrorEnvio('');
    const id = crypto.randomUUID();
    try {
      const res = await crearReserva({
        id,
        event_id: evento.id,
        spots: v.lugares,
        full_name: v.nombre.trim(),
        email: v.email.trim().toLowerCase(),
        phone_country: v.paisTel,
        phone: soloDigitos(v.tel),
        birth_date: v.nacimiento,
        medical_notes: v.salud.trim() || null,
        emergency_name: v.emNombre.trim(),
        emergency_relationship: v.emRelacion.trim(),
        emergency_phone_country: v.emPais,
        emergency_phone: soloDigitos(v.emTel),
        waiver_accepted: true,
      });
      onListo({
        id,
        lugares: v.lugares,
        total,
        nombre: v.nombre.trim(),
        email: v.email.trim().toLowerCase(),
        demo: res.demo,
      });
    } catch (err) {
      setErrorEnvio(err.message);
      setEnviando(false);
    }
  };

  const campoProps = (nombre) => ({
    name: nombre,
    value: v[nombre],
    onChange: cambiar,
    'aria-invalid': !!errores[nombre],
    'aria-describedby': errores[nombre] ? `${nombre}-error` : undefined,
  });

  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby="modal-titulo"
      onClose={onCerrar}
      onClick={clickFuera}
    >
      <ImagenEvento src={evento.image_url} className="modal-img" />

      <div className="modal-panel">
        <header className="modal-head">
          <div>
            <h2 id="modal-titulo">Apartar evento</h2>
            <p>Completa tus datos para conseguir tu boleto.</p>
          </div>
          <button type="button" className="modal-cerrar" aria-label="Cerrar" onClick={cerrar}>
            ×
          </button>
        </header>

        <form className="modal-body" onSubmit={enviar} noValidate>
          <p className="modal-evento">
            <strong>{evento.title}</strong>
            <br />
            {fechaLarga(evento.starts_at)}, {hora(evento.starts_at)} h
          </p>

          <div className="lugares">
            <div>
              <strong>Lugares</strong>
              <p>¿Cuántos vas a apartar?</p>
            </div>
            <div className="stepper">
              <button type="button" aria-label="Quitar un lugar" onClick={() => cambiarLugares(-1)} disabled={v.lugares <= 1}>
                −
              </button>
              <output aria-live="polite">{v.lugares}</output>
              <button type="button" aria-label="Agregar un lugar" onClick={() => cambiarLugares(1)} disabled={v.lugares >= maxLugares}>
                +
              </button>
            </div>
          </div>

          <fieldset>
            <legend>Datos personales</legend>
            <Campo id="nombre" label="Nombre completo" error={errores.nombre}>
              <input id="nombre" autoComplete="name" placeholder="Ej. Ana Torres" {...campoProps('nombre')} />
            </Campo>
            <Campo id="email" label="Correo electrónico" error={errores.email}>
              <input id="email" type="email" autoComplete="email" placeholder="ejemplo@correo.com" {...campoProps('email')} />
            </Campo>
            <Telefono
              id="tel"
              label="Número de celular"
              pais={v.paisTel}
              tel={v.tel}
              error={errores.tel}
              nombrePais="paisTel"
              nombreTel="tel"
              onChange={cambiar}
            />
            <Campo id="nacimiento" label="Fecha de nacimiento" error={errores.nacimiento}>
              <input id="nacimiento" type="date" min="1900-01-01" max={hoyISO} autoComplete="bday" {...campoProps('nacimiento')} />
            </Campo>
            <Campo id="salud" label="¿Existe alguna condición médica, alergia o situación que debamos conocer para tu seguridad? (opcional)">
              <textarea id="salud" name="salud" rows="3" maxLength={1000} placeholder="Especificar" value={v.salud} onChange={cambiar} />
            </Campo>
          </fieldset>

          <fieldset>
            <legend>Contacto de emergencia</legend>
            <Campo id="emNombre" label="Nombre completo" error={errores.emNombre}>
              <input id="emNombre" placeholder="Ej. Carlos López" {...campoProps('emNombre')} />
            </Campo>
            <Campo id="emRelacion" label="Relación con el contacto de emergencia" error={errores.emRelacion}>
              <input id="emRelacion" placeholder="Ej. Hermano, pareja, amiga" {...campoProps('emRelacion')} />
            </Campo>
            <Telefono
              id="emTel"
              label="Celular del contacto"
              pais={v.emPais}
              tel={v.emTel}
              error={errores.emTel}
              nombrePais="emPais"
              nombreTel="emTel"
              onChange={cambiar}
            />
          </fieldset>

          <div className="trampa" aria-hidden="true">
            <label htmlFor="website">No llenes este campo</label>
            <input id="website" name="website" tabIndex={-1} autoComplete="off" value={v.website} onChange={cambiar} />
          </div>

          <div className="carta">
            <h3>Carta de responsabilidad compartida</h3>
            {grupo.cartaUrl ? (
              <a href={grupo.cartaUrl} target="_blank" rel="noreferrer">Ver carta</a>
            ) : (
              import.meta.env.DEV && <p className="carta-aviso">Agrega tu carta en src/config.js (cartaUrl).</p>
            )}
            <label className="carta-check">
              <input
                type="checkbox"
                name="carta"
                checked={v.carta}
                onChange={cambiar}
                aria-invalid={!!errores.carta}
              />
              <span>He leído y acepto la carta de responsabilidad compartida.</span>
            </label>
            {errores.carta && <p className="campo-error">{errores.carta}</p>}
          </div>

          {errorEnvio && <p className="campo-error" role="alert">{errorEnvio}</p>}

          <button type="submit" className="reg-btn" disabled={!v.carta || enviando}>
            {enviando ? 'Enviando…' : 'Reservar lugar'}
          </button>
        </form>

        <footer className="modal-foot">
          <span>Total</span>
          <strong>{precioTexto(total)}</strong>
        </footer>
      </div>
    </dialog>
  );
}
