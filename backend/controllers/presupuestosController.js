const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');
const { asyncHandler } = require('../middleware');

/**
 * Obtener presupuestos del consultorio (con filtros)
 * GET /api/presupuestos
 */
const getPresupuestos = asyncHandler(async (req, res) => {
  const { paciente_uuid, cita_uuid, estado, search } = req.query;

  let query = `
    SELECT pr.uuid, pr.numero_presupuesto, pr.subtotal, pr.descuento, pr.total,
           pr.validez_dias, pr.estado, pr.notas, pr.fecha_emision,
           p.uuid as paciente_uuid, p.nombre as paciente_nombre, p.apellidos as paciente_apellidos,
           c.uuid as cita_uuid
    FROM presupuestos pr
    JOIN pacientes p ON pr.paciente_id = p.id
    LEFT JOIN citas c ON pr.cita_id = c.id
    WHERE pr.consultorio_id = ?
  `;
  const params = [req.consultorioId];

  if (paciente_uuid) {
    query += ` AND p.uuid = ?`;
    params.push(paciente_uuid);
  }

  if (cita_uuid) {
    query += ` AND c.uuid = ?`;
    params.push(cita_uuid);
  }

  if (estado) {
    query += ` AND pr.estado = ?`;
    params.push(estado);
  }

  if (search) {
    query += ` AND (p.nombre LIKE ? OR p.apellidos LIKE ? OR pr.numero_presupuesto LIKE ?)`;
    const like = `%${search}%`;
    params.push(like, like, like);
  }

  query += ` ORDER BY pr.fecha_emision DESC`;

  const [presupuestos] = await pool.query(query, params);

  res.json({ success: true, data: { presupuestos } });
});

/**
 * Obtener un presupuesto con sus items
 * GET /api/presupuestos/:uuid
 */
const getPresupuesto = asyncHandler(async (req, res) => {
  const { uuid } = req.params;

  const [presupuestos] = await pool.query(
    `SELECT pr.id, pr.uuid, pr.numero_presupuesto, pr.subtotal, pr.descuento, pr.total,
            pr.validez_dias, pr.estado, pr.notas, pr.fecha_emision,
            p.uuid as paciente_uuid, p.nombre as paciente_nombre, p.apellidos as paciente_apellidos,
            p.telefono as paciente_telefono,
            c.uuid as cita_uuid,
            co.nombre as consultorio_nombre, co.direccion as consultorio_direccion, co.telefono as consultorio_telefono
     FROM presupuestos pr
     JOIN pacientes p ON pr.paciente_id = p.id
     JOIN consultorios co ON pr.consultorio_id = co.id
     LEFT JOIN citas c ON pr.cita_id = c.id
     WHERE pr.uuid = ? AND pr.consultorio_id = ?`,
    [uuid, req.consultorioId]
  );

  if (presupuestos.length === 0) {
    return res.status(404).json({ success: false, message: 'Presupuesto no encontrado' });
  }

  const [items] = await pool.query(
    `SELECT tipo, descripcion, cantidad, precio_unitario, total
     FROM presupuesto_items WHERE presupuesto_id = ?`,
    [presupuestos[0].id]
  );

  res.json({
    success: true,
    data: { ...presupuestos[0], items }
  });
});

/**
 * Obtener el presupuesto de una cita (si existe)
 * GET /api/presupuestos/cita/:citaUuid
 */
const getPresupuestoPorCita = asyncHandler(async (req, res) => {
  const { citaUuid } = req.params;

  const [presupuestos] = await pool.query(
    `SELECT pr.uuid FROM presupuestos pr
     JOIN citas c ON pr.cita_id = c.id
     WHERE c.uuid = ? AND pr.consultorio_id = ?
     ORDER BY pr.fecha_emision DESC LIMIT 1`,
    [citaUuid, req.consultorioId]
  );

  res.json({
    success: true,
    data: { presupuesto: presupuestos[0] || null }
  });
});

/**
 * Crear presupuesto
 * POST /api/presupuestos
 */
const createPresupuesto = asyncHandler(async (req, res) => {
  const { cita_uuid, paciente_uuid, items, descuento, validez_dias, notas } = req.body;

  if (!paciente_uuid || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Paciente y al menos un item (servicio o producto) son requeridos'
    });
  }

  const itemsValidos = items.every(it =>
    it && ['servicio', 'producto'].includes(it.tipo) &&
    typeof it.descripcion === 'string' && it.descripcion.trim().length > 0 &&
    Number(it.precio_unitario) >= 0 && Number(it.cantidad) > 0
  );
  if (!itemsValidos) {
    return res.status(400).json({
      success: false,
      message: 'Cada item debe tener tipo, descripción, cantidad y precio unitario válidos'
    });
  }

  const [pacientes] = await pool.query(
    'SELECT id FROM pacientes WHERE uuid = ? AND consultorio_id = ?',
    [paciente_uuid, req.consultorioId]
  );
  if (pacientes.length === 0) {
    return res.status(404).json({ success: false, message: 'Paciente no encontrado' });
  }

  let citaId = null;
  if (cita_uuid) {
    const [citas] = await pool.query(
      'SELECT id FROM citas WHERE uuid = ? AND consultorio_id = ?',
      [cita_uuid, req.consultorioId]
    );
    if (citas.length > 0) citaId = citas[0].id;
  }

  const descuentoNum = Number(descuento) || 0;
  const subtotal = items.reduce((sum, it) => sum + Number(it.precio_unitario) * Number(it.cantidad), 0);
  const total = Math.max(subtotal - descuentoNum, 0);

  const year = new Date().getFullYear();
  const [ultimo] = await pool.query(
    `SELECT numero_presupuesto FROM presupuestos
     WHERE consultorio_id = ? AND numero_presupuesto LIKE ?
     ORDER BY id DESC LIMIT 1`,
    [req.consultorioId, `PPT-${year}-%`]
  );

  let numeroPresupuesto;
  if (ultimo.length > 0) {
    const lastNum = parseInt(ultimo[0].numero_presupuesto.split('-')[2]) || 0;
    numeroPresupuesto = `PPT-${year}-${String(lastNum + 1).padStart(5, '0')}`;
  } else {
    numeroPresupuesto = `PPT-${year}-00001`;
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const presupuestoUuid = uuidv4();

    const [result] = await connection.query(
      `INSERT INTO presupuestos (consultorio_id, uuid, numero_presupuesto, cita_id, paciente_id,
                                  subtotal, descuento, total, validez_dias, notas)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.consultorioId, presupuestoUuid, numeroPresupuesto, citaId, pacientes[0].id,
       subtotal, descuentoNum, total, validez_dias || 15, notas || null]
    );

    const presupuestoId = result.insertId;

    for (const item of items) {
      const itemTotal = Number(item.precio_unitario) * Number(item.cantidad);
      await connection.query(
        `INSERT INTO presupuesto_items (presupuesto_id, tipo, descripcion, cantidad, precio_unitario, total)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [presupuestoId, item.tipo, item.descripcion, item.cantidad, item.precio_unitario, itemTotal]
      );
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Presupuesto creado exitosamente',
      data: { uuid: presupuestoUuid, numero_presupuesto: numeroPresupuesto, subtotal, descuento: descuentoNum, total }
    });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});

/**
 * Actualizar estado del presupuesto (aceptado/rechazado/vencido)
 * PUT /api/presupuestos/:uuid/estado
 */
const actualizarEstadoPresupuesto = asyncHandler(async (req, res) => {
  const { uuid } = req.params;
  const { estado } = req.body;

  if (!['pendiente', 'aceptado', 'rechazado', 'vencido'].includes(estado)) {
    return res.status(400).json({ success: false, message: 'Estado inválido' });
  }

  const [result] = await pool.query(
    'UPDATE presupuestos SET estado = ? WHERE uuid = ? AND consultorio_id = ?',
    [estado, uuid, req.consultorioId]
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({ success: false, message: 'Presupuesto no encontrado' });
  }

  res.json({ success: true, message: 'Presupuesto actualizado' });
});

/**
 * Actualizar presupuesto (reemplaza los items y recalcula totales)
 * PUT /api/presupuestos/:uuid
 */
const updatePresupuesto = asyncHandler(async (req, res) => {
  const { uuid } = req.params;
  const { items, descuento, validez_dias, notas } = req.body;

  const [existentes] = await pool.query(
    'SELECT id FROM presupuestos WHERE uuid = ? AND consultorio_id = ?',
    [uuid, req.consultorioId]
  );
  if (existentes.length === 0) {
    return res.status(404).json({ success: false, message: 'Presupuesto no encontrado' });
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Se requiere al menos un item (servicio o producto)'
    });
  }

  const itemsValidos = items.every(it =>
    it && ['servicio', 'producto'].includes(it.tipo) &&
    typeof it.descripcion === 'string' && it.descripcion.trim().length > 0 &&
    Number(it.precio_unitario) >= 0 && Number(it.cantidad) > 0
  );
  if (!itemsValidos) {
    return res.status(400).json({
      success: false,
      message: 'Cada item debe tener tipo, descripción, cantidad y precio unitario válidos'
    });
  }

  const presupuestoId = existentes[0].id;
  const descuentoNum = Number(descuento) || 0;
  const subtotal = items.reduce((sum, it) => sum + Number(it.precio_unitario) * Number(it.cantidad), 0);
  const total = Math.max(subtotal - descuentoNum, 0);

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    await connection.query(
      `UPDATE presupuestos SET subtotal = ?, descuento = ?, total = ?, validez_dias = ?, notas = ?
       WHERE id = ?`,
      [subtotal, descuentoNum, total, validez_dias || 15, notas || null, presupuestoId]
    );

    await connection.query('DELETE FROM presupuesto_items WHERE presupuesto_id = ?', [presupuestoId]);

    for (const item of items) {
      const itemTotal = Number(item.precio_unitario) * Number(item.cantidad);
      await connection.query(
        `INSERT INTO presupuesto_items (presupuesto_id, tipo, descripcion, cantidad, precio_unitario, total)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [presupuestoId, item.tipo, item.descripcion, item.cantidad, item.precio_unitario, itemTotal]
      );
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'Presupuesto actualizado exitosamente',
      data: { subtotal, descuento: descuentoNum, total }
    });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});

module.exports = {
  getPresupuestos,
  getPresupuesto,
  getPresupuestoPorCita,
  createPresupuesto,
  updatePresupuesto,
  actualizarEstadoPresupuesto
};
