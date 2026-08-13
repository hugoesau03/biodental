const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');
const { asyncHandler } = require('../middleware');
const { enviarEmailResetPassword } = require('../services/emailService');
const {
  createCita,
  validarDisponibilidadDoctor,
  eliminarBloqueosDeCita,
  formatFechaLocal,
  calcularHoraFin
} = require('./citasController');

/**
 * Portal de pacientes: autenticación, historial, reserva de citas, check-in,
 * estado de cuenta, recompensas y promociones — todo protegido por
 * authPaciente (JWT propio, distinto del de staff) y siempre acotado al
 * paciente autenticado (req.pacienteId) y a su consultorio (req.consultorioId).
 */

// ============================================
// AUTH
// ============================================

/**
 * Activar el acceso al portal de un paciente ya existente en el sistema
 * (dado de alta por la clínica). Se valida con teléfono + fecha de nacimiento
 * — datos que la clínica ya tiene registrados — y el paciente define su
 * contraseña. Solo funciona una vez (mientras password_hash sea NULL).
 * POST /api/portal/auth/registro
 */
const registro = asyncHandler(async (req, res) => {
  const { telefono, fecha_nacimiento, password, terminos_aceptados, privacidad_aceptada } = req.body;

  if (!telefono || !fecha_nacimiento || !password) {
    return res.status(400).json({
      success: false,
      message: 'Teléfono, fecha de nacimiento y contraseña son requeridos'
    });
  }

  if (String(password).length < 8) {
    return res.status(400).json({
      success: false,
      message: 'La contraseña debe tener al menos 8 caracteres'
    });
  }

  if (terminos_aceptados !== true) {
    return res.status(400).json({
      success: false,
      message: 'Debes aceptar los términos y condiciones para activar tu acceso'
    });
  }

  // Consentimiento expreso al Aviso de Privacidad, distinto de aceptar los
  // términos: el Portal trata datos de salud (sensibles conforme a la
  // LFPDPPP), que requieren consentimiento expreso y por escrito propio,
  // no solo la aceptación general de los términos de uso.
  if (privacidad_aceptada !== true) {
    return res.status(400).json({
      success: false,
      message: 'Debes leer el Aviso de Privacidad y dar tu consentimiento para el tratamiento de tus datos'
    });
  }

  const [pacientes] = await pool.query(
    `SELECT p.id, p.uuid, p.consultorio_id FROM pacientes p
     JOIN consultorios c ON p.consultorio_id = c.id
     WHERE p.telefono = ? AND p.fecha_nacimiento = ? AND p.password_hash IS NULL
     AND p.activo = TRUE AND c.activo = TRUE`,
    [telefono, fecha_nacimiento]
  );

  if (pacientes.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'No encontramos un paciente con esos datos, o el acceso ya fue activado. Contacta a la clínica.'
    });
  }

  if (pacientes.length > 1) {
    // Coincidencia ambigua (mismo teléfono y fecha de nacimiento en más de un registro) — no activar a ciegas
    return res.status(409).json({
      success: false,
      message: 'Encontramos más de un paciente con esos datos. Contacta a la clínica para activar tu acceso.'
    });
  }

  const paciente = pacientes[0];
  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  // terminos_aceptados_en / privacidad_aceptada_en dejan constancia de
  // cuándo se aceptó cada documento — evidencia de consentimiento si hace
  // falta acreditarlo.
  await pool.query(
    'UPDATE pacientes SET password_hash = ?, terminos_aceptados_en = NOW(), privacidad_aceptada_en = NOW() WHERE id = ?',
    [passwordHash, paciente.id]
  );

  const token = jwt.sign(
    { pacienteId: paciente.id, tipo: 'paciente' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
  );

  res.status(201).json({
    success: true,
    message: 'Acceso activado exitosamente',
    data: { token, paciente: { uuid: paciente.uuid } }
  });
});

/**
 * Iniciar sesión en el portal.
 * POST /api/portal/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const { telefono, password } = req.body;

  if (!telefono || !password) {
    return res.status(400).json({
      success: false,
      message: 'Teléfono y contraseña son requeridos'
    });
  }

  const [pacientes] = await pool.query(
    `SELECT p.id, p.uuid, p.nombre, p.apellidos, p.password_hash FROM pacientes p
     JOIN consultorios c ON p.consultorio_id = c.id
     WHERE p.telefono = ? AND p.password_hash IS NOT NULL AND p.activo = TRUE AND c.activo = TRUE`,
    [telefono]
  );

  // El teléfono no es único en la tabla (dos pacientes podrían compartirlo,
  // p.ej. familiares). Se desambigua probando la contraseña contra cada
  // coincidencia: solo la cuenta correcta hará match con bcrypt.compare.
  let paciente = null;
  for (const candidato of pacientes) {
    if (await bcrypt.compare(password, candidato.password_hash)) {
      paciente = candidato;
      break;
    }
  }

  if (!paciente) {
    return res.status(401).json({
      success: false,
      message: 'Credenciales inválidas'
    });
  }

  const token = jwt.sign(
    { pacienteId: paciente.id, tipo: 'paciente' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
  );

  res.json({
    success: true,
    message: 'Inicio de sesión exitoso',
    data: {
      token,
      paciente: {
        uuid: paciente.uuid,
        nombre: paciente.nombre,
        apellidos: paciente.apellidos
      }
    }
  });
});

// Tiempo de validez de un token de restablecimiento de contraseña del portal
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora
const MENSAJE_SOLICITUD_RESET_PORTAL = 'Si existe una cuenta activa con ese correo, te enviamos un enlace para restablecer tu contraseña.';

/**
 * Solicitar restablecimiento de contraseña del portal — paso 1 de "olvidé
 * mi contraseña". El login del portal usa teléfono, pero la recuperación
 * usa correo (canal verificable para enviar el enlace); un paciente sin
 * correo registrado no puede recuperar el acceso por este medio y debe
 * acudir a la clínica. Mismo mecanismo de token de un solo uso que el
 * staff (ver authController.solicitarResetPassword) — token hasheado con
 * SHA-256, válido 1 hora, mensaje siempre genérico para no revelar qué
 * correos están registrados.
 * POST /api/portal/auth/solicitar-reset-password
 */
const solicitarResetPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Se requiere un correo electrónico'
    });
  }

  const [pacientes] = await pool.query(
    `SELECT p.id, p.nombre, p.email FROM pacientes p
     JOIN consultorios c ON p.consultorio_id = c.id
     WHERE p.email = ? AND p.password_hash IS NOT NULL AND p.activo = TRUE AND c.activo = TRUE`,
    [email]
  );

  if (pacientes.length === 0) {
    // Mismo mensaje que en el caso de éxito — no revelar si la cuenta existe.
    return res.json({ success: true, message: MENSAJE_SOLICITUD_RESET_PORTAL });
  }

  const paciente = pacientes[0];

  await pool.query(
    'DELETE FROM portal_password_reset_tokens WHERE paciente_id = ? AND usado_en IS NULL',
    [paciente.id]
  );

  const tokenPlano = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(tokenPlano).digest('hex');
  const expiracion = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  await pool.query(
    'INSERT INTO portal_password_reset_tokens (paciente_id, token_hash, fecha_expiracion) VALUES (?, ?, ?)',
    [paciente.id, tokenHash, expiracion]
  );

  const baseUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
  const resetUrl = `${baseUrl}/portal/restablecer-password?token=${tokenPlano}`;

  try {
    await enviarEmailResetPassword({ to: paciente.email, nombre: paciente.nombre, resetUrl });
  } catch (error) {
    console.error('Error enviando correo de restablecimiento de contraseña (portal):', error.message);
  }

  res.json({ success: true, message: MENSAJE_SOLICITUD_RESET_PORTAL });
});

/**
 * Confirmar restablecimiento de contraseña del portal — paso 2. Mismas
 * reglas que el staff: token válido, no usado, no expirado.
 * POST /api/portal/auth/confirmar-reset-password
 */
const confirmarResetPassword = asyncHandler(async (req, res) => {
  const { token, new_password } = req.body;

  if (!token || !new_password) {
    return res.status(400).json({
      success: false,
      message: 'Se requiere el token del enlace y la nueva contraseña'
    });
  }

  if (String(new_password).length < 8) {
    return res.status(400).json({
      success: false,
      message: 'La nueva contraseña debe tener al menos 8 caracteres'
    });
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const [tokens] = await pool.query(
    'SELECT id, paciente_id, fecha_expiracion, usado_en FROM portal_password_reset_tokens WHERE token_hash = ?',
    [tokenHash]
  );

  if (tokens.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'El enlace no es válido. Solicita uno nuevo.'
    });
  }

  const resetToken = tokens[0];

  if (resetToken.usado_en) {
    return res.status(400).json({
      success: false,
      message: 'Este enlace ya fue utilizado. Solicita uno nuevo.'
    });
  }

  if (new Date(resetToken.fecha_expiracion) < new Date()) {
    return res.status(400).json({
      success: false,
      message: 'El enlace expiró. Solicita uno nuevo.'
    });
  }

  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(new_password, salt);

  // tokens_invalidos_antes = NOW(): cierra cualquier otra sesión del portal
  // abierta con la contraseña anterior (mismo motivo que en el staff — un
  // reset suele significar que alguien perdió acceso, o alguien más lo tuvo).
  await pool.query(
    'UPDATE pacientes SET password_hash = ?, tokens_invalidos_antes = NOW() WHERE id = ?',
    [passwordHash, resetToken.paciente_id]
  );
  await pool.query('UPDATE portal_password_reset_tokens SET usado_en = NOW() WHERE id = ?', [resetToken.id]);

  res.json({
    success: true,
    message: 'Contraseña restablecida correctamente. Ya puedes iniciar sesión.'
  });
});

/**
 * Perfil del paciente autenticado.
 * GET /api/portal/me
 */
const getMe = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT p.uuid, p.numero_expediente, p.nombre, p.apellidos, p.email, p.telefono,
            p.fecha_nacimiento, p.puntos,
            c.nombre as consultorio_nombre
     FROM pacientes p
     JOIN consultorios c ON p.consultorio_id = c.id
     WHERE p.id = ?`,
    [req.pacienteId]
  );

  res.json({ success: true, data: { paciente: rows[0] } });
});

/**
 * Formularios clínicos que el paciente ya llenó (o le llenaron en
 * consultorio). Misma info que ve el staff en el perfil del paciente,
 * pero acotada a la sesión del propio paciente.
 * GET /api/portal/formularios-completados
 */
const getFormulariosCompletadosPortal = asyncHandler(async (req, res) => {
  const [completados] = await pool.query(
    `SELECT fc.id, fc.datos, fc.firma_url, fc.fecha_completado,
            f.uuid as formulario_uuid, f.nombre as formulario_nombre, f.campos as formulario_campos
     FROM formularios_completados fc
     JOIN formularios f ON fc.formulario_id = f.id
     WHERE fc.paciente_id = ? AND f.consultorio_id = ?
     ORDER BY fc.fecha_completado DESC`,
    [req.pacienteId, req.consultorioId]
  );

  for (const fc of completados) {
    if (typeof fc.datos === 'string') fc.datos = JSON.parse(fc.datos);
    if (typeof fc.formulario_campos === 'string') fc.formulario_campos = JSON.parse(fc.formulario_campos);
  }

  res.json({ success: true, data: { formularios_completados: completados } });
});

/**
 * Cambiar contraseña del portal.
 * PUT /api/portal/password
 */
const updatePassword = asyncHandler(async (req, res) => {
  const { current_password, new_password } = req.body;

  if (!current_password || !new_password) {
    return res.status(400).json({
      success: false,
      message: 'Se requiere contraseña actual y nueva'
    });
  }

  if (String(new_password).length < 8) {
    return res.status(400).json({
      success: false,
      message: 'La nueva contraseña debe tener al menos 8 caracteres'
    });
  }

  const [rows] = await pool.query('SELECT password_hash FROM pacientes WHERE id = ?', [req.pacienteId]);
  const isMatch = await bcrypt.compare(current_password, rows[0].password_hash);

  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Contraseña actual incorrecta' });
  }

  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(new_password, salt);
  // tokens_invalidos_antes = NOW(): cierra cualquier otra sesión del
  // portal abierta con la contraseña anterior (mismo mecanismo que el
  // staff — ver authController.updatePassword).
  await pool.query(
    'UPDATE pacientes SET password_hash = ?, tokens_invalidos_antes = NOW() WHERE id = ?',
    [passwordHash, req.pacienteId]
  );

  res.json({ success: true, message: 'Contraseña actualizada exitosamente' });
});

/**
 * Cerrar sesión en todos los dispositivos del portal — mismo mecanismo
 * que el logout de staff (ver authController.logout).
 * POST /api/portal/auth/logout
 */
const logout = asyncHandler(async (req, res) => {
  await pool.query(
    'UPDATE pacientes SET tokens_invalidos_antes = NOW() WHERE id = ?',
    [req.pacienteId]
  );

  res.json({ success: true, message: 'Sesión cerrada en todos los dispositivos' });
});

// ============================================
// CITAS: próximas, historial, reserva, check-in
// ============================================

/**
 * Próximas citas del paciente (hoy en adelante, no canceladas).
 * GET /api/portal/citas
 */
const getCitasProximas = asyncHandler(async (req, res) => {
  const [citas] = await pool.query(
    `SELECT c.uuid, c.fecha, c.hora_inicio, c.hora_fin, c.estado, c.tipo, c.motivo,
            c.precio_total, c.pagado, c.checkin_at,
            u.uuid as doctor_uuid, u.nombre as doctor_nombre, u.apellidos as doctor_apellidos, u.especialidad
     FROM citas c
     JOIN usuarios u ON c.doctor_id = u.id
     WHERE c.paciente_id = ? AND c.consultorio_id = ?
     AND c.fecha >= CURDATE() AND c.estado NOT IN ('cancelada', 'no_asistio')
     ORDER BY c.fecha, c.hora_inicio`,
    [req.pacienteId, req.consultorioId]
  );

  res.json({ success: true, data: { citas } });
});

/**
 * Historial de citas pasadas. Se excluyen notas internas de uso clínico
 * (notas, notas_medicas, receta) — el paciente solo ve lo que él mismo
 * reportó (motivo) y el resultado (estado, servicios).
 * GET /api/portal/historial
 */
const getHistorial = asyncHandler(async (req, res) => {
  const [citas] = await pool.query(
    `SELECT c.uuid, c.fecha, c.hora_inicio, c.hora_fin, c.estado, c.tipo, c.motivo,
            c.precio_total, c.pagado,
            u.nombre as doctor_nombre, u.apellidos as doctor_apellidos, u.especialidad
     FROM citas c
     JOIN usuarios u ON c.doctor_id = u.id
     WHERE c.paciente_id = ? AND c.consultorio_id = ?
     AND (c.fecha < CURDATE() OR c.estado IN ('completada', 'cancelada', 'no_asistio'))
     ORDER BY c.fecha DESC, c.hora_inicio DESC`,
    [req.pacienteId, req.consultorioId]
  );

  for (const cita of citas) {
    const [servicios] = await pool.query(
      `SELECT s.nombre, cs.precio, cs.cantidad
       FROM cita_servicios cs
       JOIN servicios s ON cs.servicio_id = s.id
       JOIN citas c ON cs.cita_id = c.id
       WHERE c.uuid = ?`,
      [cita.uuid]
    );
    cita.servicios = servicios;
  }

  res.json({ success: true, data: { citas } });
});

/**
 * Doctores disponibles para reservar, con sus servicios.
 * GET /api/portal/doctores
 */
const getDoctoresDisponibles = asyncHandler(async (req, res) => {
  const [doctores] = await pool.query(
    `SELECT uuid, nombre, apellidos, avatar_url, especialidad, descripcion
     FROM usuarios
     WHERE consultorio_id = ? AND rol = 'doctor' AND activo = TRUE
     ORDER BY nombre, apellidos`,
    [req.consultorioId]
  );

  res.json({ success: true, data: { doctores } });
});

/**
 * Reservar una cita como paciente. Reutiliza citasController.createCita
 * (misma validación de disponibilidad con locking, mismos límites) forzando
 * paciente_uuid al paciente autenticado — un paciente nunca puede reservar
 * a nombre de otro.
 * POST /api/portal/citas
 */
const crearCitaPortal = asyncHandler(async (req, res) => {
  req.body.paciente_uuid = req.paciente.uuid;
  // Solo el staff decide si una cita entra a un consultorio interno específico
  delete req.body.consultorio_interno_uuid;
  return createCita(req, res);
});

/**
 * Check-in de una cita el día de la consulta.
 * POST /api/portal/citas/:uuid/checkin
 */
const checkinCita = asyncHandler(async (req, res) => {
  const { uuid } = req.params;

  const [citas] = await pool.query(
    `SELECT id, fecha, estado, checkin_at FROM citas
     WHERE uuid = ? AND paciente_id = ? AND consultorio_id = ?`,
    [uuid, req.pacienteId, req.consultorioId]
  );

  if (citas.length === 0) {
    return res.status(404).json({ success: false, message: 'Cita no encontrada' });
  }

  const cita = citas[0];

  if (['cancelada', 'no_asistio'].includes(cita.estado)) {
    return res.status(400).json({ success: false, message: 'Esta cita ya no está activa' });
  }

  const hoy = new Date();
  const fechaHoy = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
  const fechaCita = cita.fecha instanceof Date
    ? `${cita.fecha.getFullYear()}-${String(cita.fecha.getMonth() + 1).padStart(2, '0')}-${String(cita.fecha.getDate()).padStart(2, '0')}`
    : String(cita.fecha).substring(0, 10);

  if (fechaCita !== fechaHoy) {
    return res.status(400).json({ success: false, message: 'El check-in solo está disponible el día de la cita' });
  }

  if (!cita.checkin_at) {
    await pool.query('UPDATE citas SET checkin_at = NOW() WHERE id = ?', [cita.id]);
  }

  const [actualizada] = await pool.query('SELECT checkin_at FROM citas WHERE id = ?', [cita.id]);

  res.json({
    success: true,
    message: 'Check-in registrado',
    data: { checkin_at: actualizada[0].checkin_at }
  });
});

/**
 * El paciente confirma que asistirá a su cita.
 * PUT /api/portal/citas/:uuid/confirmar
 */
const confirmarCita = asyncHandler(async (req, res) => {
  const { uuid } = req.params;

  const [citas] = await pool.query(
    'SELECT id, estado FROM citas WHERE uuid = ? AND paciente_id = ? AND consultorio_id = ?',
    [uuid, req.pacienteId, req.consultorioId]
  );

  if (citas.length === 0) {
    return res.status(404).json({ success: false, message: 'Cita no encontrada' });
  }

  if (!['programada', 'reprogramada'].includes(citas[0].estado)) {
    return res.status(400).json({ success: false, message: 'Esta cita ya no se puede confirmar' });
  }

  await pool.query('UPDATE citas SET estado = "confirmada" WHERE id = ?', [citas[0].id]);

  res.json({ success: true, message: 'Cita confirmada' });
});

/**
 * El paciente cancela su propia cita. Libera el horario (elimina bloqueos
 * asociados) igual que cuando el personal cancela desde el detalle de cita.
 * PUT /api/portal/citas/:uuid/cancelar
 */
const cancelarCitaPortal = asyncHandler(async (req, res) => {
  const { uuid } = req.params;

  const [citas] = await pool.query(
    `SELECT id, doctor_id, fecha, hora_inicio, hora_fin, estado
     FROM citas WHERE uuid = ? AND paciente_id = ? AND consultorio_id = ?`,
    [uuid, req.pacienteId, req.consultorioId]
  );

  if (citas.length === 0) {
    return res.status(404).json({ success: false, message: 'Cita no encontrada' });
  }

  if (['cancelada', 'completada', 'no_asistio'].includes(citas[0].estado)) {
    return res.status(400).json({ success: false, message: 'Esta cita ya no se puede cancelar' });
  }

  await eliminarBloqueosDeCita(citas[0].id, citas[0]);
  await pool.query('UPDATE citas SET estado = "cancelada" WHERE id = ?', [citas[0].id]);

  res.json({ success: true, message: 'Cita cancelada' });
});

/**
 * El paciente reagenda (nueva fecha/hora, validando disponibilidad del
 * doctor igual que el personal) o modifica el motivo de su propia cita.
 * PUT /api/portal/citas/:uuid
 */
const actualizarCitaPortal = asyncHandler(async (req, res) => {
  const { uuid } = req.params;
  const { fecha, hora_inicio, motivo } = req.body;

  const [citas] = await pool.query(
    `SELECT id, doctor_id, fecha, hora_inicio, hora_fin, estado
     FROM citas WHERE uuid = ? AND paciente_id = ? AND consultorio_id = ?`,
    [uuid, req.pacienteId, req.consultorioId]
  );

  if (citas.length === 0) {
    return res.status(404).json({ success: false, message: 'Cita no encontrada' });
  }

  const cita = citas[0];

  if (['cancelada', 'completada', 'no_asistio'].includes(cita.estado)) {
    return res.status(400).json({ success: false, message: 'Esta cita ya no se puede modificar' });
  }

  const fieldsToUpdate = {};

  if (fecha || hora_inicio) {
    const nuevaFecha = fecha || formatFechaLocal(cita.fecha);
    const nuevaHoraInicio = hora_inicio || String(cita.hora_inicio).substring(0, 5);

    if (nuevaFecha < formatFechaLocal(new Date())) {
      return res.status(400).json({ success: false, message: 'No se puede reagendar a una fecha pasada' });
    }

    // Conservar la misma duración de la cita original
    const [hi, mi] = String(cita.hora_inicio).substring(0, 5).split(':').map(Number);
    const [hf, mf] = String(cita.hora_fin).substring(0, 5).split(':').map(Number);
    const duracionMinutos = Math.max((hf * 60 + mf) - (hi * 60 + mi), 0) || 30;
    const nuevaHoraFin = calcularHoraFin(nuevaHoraInicio, duracionMinutos);

    // Liberar el bloqueo del horario viejo antes de validar el nuevo,
    // para que no choque consigo mismo
    await eliminarBloqueosDeCita(cita.id, cita);

    const disponibilidad = await validarDisponibilidadDoctor(
      cita.doctor_id, nuevaFecha, nuevaHoraInicio, nuevaHoraFin, cita.id
    );

    if (disponibilidad.error) {
      return res.status(400).json({ success: false, message: disponibilidad.error });
    }

    fieldsToUpdate.fecha = nuevaFecha;
    fieldsToUpdate.hora_inicio = nuevaHoraInicio;
    fieldsToUpdate.hora_fin = nuevaHoraFin;
    fieldsToUpdate.estado = 'reprogramada';
    fieldsToUpdate.checkin_at = null;
  }

  if (motivo !== undefined) {
    fieldsToUpdate.motivo = motivo;
  }

  if (Object.keys(fieldsToUpdate).length === 0) {
    return res.status(400).json({ success: false, message: 'No hay cambios para guardar' });
  }

  const setClause = Object.keys(fieldsToUpdate).map(f => `${f} = ?`).join(', ');
  await pool.query(
    `UPDATE citas SET ${setClause} WHERE id = ?`,
    [...Object.values(fieldsToUpdate), cita.id]
  );

  res.json({ success: true, message: 'Cita actualizada exitosamente' });
});

// ============================================
// ESTADO DE CUENTA
// ============================================

/**
 * GET /api/portal/cuenta
 */
const getCuenta = asyncHandler(async (req, res) => {
  const [recibos] = await pool.query(
    `SELECT r.uuid, r.numero_recibo, r.subtotal, r.descuento, r.impuestos, r.total,
            r.estado, r.metodo_pago, r.fecha_emision, r.fecha_pago,
            COALESCE((SELECT SUM(pg.monto) FROM pagos pg WHERE pg.recibo_id = r.id), 0) as pagado
     FROM recibos r
     WHERE r.paciente_id = ? AND r.consultorio_id = ?
     ORDER BY r.fecha_emision DESC`,
    [req.pacienteId, req.consultorioId]
  );

  for (const recibo of recibos) {
    const [items] = await pool.query(
      `SELECT tipo, descripcion, cantidad, precio_unitario, total
       FROM recibo_items WHERE recibo_id = (SELECT id FROM recibos WHERE uuid = ?)`,
      [recibo.uuid]
    );
    recibo.items = items;
    recibo.saldo = Math.max(parseFloat(recibo.total) - parseFloat(recibo.pagado), 0);
  }

  const saldoTotal = recibos.reduce((acc, r) => acc + r.saldo, 0);

  res.json({
    success: true,
    data: { recibos, saldo_total: saldoTotal }
  });
});

// ============================================
// RECOMPENSAS
// ============================================

/**
 * GET /api/portal/recompensas
 */
const getRecompensas = asyncHandler(async (req, res) => {
  const [pacienteRows] = await pool.query('SELECT puntos FROM pacientes WHERE id = ?', [req.pacienteId]);

  const [movimientos] = await pool.query(
    `SELECT tipo, puntos, concepto, fecha_creacion
     FROM paciente_recompensas_movimientos
     WHERE paciente_id = ? AND consultorio_id = ?
     ORDER BY fecha_creacion DESC LIMIT 100`,
    [req.pacienteId, req.consultorioId]
  );

  res.json({
    success: true,
    data: {
      puntos: pacienteRows[0]?.puntos || 0,
      movimientos
    }
  });
});

/**
 * Catálogo canjeable con puntos: productos del inventario (con stock) y
 * tratamientos/servicios, ambos solo si el admin les configuró un
 * puntos_precio > 0. Se devuelven juntos, cada uno anotado con su `tipo`,
 * para que el portal los muestre en una sola pantalla.
 * GET /api/portal/canje-catalogo
 */
const getCanjeCatalogo = asyncHandler(async (req, res) => {
  const [productos] = await pool.query(
    `SELECT uuid, nombre, descripcion, puntos_precio, stock
     FROM inventario
     WHERE consultorio_id = ? AND activo = TRUE AND puntos_precio > 0 AND stock > 0
     ORDER BY puntos_precio ASC`,
    [req.consultorioId]
  );

  const [servicios] = await pool.query(
    `SELECT uuid, nombre, descripcion, puntos_precio, duracion_minutos
     FROM servicios
     WHERE consultorio_id = ? AND activo = TRUE AND puntos_precio > 0
     ORDER BY puntos_precio ASC`,
    [req.consultorioId]
  );

  res.json({
    success: true,
    data: {
      productos: productos.map(p => ({ ...p, tipo: 'producto' })),
      servicios: servicios.map(s => ({ ...s, tipo: 'servicio' }))
    }
  });
});

/**
 * Canjear un producto o un tratamiento a cambio de puntos.
 * POST /api/portal/canjes
 * Body: { tipo: 'producto'|'servicio', uuid, cantidad? }
 */
const crearCanje = asyncHandler(async (req, res) => {
  const { tipo, uuid: itemUuid, cantidad } = req.body;
  const cantidadNum = parseInt(cantidad, 10) || 1;

  if (!itemUuid || !['producto', 'servicio'].includes(tipo)) {
    return res.status(400).json({ success: false, message: 'Tipo (producto/servicio) e ítem son requeridos' });
  }

  if (cantidadNum <= 0) {
    return res.status(400).json({ success: false, message: 'Cantidad inválida' });
  }

  // Los tratamientos no tienen stock físico; solo los productos lo requieren
  if (tipo === 'servicio' && cantidadNum > 1) {
    return res.status(400).json({ success: false, message: 'Los tratamientos se canjean de uno en uno' });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const tabla = tipo === 'producto' ? 'inventario' : 'servicios';
    const [items] = await connection.query(
      `SELECT id, nombre, puntos_precio${tipo === 'producto' ? ', stock' : ''} FROM ${tabla}
       WHERE uuid = ? AND consultorio_id = ? AND activo = TRUE FOR UPDATE`,
      [itemUuid, req.consultorioId]
    );

    if (items.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: tipo === 'producto' ? 'Producto no encontrado' : 'Tratamiento no encontrado' });
    }

    const item = items[0];

    if (!item.puntos_precio || item.puntos_precio <= 0) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Este artículo no está disponible para canje con puntos' });
    }

    if (tipo === 'producto' && item.stock < cantidadNum) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: `Solo quedan ${item.stock} unidades disponibles` });
    }

    const puntosNecesarios = item.puntos_precio * cantidadNum;

    const [pacienteRows] = await connection.query(
      'SELECT puntos FROM pacientes WHERE id = ? FOR UPDATE',
      [req.pacienteId]
    );

    if ((pacienteRows[0]?.puntos || 0) < puntosNecesarios) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `No tienes puntos suficientes. Necesitas ${puntosNecesarios} y tienes ${pacienteRows[0]?.puntos || 0}`
      });
    }

    if (tipo === 'producto') {
      await connection.query('UPDATE inventario SET stock = stock - ? WHERE id = ?', [cantidadNum, item.id]);
    }
    await connection.query('UPDATE pacientes SET puntos = puntos - ? WHERE id = ?', [puntosNecesarios, req.pacienteId]);

    const canjeUuid = uuidv4();
    await connection.query(
      `INSERT INTO canjes_recompensas (consultorio_id, uuid, paciente_id, tipo, producto_id, servicio_id, item_nombre, cantidad, puntos_gastados)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.consultorioId, canjeUuid, req.pacienteId, tipo,
        tipo === 'producto' ? item.id : null,
        tipo === 'servicio' ? item.id : null,
        item.nombre, cantidadNum, puntosNecesarios
      ]
    );

    await connection.query(
      `INSERT INTO paciente_recompensas_movimientos
       (consultorio_id, paciente_id, tipo, puntos, concepto, referencia_tipo, referencia_id)
       VALUES (?, ?, 'canjeado', ?, ?, 'canje', LAST_INSERT_ID())`,
      [req.consultorioId, req.pacienteId, -puntosNecesarios, `Canje: ${item.nombre}`]
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      message: tipo === 'producto'
        ? 'Canje realizado. Muéstralo en tu próxima visita para recoger tu producto.'
        : 'Canje realizado. Muéstralo en tu próxima visita para aplicar tu tratamiento.',
      data: { uuid: canjeUuid, puntos_gastados: puntosNecesarios }
    });

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});

/**
 * Historial de canjes del paciente.
 * GET /api/portal/canjes
 */
const getMisCanjes = asyncHandler(async (req, res) => {
  const [canjes] = await pool.query(
    `SELECT uuid, tipo, item_nombre, cantidad, puntos_gastados, estado, fecha_creacion, fecha_entrega
     FROM canjes_recompensas
     WHERE paciente_id = ? AND consultorio_id = ?
     ORDER BY fecha_creacion DESC`,
    [req.pacienteId, req.consultorioId]
  );

  res.json({ success: true, data: { canjes } });
});

// ============================================
// PROMOCIONES (solo lectura desde el portal)
// ============================================

/**
 * GET /api/portal/promociones
 */
const getPromocionesActivas = asyncHandler(async (req, res) => {
  const [promociones] = await pool.query(
    `SELECT uuid, titulo, mensaje, icono, color, imagen_blob, fecha_inicio, fecha_fin
     FROM promociones
     WHERE consultorio_id = ? AND activa = TRUE
     AND (fecha_inicio IS NULL OR fecha_inicio <= CURDATE())
     AND (fecha_fin IS NULL OR fecha_fin >= CURDATE())
     ORDER BY fecha_creacion DESC`,
    [req.consultorioId]
  );

  res.json({ success: true, data: { promociones } });
});

module.exports = {
  registro,
  login,
  solicitarResetPassword,
  confirmarResetPassword,
  getMe,
  updatePassword,
  logout,
  getCitasProximas,
  getHistorial,
  getDoctoresDisponibles,
  crearCitaPortal,
  checkinCita,
  confirmarCita,
  cancelarCitaPortal,
  actualizarCitaPortal,
  getFormulariosCompletadosPortal,
  getCuenta,
  getRecompensas,
  getCanjeCatalogo,
  crearCanje,
  getMisCanjes,
  getPromocionesActivas
};
