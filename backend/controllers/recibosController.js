const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');
const { asyncHandler } = require('../middleware');

/**
 * Obtener recibos del consultorio
 * GET /api/recibos
 */
const getRecibos = asyncHandler(async (req, res) => {
  const { estado, paciente_uuid, desde, hasta, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let query = `
    SELECT r.uuid, r.numero_recibo, r.subtotal, r.descuento, r.impuestos, r.total,
           r.metodo_pago, r.estado, r.notas, r.fecha_emision, r.fecha_pago,
           p.uuid as paciente_uuid, p.nombre as paciente_nombre, p.apellidos as paciente_apellidos,
           c.uuid as cita_uuid, c.fecha as cita_fecha
    FROM recibos r
    JOIN pacientes p ON r.paciente_id = p.id
    LEFT JOIN citas c ON r.cita_id = c.id
    WHERE r.consultorio_id = ?
  `;
  const params = [req.consultorioId];

  if (estado) {
    query += ` AND r.estado = ?`;
    params.push(estado);
  }

  if (paciente_uuid) {
    query += ` AND p.uuid = ?`;
    params.push(paciente_uuid);
  }

  if (desde && hasta) {
    query += ` AND DATE(r.fecha_emision) BETWEEN ? AND ?`;
    params.push(desde, hasta);
  } else if (desde) {
    query += ` AND DATE(r.fecha_emision) >= ?`;
    params.push(desde);
  } else if (hasta) {
    query += ` AND DATE(r.fecha_emision) <= ?`;
    params.push(hasta);
  }

  // Contar total con query separada
  let countQuery = `
    SELECT COUNT(*) as total
    FROM recibos r
    JOIN pacientes p ON r.paciente_id = p.id
    LEFT JOIN citas c ON r.cita_id = c.id
    WHERE r.consultorio_id = ?
  `;
  const countParams = [req.consultorioId];

  if (estado) {
    countQuery += ` AND r.estado = ?`;
    countParams.push(estado);
  }

  if (paciente_uuid) {
    countQuery += ` AND p.uuid = ?`;
    countParams.push(paciente_uuid);
  }

  if (desde && hasta) {
    countQuery += ` AND DATE(r.fecha_emision) BETWEEN ? AND ?`;
    countParams.push(desde, hasta);
  } else if (desde) {
    countQuery += ` AND DATE(r.fecha_emision) >= ?`;
    countParams.push(desde);
  } else if (hasta) {
    countQuery += ` AND DATE(r.fecha_emision) <= ?`;
    countParams.push(hasta);
  }

  const [countResult] = await pool.query(countQuery, countParams);
  const total = countResult[0].total;

  query += ` ORDER BY r.fecha_emision DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);

  const [recibos] = await pool.query(query, params);

  // Obtener items para cada recibo
  const recibosConItems = await Promise.all(recibos.map(async (recibo) => {
    const [items] = await pool.query(
      `SELECT ri.id, ri.tipo, ri.producto_id, ri.descripcion, ri.cantidad, ri.precio_unitario, ri.total,
              i.uuid as producto_uuid, i.nombre as producto_nombre
       FROM recibo_items ri
       LEFT JOIN inventario i ON ri.producto_id = i.id
       WHERE ri.recibo_id = (SELECT id FROM recibos WHERE uuid = ?)`,
      [recibo.uuid]
    );
    return { ...recibo, items };
  }));

  res.json({
    success: true,
    data: {
      recibos: recibosConItems,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

/**
 * Obtener un recibo por UUID
 * GET /api/recibos/:uuid
 */
const getRecibo = asyncHandler(async (req, res) => {
  const { uuid } = req.params;

  const [recibos] = await pool.query(
    `SELECT r.*, 
            p.uuid as paciente_uuid, p.nombre as paciente_nombre, 
            p.apellidos as paciente_apellidos, p.email as paciente_email,
            p.telefono as paciente_telefono, p.direccion as paciente_direccion,
            c.uuid as cita_uuid, c.fecha as cita_fecha
     FROM recibos r
     JOIN pacientes p ON r.paciente_id = p.id
     LEFT JOIN citas c ON r.cita_id = c.id
     WHERE r.uuid = ? AND r.consultorio_id = ?`,
    [uuid, req.consultorioId]
  );

  if (recibos.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Recibo no encontrado'
    });
  }

  // Obtener items del recibo
  const [items] = await pool.query(
    `SELECT tipo, descripcion, cantidad, precio_unitario, total
     FROM recibo_items
     WHERE recibo_id = (SELECT id FROM recibos WHERE uuid = ?)`,
    [uuid]
  );

  // Obtener info del consultorio
  const [consultorio] = await pool.query(
    `SELECT nombre, email, telefono, direccion, ciudad, logo_url
     FROM consultorios WHERE id = ?`,
    [req.consultorioId]
  );

  res.json({
    success: true,
    data: {
      ...recibos[0],
      items,
      consultorio: consultorio[0]
    }
  });
});

/**
 * Obtener recibo por UUID de cita
 * GET /api/recibos/cita/:citaUuid
 */
const getReciboByCita = asyncHandler(async (req, res) => {
  const { citaUuid } = req.params;

  // Primero obtener el id de la cita
  const [citas] = await pool.query(
    'SELECT id FROM citas WHERE uuid = ? AND consultorio_id = ?',
    [citaUuid, req.consultorioId]
  );

  if (citas.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Cita no encontrada'
    });
  }

  const [recibos] = await pool.query(
    `SELECT r.*, 
            p.uuid as paciente_uuid, p.nombre as paciente_nombre, 
            p.apellidos as paciente_apellidos, p.email as paciente_email,
            p.telefono as paciente_telefono, p.direccion as paciente_direccion,
            c.uuid as cita_uuid, c.fecha as cita_fecha
     FROM recibos r
     JOIN pacientes p ON r.paciente_id = p.id
     LEFT JOIN citas c ON r.cita_id = c.id
     WHERE r.cita_id = ? AND r.consultorio_id = ?`,
    [citas[0].id, req.consultorioId]
  );

  if (recibos.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'No existe recibo para esta cita'
    });
  }

  // Obtener items del recibo
  const [items] = await pool.query(
    `SELECT ri.id, ri.tipo, ri.producto_id, ri.descripcion, ri.cantidad, ri.precio_unitario, ri.total,
            i.uuid as producto_uuid, i.nombre as producto_nombre
     FROM recibo_items ri
     LEFT JOIN inventario i ON ri.producto_id = i.id
     WHERE ri.recibo_id = ?`,
    [recibos[0].id]
  );

  // Obtener info del consultorio
  const [consultorio] = await pool.query(
    `SELECT nombre, email, telefono, direccion, ciudad, logo_url
     FROM consultorios WHERE id = ?`,
    [req.consultorioId]
  );

  res.json({
    success: true,
    data: {
      ...recibos[0],
      items,
      consultorio: consultorio[0]
    }
  });
});

/**
 * Crear recibo
 * POST /api/recibos
 */
const createRecibo = asyncHandler(async (req, res) => {
  const {
    paciente_uuid, cita_uuid, items, descuento = 0,
    metodo_pago, notas
  } = req.body;

  if (!paciente_uuid || !items || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Paciente e items son requeridos'
    });
  }

  // Obtener paciente
  const [pacientes] = await pool.query(
    'SELECT id FROM pacientes WHERE uuid = ? AND consultorio_id = ?',
    [paciente_uuid, req.consultorioId]
  );

  if (pacientes.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Paciente no encontrado'
    });
  }

  // Obtener cita si se proporciona
  let citaId = null;
  if (cita_uuid) {
    const [citas] = await pool.query(
      'SELECT id FROM citas WHERE uuid = ? AND consultorio_id = ?',
      [cita_uuid, req.consultorioId]
    );
    if (citas.length > 0) {
      citaId = citas[0].id;
    }
  }

  // Generar número de recibo
  const year = new Date().getFullYear();
  const [lastRecibo] = await pool.query(
    `SELECT numero_recibo FROM recibos 
     WHERE consultorio_id = ? AND numero_recibo LIKE ?
     ORDER BY id DESC LIMIT 1`,
    [req.consultorioId, `REC-${year}-%`]
  );

  let numeroRecibo;
  if (lastRecibo.length > 0) {
    const lastNum = parseInt(lastRecibo[0].numero_recibo.split('-')[2]) || 0;
    numeroRecibo = `REC-${year}-${String(lastNum + 1).padStart(5, '0')}`;
  } else {
    numeroRecibo = `REC-${year}-00001`;
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Calcular totales
    let subtotal = 0;
    for (const item of items) {
      subtotal += (item.precio_unitario || 0) * (item.cantidad || 1);
    }
    const total = subtotal - descuento;

    const reciboUuid = uuidv4();

    const [result] = await connection.query(
      `INSERT INTO recibos (consultorio_id, uuid, numero_recibo, cita_id, paciente_id,
                            subtotal, descuento, total, metodo_pago, notas)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.consultorioId, reciboUuid, numeroRecibo, citaId, pacientes[0].id,
       subtotal, descuento, total, metodo_pago || 'efectivo', notas || null]
    );

    const reciboId = result.insertId;

    // Insertar items
    for (const item of items) {
      const itemTotal = (item.precio_unitario || 0) * (item.cantidad || 1);
      
      // Obtener producto_id si es un producto
      let productoId = null;
      if (item.tipo === 'producto' && item.producto_uuid) {
        const [productos] = await connection.query(
          'SELECT id FROM inventario WHERE uuid = ? AND consultorio_id = ?',
          [item.producto_uuid, req.consultorioId]
        );
        if (productos.length > 0) {
          productoId = productos[0].id;
        }
      }

      // Obtener servicio_id si es un tratamiento del catálogo (usado luego
      // para calcular los puntos de recompensa por tratamiento al pagarse)
      let servicioId = null;
      if (item.tipo !== 'producto' && item.servicio_uuid) {
        const [serviciosMatch] = await connection.query(
          'SELECT id FROM servicios WHERE uuid = ? AND consultorio_id = ?',
          [item.servicio_uuid, req.consultorioId]
        );
        if (serviciosMatch.length > 0) {
          servicioId = serviciosMatch[0].id;
        }
      }

      await connection.query(
        `INSERT INTO recibo_items (recibo_id, tipo, producto_id, servicio_id, descripcion, cantidad, precio_unitario, total)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [reciboId, item.tipo || 'servicio', productoId, servicioId, item.descripcion,
         item.cantidad || 1, item.precio_unitario || 0, itemTotal]
      );
      
      // Nota: El stock se descuenta al registrar el pago, no al crear el recibo
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Recibo creado exitosamente',
      data: {
        uuid: reciboUuid,
        numero_recibo: numeroRecibo,
        total
      }
    });

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});

/**
 * Marcar recibo como pagado
 * PUT /api/recibos/:uuid/pagar
 */
const pagarRecibo = asyncHandler(async (req, res) => {
  const { uuid } = req.params;
  const { metodo_pago } = req.body;

  const [result] = await pool.query(
    `UPDATE recibos SET estado = 'pagado', fecha_pago = NOW(), metodo_pago = COALESCE(?, metodo_pago)
     WHERE uuid = ? AND consultorio_id = ?`,
    [metodo_pago, uuid, req.consultorioId]
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({
      success: false,
      message: 'Recibo no encontrado'
    });
  }

  res.json({
    success: true,
    message: 'Recibo marcado como pagado'
  });
});

/**
 * Cancelar recibo
 * DELETE /api/recibos/:uuid
 */
const cancelarRecibo = asyncHandler(async (req, res) => {
  const { uuid } = req.params;

  const [result] = await pool.query(
    `UPDATE recibos SET estado = 'cancelado' WHERE uuid = ? AND consultorio_id = ?`,
    [uuid, req.consultorioId]
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({
      success: false,
      message: 'Recibo no encontrado'
    });
  }

  res.json({
    success: true,
    message: 'Recibo cancelado'
  });
});

module.exports = {
  getRecibos,
  getRecibo,
  getReciboByCita,
  createRecibo,
  pagarRecibo,
  cancelarRecibo
};
