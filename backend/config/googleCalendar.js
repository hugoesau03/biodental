const crypto = require('crypto');
const { pool } = require('./database');

/**
 * Integración con Google Calendar (OAuth2 + Calendar API v3), vía fetch
 * directo — sin el SDK oficial `googleapis` para no sumar una dependencia
 * pesada, siguiendo el mismo patrón que la integración de YCloud.
 *
 * Cada doctor vincula su propia cuenta de Google (OAuth por usuario), pero
 * el Client ID/Secret/Redirect URI identifican a la APLICACIÓN ante Google
 * — son globales a toda la instalación, no por consultorio (un solo
 * proyecto de Google Cloud sirve a todos los doctores de todos los
 * consultorios). Se configuran desde Perfil > Administración (solo admin)
 * y se guardan en configuracion_sistema; si no hay nada guardado ahí, se
 * usa el respaldo en el .env del backend (GOOGLE_CLIENT_ID /
 * GOOGLE_CLIENT_SECRET / GOOGLE_REDIRECT_URI) — útil para no depender de
 * la base de datos en el primer arranque.
 */

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_REVOKE_URL = 'https://oauth2.googleapis.com/revoke';
const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';
const SCOPE = 'https://www.googleapis.com/auth/calendar.events';

/**
 * Credenciales OAuth de la aplicación: configuracion_sistema (BD) con
 * respaldo en variables de entorno. Siempre se leen frescas de la BD
 * (no se cachean) para que un cambio en Perfil > Administración surta
 * efecto de inmediato sin reiniciar el backend.
 */
const obtenerCredenciales = async () => {
  const [rows] = await pool.query(
    'SELECT google_client_id, google_client_secret, google_redirect_uri FROM configuracion_sistema LIMIT 1'
  );
  const guardado = rows[0] || {};

  return {
    clientId: guardado.google_client_id || process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: guardado.google_client_secret || process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: guardado.google_redirect_uri || process.env.GOOGLE_REDIRECT_URI || ''
  };
};

const estaConfigurado = async () => {
  const { clientId, clientSecret, redirectUri } = await obtenerCredenciales();
  return Boolean(clientId && clientSecret && redirectUri);
};

// ============================================
// Firma del parámetro `state` (anti-CSRF + identifica al usuario)
// ============================================
// El callback de Google es un GET sin nuestro JWT, así que el usuario que
// inició el flujo viaja firmado en `state` para no depender de sesión.

const firmarState = (usuarioId) => {
  const payload = JSON.stringify({ usuarioId, ts: Date.now() });
  const payloadB64 = Buffer.from(payload).toString('base64url');
  const firma = crypto.createHmac('sha256', process.env.JWT_SECRET)
    .update(payloadB64)
    .digest('base64url');
  return `${payloadB64}.${firma}`;
};

const verificarState = (state) => {
  const [payloadB64, firma] = String(state || '').split('.');
  if (!payloadB64 || !firma) return null;

  const firmaEsperada = crypto.createHmac('sha256', process.env.JWT_SECRET)
    .update(payloadB64)
    .digest('base64url');

  const bufFirma = Buffer.from(firma);
  const bufEsperada = Buffer.from(firmaEsperada);
  if (bufFirma.length !== bufEsperada.length || !crypto.timingSafeEqual(bufFirma, bufEsperada)) {
    return null;
  }

  try {
    const { usuarioId, ts } = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
    // El state expira a los 10 minutos (tiempo de sobra para completar el consentimiento)
    if (Date.now() - ts > 10 * 60 * 1000) return null;
    return { usuarioId };
  } catch {
    return null;
  }
};

// ============================================
// OAuth2
// ============================================

const construirUrlAutorizacion = async (usuarioId) => {
  const { clientId, redirectUri } = await obtenerCredenciales();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPE,
    access_type: 'offline',
    prompt: 'consent', // fuerza refresh_token también en reconexiones
    state: firmarState(usuarioId)
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
};

const intercambiarCodigoPorTokens = async (code) => {
  const { clientId, clientSecret, redirectUri } = await obtenerCredenciales();
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Error obteniendo tokens de Google: ${data.error_description || data.error || response.status}`);
  }
  return data; // { access_token, refresh_token, expires_in, ... }
};

const refrescarAccessToken = async (refreshToken) => {
  const { clientId, clientSecret } = await obtenerCredenciales();
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token'
    })
  });

  const data = await response.json();
  if (!response.ok) {
    const err = new Error(`Error refrescando token de Google: ${data.error_description || data.error || response.status}`);
    err.code = data.error; // 'invalid_grant' => el refresh_token fue revocado
    throw err;
  }
  return data; // { access_token, expires_in, ... } (puede no traer refresh_token nuevo)
};

const revocarToken = async (token) => {
  await fetch(`${GOOGLE_REVOKE_URL}?token=${encodeURIComponent(token)}`, { method: 'POST' }).catch(() => {});
};

/**
 * Devuelve un access_token vigente para el usuario, refrescándolo si hace
 * falta. Devuelve null si el usuario no tiene el calendario conectado.
 * Lanza error si el refresh_token fue revocado (invalid_grant) — en ese
 * caso el llamador debe desconectar la cuenta.
 */
const obtenerAccessTokenValido = async (usuarioId) => {
  const [rows] = await pool.query(
    'SELECT access_token, refresh_token, token_expiry, calendar_id FROM google_calendar_tokens WHERE usuario_id = ?',
    [usuarioId]
  );
  if (rows.length === 0) return null;

  const registro = rows[0];
  const expiraEn = new Date(registro.token_expiry).getTime();
  const margenMs = 2 * 60 * 1000; // refrescar 2 min antes de que expire

  if (Date.now() < expiraEn - margenMs) {
    return { accessToken: registro.access_token, calendarId: registro.calendar_id || 'primary' };
  }

  const nuevos = await refrescarAccessToken(registro.refresh_token);
  const nuevaExpiracion = new Date(Date.now() + nuevos.expires_in * 1000);

  await pool.query(
    'UPDATE google_calendar_tokens SET access_token = ?, token_expiry = ? WHERE usuario_id = ?',
    [nuevos.access_token, nuevaExpiracion, usuarioId]
  );

  return { accessToken: nuevos.access_token, calendarId: registro.calendar_id || 'primary' };
};

// ============================================
// Calendar API v3
// ============================================

const llamarCalendarAPI = async (accessToken, path, options = {}) => {
  const response = await fetch(`${CALENDAR_API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  if (response.status === 204) return null; // DELETE exitoso sin body

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const err = new Error(data?.error?.message || `Google Calendar API respondió ${response.status}`);
    err.statusCode = response.status;
    err.googleError = data?.error;
    throw err;
  }

  return data;
};

const crearEvento = (accessToken, calendarId, evento) =>
  llamarCalendarAPI(accessToken, `/calendars/${encodeURIComponent(calendarId)}/events`, {
    method: 'POST',
    body: JSON.stringify(evento)
  });

const actualizarEvento = (accessToken, calendarId, eventId, evento) =>
  llamarCalendarAPI(accessToken, `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`, {
    method: 'PATCH',
    body: JSON.stringify(evento)
  });

const eliminarEvento = async (accessToken, calendarId, eventId) => {
  try {
    await llamarCalendarAPI(accessToken, `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`, {
      method: 'DELETE'
    });
  } catch (err) {
    // 410/404: el evento ya no existe en Google, no es un error real para nosotros
    if (err.statusCode !== 410 && err.statusCode !== 404) throw err;
  }
};

/**
 * Lista eventos para sincronización incremental. Si no hay syncToken
 * guardado, hace una sincronización completa desde `timeMin` (ahora).
 * Devuelve { eventos, nuevoSyncToken, syncTokenInvalido }.
 */
const listarEventosParaSync = async (accessToken, calendarId, syncTokenGuardado) => {
  const eventos = [];
  let pageToken = null;
  let nuevoSyncToken = null;

  do {
    const params = new URLSearchParams({ maxResults: '250' });
    if (pageToken) params.set('pageToken', pageToken);

    if (syncTokenGuardado) {
      params.set('syncToken', syncTokenGuardado);
    } else {
      params.set('singleEvents', 'true');
      params.set('timeMin', new Date().toISOString());
    }

    let data;
    try {
      data = await llamarCalendarAPI(accessToken, `/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`);
    } catch (err) {
      if (err.statusCode === 410) {
        // syncToken vencido/inválido: el llamador debe reintentar con sync completo
        return { eventos: [], nuevoSyncToken: null, syncTokenInvalido: true };
      }
      throw err;
    }

    eventos.push(...(data.items || []));
    pageToken = data.nextPageToken || null;
    if (data.nextSyncToken) nuevoSyncToken = data.nextSyncToken;
  } while (pageToken);

  return { eventos, nuevoSyncToken, syncTokenInvalido: false };
};

module.exports = {
  estaConfigurado,
  obtenerCredenciales,
  firmarState,
  verificarState,
  construirUrlAutorizacion,
  intercambiarCodigoPorTokens,
  revocarToken,
  obtenerAccessTokenValido,
  crearEvento,
  actualizarEvento,
  eliminarEvento,
  listarEventosParaSync
};
