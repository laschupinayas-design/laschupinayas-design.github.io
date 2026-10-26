import { supabase } from '../supabase/supabaseClient';

// Datos públicos de Openpay (se pueden mostrar en la página; la llave privada NUNCA va aquí).
const MERCHANT = import.meta.env.VITE_OPENPAY_MERCHANT_ID;
const LLAVE_PUBLICA = import.meta.env.VITE_OPENPAY_PUBLIC_KEY;
const SANDBOX = import.meta.env.VITE_OPENPAY_SANDBOX !== 'false';

// Si falta algo, la opción de pagar con tarjeta simplemente no aparece.
export const pagoConTarjeta = Boolean(supabase && MERCHANT && LLAVE_PUBLICA);

function cargarScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('No se pudo cargar el sistema de pagos. Revisa tu conexión.'));
    document.head.appendChild(s);
  });
}

let promesa = null;
export function cargarOpenpay() {
  if (!promesa) {
    promesa = (async () => {
      await cargarScript('https://js.openpay.mx/openpay.v1.min.js');
      await cargarScript('https://js.openpay.mx/openpay-data.v1.min.js');
      const OP = window.OpenPay;
      OP.setId(MERCHANT);
      OP.setApiKey(LLAVE_PUBLICA);
      OP.setSandboxMode(SANDBOX);
      return OP;
    })().catch((e) => {
      promesa = null;
      throw e;
    });
  }
  return promesa;
}

// Mide el dispositivo para el antifraude de Openpay. Necesita el formulario y el campo oculto ya en pantalla.
export function sesionDispositivo(OP, formId, campoId) {
  return OP.deviceData.setup(formId, campoId) || document.getElementById(campoId)?.value || '';
}

function mensajeToken(err) {
  const d = err?.data || {};
  switch (d.error_code) {
    case 2004: return 'El número de tarjeta no es válido.';
    case 2005: return 'La fecha de vencimiento no es válida.';
    case 2006: return 'Falta el código de seguridad (CVV).';
    case 3001: case 3004: case 3005: case 3006: return 'Tu banco rechazó la tarjeta. Prueba con otra.';
    case 3002: return 'La tarjeta está vencida.';
    default: return 'Revisa los datos de tu tarjeta e inténtalo de nuevo.';
  }
}

// Convierte los datos de la tarjeta en un token seguro. Los datos de la tarjeta van directo a Openpay.
export function crearToken(OP, tarjeta) {
  return new Promise((resolve, reject) => {
    OP.token.create(
      tarjeta,
      (r) => resolve(r.data.id),
      (e) => reject(new Error(mensajeToken(e))),
    );
  });
}

async function llamar(cuerpo) {
  const { data, error } = await supabase.functions.invoke('openpay-pago', { body: cuerpo });
  if (error || !data) throw new Error('No se pudo conectar con el sistema de pagos. Inténtalo de nuevo.');
  return data;
}

// Cobra la reserva. Devuelve { estado: 'confirmada' | 'redirigir' | 'error', url?, mensaje? }
export const cobrarReserva = (reservaId, tokenId, deviceSessionId) =>
  llamar({ accion: 'cobrar', reserva_id: reservaId, token_id: tokenId, device_session_id: deviceSessionId });

// Datos de la reserva y estado del pago: { estado, reserva: { full_name, spots, total, evento } }
export const consultarReserva = (reservaId) => llamar({ accion: 'consultar', reserva_id: reservaId });
