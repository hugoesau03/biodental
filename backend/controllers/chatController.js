const { pool } = require('../config/database');
const { asyncHandler } = require('../middleware');
const { crearNotificacionInterna } = require('./notificacionesController');

/**
 * Chat en vivo entre el paciente y recepción. Una sola conversación por
 * paciente (no hay hilos/temas), igual que un chat de soporte simple.
 * Lado staff aquí; el lado paciente vive en portalController.
 */

/**
 * Lista de conversaciones para el staff: un renglón por paciente que ha
 * escrito o recibido al menos un mensaje, con el último mensaje y el
 * conteo de no leídos por el staff.
 * GET /api/chat
 */
const getConversaciones = asyncHandler(async (req, res) => {
  const [conversaciones] = await pool.query(
    `SELECT p.uuid as paciente_uuid, p.nombre as paciente_nombre, p.apellidos as paciente_apellidos,
            ult.mensaje as ultimo_mensaje, ult.remitente as ultimo_remitente, ult.fecha_creacion as ultima_fecha,
            (SELECT COUNT(*) FROM chat_mensajes cm2
             WHERE cm2.paciente_id = p.id AND cm2.remitente = 'paciente' AND cm2.leido_staff = FALSE) as no_leidos
     FROM chat_mensajes cm
     JOIN pacientes p ON cm.paciente_id = p.id
     JOIN (
       SELECT paciente_id, MAX(id) as ultimo_id
       FROM chat_mensajes
       WHERE consultorio_id = ?
       GROUP BY paciente_id
     ) ult_ids ON ult_ids.paciente_id = cm.paciente_id AND ult_ids.ultimo_id = cm.id
     JOIN chat_mensajes ult ON ult.id = ult_ids.ultimo_id
     WHERE cm.consultorio_id = ?
     ORDER BY ult.fecha_creacion DESC`,
    [req.consultorioId, req.consultorioId]
  );

  res.json({ success: true, data: { conversaciones } });
});

/**
 * Hilo completo con un paciente. Marca como leídos por el staff los
 * mensajes que el paciente había enviado.
 * GET /api/chat/:paciente_uuid
 */
const getMensajes = asyncHandler(async (req, res) => {
  const { paciente_uuid } = req.params;

  const [pacientes] = await pool.query(
    'SELECT id, nombre, apellidos FROM pacientes WHERE uuid = ? AND consultorio_id = ?',
    [paciente_uuid, req.consultorioId]
  );
  if (pacientes.length === 0) {
    return res.status(404).json({ success: false, message: 'Paciente no encontrado' });
  }
  const pacienteId = pacientes[0].id;

  const [mensajes] = await pool.query(
    `SELECT cm.id, cm.remitente, cm.mensaje, cm.fecha_creacion,
            u.nombre as remitente_nombre, u.apellidos as remitente_apellidos
     FROM chat_mensajes cm
     LEFT JOIN usuarios u ON cm.remitente_usuario_id = u.id
     WHERE cm.paciente_id = ? AND cm.consultorio_id = ?
     ORDER BY cm.id ASC`,
    [pacienteId, req.consultorioId]
  );

  await pool.query(
    `UPDATE chat_mensajes SET leido_staff = TRUE
     WHERE paciente_id = ? AND consultorio_id = ? AND remitente = 'paciente' AND leido_staff = FALSE`,
    [pacienteId, req.consultorioId]
  );

  res.json({
    success: true,
    data: {
      paciente: { nombre: pacientes[0].nombre, apellidos: pacientes[0].apellidos },
      mensajes
    }
  });
});

/**
 * El staff responde a un paciente.
 * POST /api/chat/:paciente_uuid
 */
const enviarMensaje = asyncHandler(async (req, res) => {
  const { paciente_uuid } = req.params;
  const { mensaje } = req.body;

  if (!mensaje || !mensaje.trim()) {
    return res.status(400).json({ success: false, message: 'El mensaje no puede estar vacío' });
  }

  const [pacientes] = await pool.query(
    'SELECT id FROM pacientes WHERE uuid = ? AND consultorio_id = ?',
    [paciente_uuid, req.consultorioId]
  );
  if (pacientes.length === 0) {
    return res.status(404).json({ success: false, message: 'Paciente no encontrado' });
  }

  const [result] = await pool.query(
    `INSERT INTO chat_mensajes (consultorio_id, paciente_id, remitente, remitente_usuario_id, mensaje, leido_paciente, leido_staff)
     VALUES (?, ?, 'staff', ?, ?, FALSE, TRUE)`,
    [req.consultorioId, pacientes[0].id, req.userId || null, mensaje.trim()]
  );

  res.status(201).json({ success: true, data: { id: result.insertId } });
});

/**
 * Conteo total de mensajes de pacientes sin leer, para el badge del ícono
 * de chat en el header del staff.
 * GET /api/chat/no-leidos
 */
const getNoLeidos = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT COUNT(*) as total FROM chat_mensajes
     WHERE consultorio_id = ? AND remitente = 'paciente' AND leido_staff = FALSE`,
    [req.consultorioId]
  );
  res.json({ success: true, data: { no_leidos: rows[0].total } });
});

// ============================================
// Lado paciente (montado bajo /api/portal/chat)
// ============================================

/**
 * GET /api/portal/chat
 */
const getMisMensajes = asyncHandler(async (req, res) => {
  const [mensajes] = await pool.query(
    `SELECT cm.id, cm.remitente, cm.mensaje, cm.fecha_creacion,
            u.nombre as remitente_nombre
     FROM chat_mensajes cm
     LEFT JOIN usuarios u ON cm.remitente_usuario_id = u.id
     WHERE cm.paciente_id = ? AND cm.consultorio_id = ?
     ORDER BY cm.id ASC`,
    [req.pacienteId, req.consultorioId]
  );

  await pool.query(
    `UPDATE chat_mensajes SET leido_paciente = TRUE
     WHERE paciente_id = ? AND consultorio_id = ? AND remitente = 'staff' AND leido_paciente = FALSE`,
    [req.pacienteId, req.consultorioId]
  );

  res.json({ success: true, data: { mensajes } });
});

/**
 * POST /api/portal/chat
 */
const enviarMensajePortal = asyncHandler(async (req, res) => {
  const { mensaje } = req.body;

  if (!mensaje || !mensaje.trim()) {
    return res.status(400).json({ success: false, message: 'El mensaje no puede estar vacío' });
  }

  const [result] = await pool.query(
    `INSERT INTO chat_mensajes (consultorio_id, paciente_id, remitente, mensaje, leido_paciente, leido_staff)
     VALUES (?, ?, 'paciente', ?, TRUE, FALSE)`,
    [req.consultorioId, req.pacienteId, mensaje.trim()]
  );

  const [pacienteRows] = await pool.query('SELECT nombre, apellidos, uuid FROM pacientes WHERE id = ?', [req.pacienteId]);
  const paciente = pacienteRows[0];

  crearNotificacionInterna(req.consultorioId, {
    tipo: 'sistema',
    titulo: 'Nuevo mensaje de chat',
    mensaje: `${paciente?.nombre || 'Un paciente'} ${paciente?.apellidos || ''} escribió: "${mensaje.trim().substring(0, 80)}"`,
    icono: 'message-circle',
    color: 'info',
    enlace: `/mensajes/${paciente?.uuid}`,
    referencia_tipo: 'chat',
    referencia_uuid: paciente?.uuid
  }).catch((err) => console.error('Error creando notificación de chat:', err.message));

  res.status(201).json({ success: true, data: { id: result.insertId } });
});

/**
 * Conteo de mensajes de staff sin leer, para el badge de la burbuja de
 * chat en el portal del paciente.
 * GET /api/portal/chat/no-leidos
 */
const getNoLeidosPortal = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT COUNT(*) as total FROM chat_mensajes
     WHERE paciente_id = ? AND consultorio_id = ? AND remitente = 'staff' AND leido_paciente = FALSE`,
    [req.pacienteId, req.consultorioId]
  );
  res.json({ success: true, data: { no_leidos: rows[0].total } });
});

module.exports = {
  getConversaciones,
  getMensajes,
  enviarMensaje,
  getNoLeidos,
  getMisMensajes,
  enviarMensajePortal,
  getNoLeidosPortal
};
