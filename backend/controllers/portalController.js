const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { asyncHandler } = require('../middleware');
const { createCita } = require('./citasController');

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
  const { telefono, fecha_nacimiento, password } = req.body;

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
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  await pool.query('UPDATE pacientes SET password_hash = ? WHERE id = ?', [passwordHash, paciente.id]);

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

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(new_password, salt);
  await pool.query('UPDATE pacientes SET password_hash = ? WHERE id = ?', [passwordHash, req.pacienteId]);

  res.json({ success: true, message: 'Contraseña actualizada exitosamente' });
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
            u.nombre as doctor_nombre, u.apellidos as doctor_apellidos, u.especialidad
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
      `SELECT s.nombre, cs.precio
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

// ============================================
// PROMOCIONES (solo lectura desde el portal)
// ============================================

/**
 * GET /api/portal/promociones
 */
const getPromocionesActivas = asyncHandler(async (req, res) => {
  const [promociones] = await pool.query(
    `SELECT uuid, titulo, mensaje, icono, color, fecha_inicio, fecha_fin
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
  getMe,
  updatePassword,
  getCitasProximas,
  getHistorial,
  getDoctoresDisponibles,
  crearCitaPortal,
  checkinCita,
  getCuenta,
  getRecompensas,
  getPromocionesActivas
};
