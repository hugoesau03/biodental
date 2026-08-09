const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');
const { asyncHandler } = require('../middleware');

/**
 * Promociones que la clínica publica para los pacientes en el portal
 * (app paciente). CRUD de staff — la lectura pública/paciente vive en
 * portalController.getPromocionesActivas.
 */

/**
 * GET /api/promociones
 */
const getPromociones = asyncHandler(async (req, res) => {
  const [promociones] = await pool.query(
    `SELECT uuid, titulo, mensaje, icono, color, activa, fecha_inicio, fecha_fin, fecha_creacion
     FROM promociones
     WHERE consultorio_id = ?
     ORDER BY fecha_creacion DESC`,
    [req.consultorioId]
  );

  res.json({ success: true, data: { promociones } });
});

/**
 * POST /api/promociones
 */
const createPromocion = asyncHandler(async (req, res) => {
  const { titulo, mensaje, icono, color, fecha_inicio, fecha_fin, activa } = req.body;

  if (!titulo || !mensaje) {
    return res.status(400).json({
      success: false,
      message: 'Título y mensaje son requeridos'
    });
  }

  const uuid = uuidv4();
  await pool.query(
    `INSERT INTO promociones (consultorio_id, uuid, titulo, mensaje, icono, color, activa, fecha_inicio, fecha_fin, creado_por)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      req.consultorioId, uuid, titulo, mensaje,
      icono || 'gift', color || 'primary',
      activa === undefined ? true : !!activa,
      fecha_inicio || null, fecha_fin || null,
      req.userId || null
    ]
  );

  res.status(201).json({
    success: true,
    message: 'Promoción creada exitosamente',
    data: { uuid }
  });
});

/**
 * PUT /api/promociones/:uuid
 */
const updatePromocion = asyncHandler(async (req, res) => {
  const { uuid } = req.params;
  const { titulo, mensaje, icono, color, fecha_inicio, fecha_fin, activa } = req.body;

  const updates = [];
  const params = [];

  if (titulo !== undefined) { updates.push('titulo = ?'); params.push(titulo); }
  if (mensaje !== undefined) { updates.push('mensaje = ?'); params.push(mensaje); }
  if (icono !== undefined) { updates.push('icono = ?'); params.push(icono); }
  if (color !== undefined) { updates.push('color = ?'); params.push(color); }
  if (fecha_inicio !== undefined) { updates.push('fecha_inicio = ?'); params.push(fecha_inicio || null); }
  if (fecha_fin !== undefined) { updates.push('fecha_fin = ?'); params.push(fecha_fin || null); }
  if (activa !== undefined) { updates.push('activa = ?'); params.push(!!activa); }

  if (updates.length === 0) {
    return res.status(400).json({ success: false, message: 'No hay campos para actualizar' });
  }

  params.push(uuid, req.consultorioId);
  const [result] = await pool.query(
    `UPDATE promociones SET ${updates.join(', ')} WHERE uuid = ? AND consultorio_id = ?`,
    params
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({ success: false, message: 'Promoción no encontrada' });
  }

  res.json({ success: true, message: 'Promoción actualizada exitosamente' });
});

/**
 * DELETE /api/promociones/:uuid
 */
const deletePromocion = asyncHandler(async (req, res) => {
  const { uuid } = req.params;

  const [result] = await pool.query(
    'DELETE FROM promociones WHERE uuid = ? AND consultorio_id = ?',
    [uuid, req.consultorioId]
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({ success: false, message: 'Promoción no encontrada' });
  }

  res.json({ success: true, message: 'Promoción eliminada exitosamente' });
});

module.exports = {
  getPromociones,
  createPromocion,
  updatePromocion,
  deletePromocion
};
