const { pool } = require('../config/database');
const { asyncHandler } = require('../middleware');

/**
 * Canjes de productos por puntos (portal de pacientes) — lado staff: ver
 * qué hay pendiente de entregar y marcarlo como entregado cuando el
 * paciente pasa a recogerlo por la clínica.
 */

/**
 * GET /api/canjes
 */
const getCanjes = asyncHandler(async (req, res) => {
  const { estado } = req.query;

  let query = `
    SELECT cr.uuid, cr.tipo, cr.item_nombre, cr.cantidad, cr.puntos_gastados, cr.estado,
           cr.fecha_creacion, cr.fecha_entrega,
           p.uuid as paciente_uuid, p.nombre as paciente_nombre, p.apellidos as paciente_apellidos,
           p.telefono as paciente_telefono
    FROM canjes_recompensas cr
    JOIN pacientes p ON cr.paciente_id = p.id
    WHERE cr.consultorio_id = ?
  `;
  const params = [req.consultorioId];

  if (estado) {
    query += ` AND cr.estado = ?`;
    params.push(estado);
  }

  query += ` ORDER BY cr.fecha_creacion DESC`;

  const [canjes] = await pool.query(query, params);

  res.json({ success: true, data: { canjes } });
});

/**
 * Marcar un canje como entregado.
 * PUT /api/canjes/:uuid/entregar
 */
const entregarCanje = asyncHandler(async (req, res) => {
  const { uuid } = req.params;

  const [canjes] = await pool.query(
    'SELECT id, estado FROM canjes_recompensas WHERE uuid = ? AND consultorio_id = ?',
    [uuid, req.consultorioId]
  );

  if (canjes.length === 0) {
    return res.status(404).json({ success: false, message: 'Canje no encontrado' });
  }

  if (canjes[0].estado !== 'pendiente') {
    return res.status(400).json({ success: false, message: `Este canje ya está marcado como "${canjes[0].estado}"` });
  }

  await pool.query(
    `UPDATE canjes_recompensas SET estado = 'entregado', entregado_por = ?, fecha_entrega = NOW() WHERE id = ?`,
    [req.userId || null, canjes[0].id]
  );

  res.json({ success: true, message: 'Canje marcado como entregado' });
});

/**
 * Cancelar un canje pendiente: devuelve el stock y los puntos al paciente
 * (p. ej. si el producto ya no está disponible o el paciente cambió de opinión).
 * PUT /api/canjes/:uuid/cancelar
 */
const cancelarCanje = asyncHandler(async (req, res) => {
  const { uuid } = req.params;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [canjes] = await connection.query(
      'SELECT id, estado, paciente_id, producto_id, cantidad, puntos_gastados FROM canjes_recompensas WHERE uuid = ? AND consultorio_id = ? FOR UPDATE',
      [uuid, req.consultorioId]
    );

    if (canjes.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Canje no encontrado' });
    }

    const canje = canjes[0];

    if (canje.estado !== 'pendiente') {
      await connection.rollback();
      return res.status(400).json({ success: false, message: `Este canje ya está marcado como "${canje.estado}"` });
    }

    await connection.query(`UPDATE canjes_recompensas SET estado = 'cancelado' WHERE id = ?`, [canje.id]);
    await connection.query('UPDATE pacientes SET puntos = puntos + ? WHERE id = ?', [canje.puntos_gastados, canje.paciente_id]);
    if (canje.producto_id) {
      await connection.query('UPDATE inventario SET stock = stock + ? WHERE id = ?', [canje.cantidad, canje.producto_id]);
    }
    await connection.query(
      `INSERT INTO paciente_recompensas_movimientos
       (consultorio_id, paciente_id, tipo, puntos, concepto, referencia_tipo, referencia_id)
       VALUES (?, ?, 'ajuste', ?, 'Canje cancelado, puntos devueltos', 'canje', ?)`,
      [req.consultorioId, canje.paciente_id, canje.puntos_gastados, canje.id]
    );

    await connection.commit();
    res.json({
      success: true,
      message: canje.producto_id
        ? 'Canje cancelado. Se devolvieron los puntos y el stock.'
        : 'Canje cancelado. Se devolvieron los puntos.'
    });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});

module.exports = {
  getCanjes,
  entregarCanje,
  cancelarCanje
};
