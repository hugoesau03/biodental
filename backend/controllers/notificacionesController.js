const { pool } = require('../config/database');
const { asyncHandler } = require('../middleware');

/**
 * Obtener notificaciones del usuario actual
 * GET /api/notificaciones
 */
const getNotificaciones = asyncHandler(async (req, res) => {
  const { leida, tipo, limite = 50 } = req.query;

  let query = `
    SELECT id, tipo, titulo, mensaje, icono, color, enlace, 
           referencia_tipo, referencia_uuid, leida, fecha_lectura, fecha_creacion
    FROM notificaciones
    WHERE consultorio_id = ? AND (usuario_id IS NULL OR usuario_id = ?)
  `;
  const params = [req.consultorioId, req.user.id];

  if (leida !== undefined) {
    query += ` AND leida = ?`;
    params.push(leida === 'true');
  }

  if (tipo) {
    query += ` AND tipo = ?`;
    params.push(tipo);
  }

  query += ` ORDER BY fecha_creacion DESC LIMIT ?`;
  params.push(parseInt(limite));

  const [notificaciones] = await pool.query(query, params);

  // Contar no leídas
  const [conteo] = await pool.query(
    `SELECT COUNT(*) as no_leidas FROM notificaciones 
     WHERE consultorio_id = ? AND (usuario_id IS NULL OR usuario_id = ?) AND leida = FALSE`,
    [req.consultorioId, req.user.id]
  );

  res.json({
    success: true,
    data: { 
      notificaciones,
      no_leidas: conteo[0].no_leidas
    }
  });
});

/**
 * Obtener conteo de notificaciones no leídas
 * GET /api/notificaciones/conteo
 */
const getConteoNoLeidas = asyncHandler(async (req, res) => {
  const [conteo] = await pool.query(
    `SELECT COUNT(*) as no_leidas FROM notificaciones 
     WHERE consultorio_id = ? AND (usuario_id IS NULL OR usuario_id = ?) AND leida = FALSE`,
    [req.consultorioId, req.user.id]
  );

  res.json({
    success: true,
    data: { no_leidas: conteo[0].no_leidas }
  });
});

/**
 * Marcar notificación como leída
 * PUT /api/notificaciones/:id/leer
 */
const marcarLeida = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [result] = await pool.query(
    `UPDATE notificaciones 
     SET leida = TRUE, fecha_lectura = NOW()
     WHERE id = ? AND consultorio_id = ? AND (usuario_id IS NULL OR usuario_id = ?)`,
    [id, req.consultorioId, req.user.id]
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({
      success: false,
      message: 'Notificación no encontrada'
    });
  }

  res.json({
    success: true,
    message: 'Notificación marcada como leída'
  });
});

/**
 * Marcar todas las notificaciones como leídas
 * PUT /api/notificaciones/leer-todas
 */
const marcarTodasLeidas = asyncHandler(async (req, res) => {
  const [result] = await pool.query(
    `UPDATE notificaciones 
     SET leida = TRUE, fecha_lectura = NOW()
     WHERE consultorio_id = ? AND (usuario_id IS NULL OR usuario_id = ?) AND leida = FALSE`,
    [req.consultorioId, req.user.id]
  );

  res.json({
    success: true,
    message: `${result.affectedRows} notificaciones marcadas como leídas`
  });
});

/**
 * Crear notificación (uso interno/admin)
 * POST /api/notificaciones
 */
const createNotificacion = asyncHandler(async (req, res) => {
  const { 
    usuario_id, 
    tipo = 'sistema', 
    titulo, 
    mensaje, 
    icono = 'bell',
    color = 'primary',
    enlace,
    referencia_tipo,
    referencia_uuid 
  } = req.body;

  if (!titulo || !mensaje) {
    return res.status(400).json({
      success: false,
      message: 'Título y mensaje son requeridos'
    });
  }

  // Si se especifica usuario, verificar que pertenece al consultorio
  let targetUserId = null;
  if (usuario_id) {
    const [usuarios] = await pool.query(
      'SELECT id FROM usuarios WHERE uuid = ? AND consultorio_id = ?',
      [usuario_id, req.consultorioId]
    );
    if (usuarios.length > 0) {
      targetUserId = usuarios[0].id;
    }
  }

  const [result] = await pool.query(
    `INSERT INTO notificaciones 
     (consultorio_id, usuario_id, tipo, titulo, mensaje, icono, color, enlace, referencia_tipo, referencia_uuid)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [req.consultorioId, targetUserId, tipo, titulo, mensaje, icono, color, 
     enlace || null, referencia_tipo || null, referencia_uuid || null]
  );

  res.status(201).json({
    success: true,
    message: 'Notificación creada',
    data: { id: result.insertId }
  });
});

/**
 * Eliminar notificación
 * DELETE /api/notificaciones/:id
 */
const deleteNotificacion = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [result] = await pool.query(
    `DELETE FROM notificaciones 
     WHERE id = ? AND consultorio_id = ? AND (usuario_id IS NULL OR usuario_id = ?)`,
    [id, req.consultorioId, req.user.id]
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({
      success: false,
      message: 'Notificación no encontrada'
    });
  }

  res.json({
    success: true,
    message: 'Notificación eliminada'
  });
});

/**
 * Eliminar notificaciones antiguas (limpieza)
 * DELETE /api/notificaciones/limpiar
 */
const limpiarAntiguos = asyncHandler(async (req, res) => {
  const { dias = 30 } = req.query;

  const [result] = await pool.query(
    `DELETE FROM notificaciones 
     WHERE consultorio_id = ? AND leida = TRUE AND fecha_creacion < DATE_SUB(NOW(), INTERVAL ? DAY)`,
    [req.consultorioId, parseInt(dias)]
  );

  res.json({
    success: true,
    message: `${result.affectedRows} notificaciones antiguas eliminadas`
  });
});

/**
 * Limpiar todas las notificaciones del usuario actual
 * DELETE /api/notificaciones/limpiar-todas
 */
const limpiarTodas = asyncHandler(async (req, res) => {
  // Solo elimina las notificaciones que el usuario puede ver
  // (las que son para él específicamente o las generales del consultorio)
  const [result] = await pool.query(
    `DELETE FROM notificaciones 
     WHERE consultorio_id = ? AND (usuario_id IS NULL OR usuario_id = ?)`,
    [req.consultorioId, req.user.id]
  );

  res.json({
    success: true,
    message: `${result.affectedRows} notificaciones eliminadas`
  });
});

/**
 * Función helper para crear notificaciones desde otros controladores
 * Uso: await crearNotificacionInterna(pool, consultorioId, {...})
 */
const crearNotificacionInterna = async (consultorioId, opciones) => {
  const {
    usuario_id = null,
    tipo = 'sistema',
    titulo,
    mensaje,
    icono = 'bell',
    color = 'primary',
    enlace = null,
    referencia_tipo = null,
    referencia_uuid = null
  } = opciones;

  await pool.query(
    `INSERT INTO notificaciones 
     (consultorio_id, usuario_id, tipo, titulo, mensaje, icono, color, enlace, referencia_tipo, referencia_uuid)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [consultorioId, usuario_id, tipo, titulo, mensaje, icono, color, enlace, referencia_tipo, referencia_uuid]
  );
};

module.exports = {
  getNotificaciones,
  getConteoNoLeidas,
  marcarLeida,
  marcarTodasLeidas,
  createNotificacion,
  deleteNotificacion,
  limpiarAntiguos,
  limpiarTodas,
  crearNotificacionInterna
};
