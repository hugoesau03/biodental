const { pool } = require('../config/database');
const { asyncHandler } = require('../middleware');
const google = require('../config/googleCalendar');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

/**
 * Obtener credenciales OAuth de la aplicación (Client ID/Secret)
 * GET /api/google-calendar/config
 * Solo admin. El Client Secret nunca se devuelve completo, solo un preview.
 * Estas credenciales son GLOBALES a toda la instalación (no por consultorio).
 */
const getConfig = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    'SELECT google_client_id, google_client_secret, google_redirect_uri FROM configuracion_sistema LIMIT 1'
  );
  const guardado = rows[0] || {};
  const secret = guardado.google_client_secret || '';
  const clientId = guardado.google_client_id || process.env.GOOGLE_CLIENT_ID || '';
  const redirectUri = guardado.google_redirect_uri || process.env.GOOGLE_REDIRECT_URI || '';
  const secretEfectivo = secret || process.env.GOOGLE_CLIENT_SECRET || '';

  res.json({
    success: true,
    data: {
      configurado: Boolean(clientId && secretEfectivo && redirectUri),
      usando_env: !guardado.google_client_id && !secret && !guardado.google_redirect_uri && Boolean(process.env.GOOGLE_CLIENT_ID),
      client_id: guardado.google_client_id || '',
      client_secret_preview: secret ? `••••${secret.slice(-4)}` : null,
      redirect_uri: guardado.google_redirect_uri || '',
      redirect_uri_sugerido: process.env.GOOGLE_REDIRECT_URI || null
    }
  });
});

/**
 * Actualizar credenciales OAuth de la aplicación
 * PUT /api/google-calendar/config
 * Solo admin. El Client Secret solo se sobreescribe si se envía `client_secret`
 * con contenido; así se puede editar el Client ID sin repegar el secreto.
 * Para borrarlo explícitamente se envía `clear_secret: true`.
 */
const updateConfig = asyncHandler(async (req, res) => {
  const { client_id, client_secret, clear_secret, redirect_uri } = req.body;

  if (typeof redirect_uri === 'string' && redirect_uri.trim()) {
    try {
      const url = new URL(redirect_uri.trim());
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error('protocolo inválido');
    } catch {
      return res.status(400).json({
        success: false,
        message: 'El Redirect URI no es una URL válida (debe empezar con http:// o https://)'
      });
    }
  }

  const [rows] = await pool.query(
    'SELECT id, google_client_id, google_client_secret, google_redirect_uri FROM configuracion_sistema LIMIT 1'
  );
  const existente = rows[0];

  let secretFinal = existente?.google_client_secret || '';
  if (clear_secret) {
    secretFinal = '';
  } else if (typeof client_secret === 'string' && client_secret.trim()) {
    secretFinal = client_secret.trim();
  }

  const clientIdFinal = client_id !== undefined ? client_id : (existente?.google_client_id || '');
  const redirectUriFinal = redirect_uri !== undefined ? redirect_uri.trim() : (existente?.google_redirect_uri || '');

  if (existente) {
    await pool.query(
      'UPDATE configuracion_sistema SET google_client_id = ?, google_client_secret = ?, google_redirect_uri = ? WHERE id = ?',
      [clientIdFinal || null, secretFinal || null, redirectUriFinal || null, existente.id]
    );
  } else {
    await pool.query(
      'INSERT INTO configuracion_sistema (google_client_id, google_client_secret, google_redirect_uri) VALUES (?, ?, ?)',
      [clientIdFinal || null, secretFinal || null, redirectUriFinal || null]
    );
  }

  res.json({ success: true, message: 'Credenciales de Google Calendar actualizadas' });
});

/**
 * Convierte un evento de Google Calendar a los campos de un bloqueo_horario.
 * Los eventos de todo el día usan `date` (exclusivo en el fin); los de
 * horario usan `dateTime`.
 */
const mapearEventoABloqueo = (evento) => {
  if (evento.start?.date) {
    const finExclusivo = new Date(`${evento.end.date}T00:00:00`);
    finExclusivo.setDate(finExclusivo.getDate() - 1);
    const y = finExclusivo.getFullYear();
    const m = String(finExclusivo.getMonth() + 1).padStart(2, '0');
    const d = String(finExclusivo.getDate()).padStart(2, '0');
    return {
      fechaInicio: `${evento.start.date} 00:00:00`,
      fechaFin: `${y}-${m}-${d} 23:59:59`,
      todoElDia: true
    };
  }

  const inicio = new Date(evento.start.dateTime);
  const fin = new Date(evento.end.dateTime);
  const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ` +
    `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;

  return { fechaInicio: fmt(inicio), fechaFin: fmt(fin), todoElDia: false };
};

/**
 * Sincroniza los eventos de Google Calendar del doctor hacia bloqueos_horario
 * (Google -> App). Los eventos creados por Dr. Desk (marcados con
 * extendedProperties.private.drdesk_cita_uuid) se ignoran: la propia cita ya
 * bloquea el horario en el sistema, no hace falta un bloqueo duplicado.
 *
 * Devuelve { ok, mensaje } y nunca lanza — el llamador decide si reportar
 * el error o solo loguearlo (uso best-effort en varios puntos de la app).
 */
const sincronizarDesdeGoogle = async (doctorId) => {
  try {
    const tokenInfo = await google.obtenerAccessTokenValido(doctorId);
    if (!tokenInfo) return { ok: false, mensaje: 'No conectado' };

    const [rows] = await pool.query(
      'SELECT sync_token FROM google_calendar_tokens WHERE usuario_id = ?',
      [doctorId]
    );
    let syncTokenGuardado = rows[0]?.sync_token || null;

    let resultado = await google.listarEventosParaSync(tokenInfo.accessToken, tokenInfo.calendarId, syncTokenGuardado);

    if (resultado.syncTokenInvalido) {
      // El syncToken venció (pasó demasiado tiempo o se revocó): reintentar con sync completo
      syncTokenGuardado = null;
      resultado = await google.listarEventosParaSync(tokenInfo.accessToken, tokenInfo.calendarId, null);
    }

    for (const evento of resultado.eventos) {
      const esNuestro = Boolean(evento.extendedProperties?.private?.drdesk_cita_uuid);
      if (esNuestro) continue;

      if (evento.status === 'cancelled') {
        await pool.query(
          'DELETE FROM bloqueos_horario WHERE doctor_id = ? AND google_event_id = ?',
          [doctorId, evento.id]
        );
        continue;
      }

      if (!evento.start) continue; // eventos sin horario definido (raros), se ignoran

      const { fechaInicio, fechaFin, todoElDia } = mapearEventoABloqueo(evento);
      const motivo = evento.summary || 'Bloqueado desde Google Calendar';

      const [existente] = await pool.query(
        'SELECT id FROM bloqueos_horario WHERE doctor_id = ? AND google_event_id = ?',
        [doctorId, evento.id]
      );

      if (existente.length > 0) {
        await pool.query(
          'UPDATE bloqueos_horario SET fecha_inicio = ?, fecha_fin = ?, motivo = ?, todo_el_dia = ? WHERE id = ?',
          [fechaInicio, fechaFin, motivo, todoElDia, existente[0].id]
        );
      } else {
        await pool.query(
          `INSERT INTO bloqueos_horario (doctor_id, google_event_id, fecha_inicio, fecha_fin, motivo, origen, todo_el_dia)
           VALUES (?, ?, ?, ?, ?, 'google', ?)`,
          [doctorId, evento.id, fechaInicio, fechaFin, motivo, todoElDia]
        );
      }
    }

    if (resultado.nuevoSyncToken) {
      await pool.query(
        'UPDATE google_calendar_tokens SET sync_token = ?, last_synced_at = NOW() WHERE usuario_id = ?',
        [resultado.nuevoSyncToken, doctorId]
      );
    } else {
      await pool.query(
        'UPDATE google_calendar_tokens SET last_synced_at = NOW() WHERE usuario_id = ?',
        [doctorId]
      );
    }

    return { ok: true, mensaje: `${resultado.eventos.length} eventos procesados` };
  } catch (err) {
    if (err.code === 'invalid_grant') {
      // El doctor revocó el acceso desde su cuenta de Google: limpiar la conexión
      await pool.query('DELETE FROM google_calendar_tokens WHERE usuario_id = ?', [doctorId]).catch(() => {});
      return { ok: false, mensaje: 'La conexión con Google fue revocada, vuelve a conectar tu calendario' };
    }
    console.error(`Error sincronizando Google Calendar (doctor ${doctorId}):`, err.message);
    return { ok: false, mensaje: err.message };
  }
};

/**
 * Sincroniza a todos los doctores con calendario conectado.
 * Usado por el job periódico en background (server.js).
 */
const sincronizarTodosLosDoctores = async () => {
  const [doctores] = await pool.query('SELECT usuario_id FROM google_calendar_tokens');
  for (const { usuario_id } of doctores) {
    await sincronizarDesdeGoogle(usuario_id);
  }
};

/**
 * Sincroniza UNA cita hacia el Google Calendar de su doctor (App -> Google).
 * Crea, actualiza o elimina el evento según el estado de la cita. No lanza
 * errores — es de uso "best-effort" desde citasController, después de que
 * la operación principal sobre la cita ya se confirmó.
 */
const sincronizarCitaHaciaGoogle = async (citaId) => {
  try {
    const [citas] = await pool.query(
      `SELECT c.id, c.uuid, c.doctor_id, c.fecha, c.hora_inicio, c.hora_fin, c.estado,
              c.motivo, c.tipo, c.google_event_id,
              p.nombre as paciente_nombre, p.apellidos as paciente_apellidos
       FROM citas c
       JOIN pacientes p ON c.paciente_id = p.id
       WHERE c.id = ?`,
      [citaId]
    );
    if (citas.length === 0) return;
    const cita = citas[0];

    const tokenInfo = await google.obtenerAccessTokenValido(cita.doctor_id);
    if (!tokenInfo) return; // el doctor no tiene calendario conectado

    const cancelada = cita.estado === 'cancelada' || cita.estado === 'no_asistio' ||
      String(cita.hora_fin) === String(cita.hora_inicio); // slot liberado

    if (cancelada) {
      if (cita.google_event_id) {
        await google.eliminarEvento(tokenInfo.accessToken, tokenInfo.calendarId, cita.google_event_id);
        await pool.query('UPDATE citas SET google_event_id = NULL WHERE id = ?', [cita.id]);
      }
      return;
    }

    const fechaStr = cita.fecha instanceof Date
      ? cita.fecha.toISOString().split('T')[0]
      : String(cita.fecha).substring(0, 10);
    const horaInicio = String(cita.hora_inicio).substring(0, 5);
    const horaFin = String(cita.hora_fin).substring(0, 5);
    const pacienteNombre = `${cita.paciente_nombre} ${cita.paciente_apellidos || ''}`.trim();

    const evento = {
      summary: `Cita: ${pacienteNombre}`,
      description: cita.motivo || `Consulta (${cita.tipo || 'seguimiento'})`,
      start: { dateTime: `${fechaStr}T${horaInicio}:00` },
      end: { dateTime: `${fechaStr}T${horaFin}:00` },
      extendedProperties: { private: { drdesk_cita_uuid: cita.uuid } }
    };

    if (cita.google_event_id) {
      await google.actualizarEvento(tokenInfo.accessToken, tokenInfo.calendarId, cita.google_event_id, evento);
    } else {
      const creado = await google.crearEvento(tokenInfo.accessToken, tokenInfo.calendarId, evento);
      await pool.query('UPDATE citas SET google_event_id = ? WHERE id = ?', [creado.id, cita.id]);
    }
  } catch (err) {
    console.error(`Error sincronizando cita ${citaId} hacia Google Calendar:`, err.message);
  }
};

/**
 * Obtener URL de autorización de Google
 * GET /api/google-calendar/auth-url
 */
const getAuthUrl = asyncHandler(async (req, res) => {
  if (!(await google.estaConfigurado())) {
    return res.status(503).json({
      success: false,
      message: 'La integración con Google Calendar no está configurada. Pide a un administrador que la configure en Perfil > Administración.'
    });
  }

  res.json({
    success: true,
    data: { url: await google.construirUrlAutorizacion(req.user.id) }
  });
});

/**
 * Callback de Google OAuth (público, Google redirige aquí sin nuestro JWT)
 * GET /api/google-calendar/callback
 */
const handleCallback = asyncHandler(async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    return res.redirect(`${FRONTEND_URL}/perfil?google_calendar=error&reason=${encodeURIComponent(error)}`);
  }

  const verificacion = google.verificarState(state);
  if (!verificacion || !code) {
    return res.redirect(`${FRONTEND_URL}/perfil?google_calendar=error&reason=state_invalido`);
  }

  try {
    const tokens = await google.intercambiarCodigoPorTokens(code);
    const expiracion = new Date(Date.now() + tokens.expires_in * 1000);

    if (!tokens.refresh_token) {
      // Pasa si el usuario ya había autorizado antes sin "prompt=consent" en algún momento.
      // Con prompt=consent forzado en construirUrlAutorizacion esto no debería ocurrir,
      // pero si pasa no podemos mantener la sesión viva a largo plazo.
      return res.redirect(`${FRONTEND_URL}/perfil?google_calendar=error&reason=sin_refresh_token`);
    }

    await pool.query(
      `INSERT INTO google_calendar_tokens (usuario_id, access_token, refresh_token, token_expiry)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE access_token = VALUES(access_token), refresh_token = VALUES(refresh_token),
         token_expiry = VALUES(token_expiry), sync_token = NULL, last_synced_at = NULL`,
      [verificacion.usuarioId, tokens.access_token, tokens.refresh_token, expiracion]
    );

    res.redirect(`${FRONTEND_URL}/perfil?google_calendar=connected`);
  } catch (err) {
    console.error('Error en callback de Google Calendar:', err.message);
    res.redirect(`${FRONTEND_URL}/perfil?google_calendar=error&reason=${encodeURIComponent(err.message)}`);
  }
});

/**
 * Estado de la conexión del usuario actual
 * GET /api/google-calendar/status
 */
const getStatus = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    'SELECT calendar_id, last_synced_at, fecha_conexion FROM google_calendar_tokens WHERE usuario_id = ?',
    [req.user.id]
  );

  res.json({
    success: true,
    data: {
      configurado: await google.estaConfigurado(),
      conectado: rows.length > 0,
      calendar_id: rows[0]?.calendar_id || null,
      last_synced_at: rows[0]?.last_synced_at || null,
      fecha_conexion: rows[0]?.fecha_conexion || null
    }
  });
});

/**
 * Desconectar Google Calendar
 * DELETE /api/google-calendar
 */
const disconnect = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    'SELECT access_token, refresh_token FROM google_calendar_tokens WHERE usuario_id = ?',
    [req.user.id]
  );

  if (rows.length === 0) {
    return res.status(404).json({ success: false, message: 'No tienes un calendario conectado' });
  }

  await google.revocarToken(rows[0].refresh_token);
  await pool.query('DELETE FROM google_calendar_tokens WHERE usuario_id = ?', [req.user.id]);

  // Las citas dejan de tener un evento vinculado en Google; se limpia la referencia
  await pool.query('UPDATE citas SET google_event_id = NULL WHERE doctor_id = ?', [req.user.id]);
  await pool.query("DELETE FROM bloqueos_horario WHERE doctor_id = ? AND origen = 'google'", [req.user.id]);

  res.json({ success: true, message: 'Google Calendar desconectado' });
});

/**
 * Forzar sincronización ahora (Google -> App)
 * POST /api/google-calendar/sync
 */
const syncNow = asyncHandler(async (req, res) => {
  const resultado = await sincronizarDesdeGoogle(req.user.id);
  res.status(resultado.ok ? 200 : 502).json({
    success: resultado.ok,
    message: resultado.mensaje
  });
});

module.exports = {
  getConfig,
  updateConfig,
  getAuthUrl,
  handleCallback,
  getStatus,
  disconnect,
  syncNow,
  sincronizarDesdeGoogle,
  sincronizarTodosLosDoctores,
  sincronizarCitaHaciaGoogle,
  mapearEventoABloqueo
};
