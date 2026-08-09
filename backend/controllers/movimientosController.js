const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');
const { asyncHandler } = require('../middleware');

/**
 * Registrar un movimiento externo
 * POST /api/movimientos-externos
 */
const registrarMovimiento = asyncHandler(async (req, res) => {
  const { 
    tipo, 
    concepto, 
    descripcion, 
    monto, 
    metodo_pago, 
    referencia,
    categoria,
    fecha_movimiento
  } = req.body;

  // Validaciones
  if (!tipo || !concepto || monto === undefined || monto === null) {
    return res.status(400).json({
      success: false,
      message: 'Tipo, concepto y monto son requeridos'
    });
  }

  if (!['ingreso', 'egreso'].includes(tipo)) {
    return res.status(400).json({
      success: false,
      message: 'Tipo debe ser "ingreso" o "egreso"'
    });
  }

  const montoNum = parseFloat(monto);
  if (isNaN(montoNum) || montoNum <= 0) {
    return res.status(400).json({
      success: false,
      message: 'El monto debe ser un número mayor a cero'
    });
  }

  const movimientoUuid = uuidv4();
  
  // Formatear fecha para MySQL (YYYY-MM-DD HH:MM:SS)
  let fechaMov;
  if (fecha_movimiento) {
    // Si viene una fecha, usarla directamente (ya debe venir en formato local del frontend)
    // Si viene con T o Z, convertirla
    if (fecha_movimiento.includes('T') || fecha_movimiento.includes('Z')) {
      const date = new Date(fecha_movimiento);
      fechaMov = date.toISOString().slice(0, 19).replace('T', ' ');
    } else {
      // Ya viene en formato correcto
      fechaMov = fecha_movimiento;
    }
  } else {
    // Si no viene fecha, usar NOW() de MySQL que usa la zona horaria del servidor
    fechaMov = null; // Lo dejamos en null y usaremos DEFAULT en la query
  }

  await pool.query(
    `INSERT INTO movimientos_externos 
     (consultorio_id, uuid, tipo, concepto, descripcion, monto, metodo_pago, referencia, categoria, registrado_por${fechaMov ? ', fecha_movimiento' : ''})
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?${fechaMov ? ', ?' : ''})`,
    [
      req.consultorioId, 
      movimientoUuid, 
      tipo, 
      concepto, 
      descripcion || null,
      montoNum,
      metodo_pago || 'efectivo',
      referencia || null,
      categoria || null,
      req.userId || null,
      ...(fechaMov ? [fechaMov] : [])
    ]
  );

  // Obtener el registro recién insertado para devolver la fecha exacta
  const [movimiento] = await pool.query(
    'SELECT fecha_movimiento FROM movimientos_externos WHERE uuid = ?',
    [movimientoUuid]
  );

  res.status(201).json({
    success: true,
    message: 'Movimiento registrado exitosamente',
    data: {
      uuid: movimientoUuid,
      tipo,
      concepto,
      monto,
      fecha_movimiento: movimiento[0]?.fecha_movimiento || fechaMov
    }
  });
});

/**
 * Obtener movimientos externos
 * GET /api/movimientos-externos
 */
const getMovimientos = asyncHandler(async (req, res) => {
  const { desde, hasta, tipo, metodo_pago, page = 1, limit = 100 } = req.query;
  const offset = (page - 1) * limit;

  let query = `
    SELECT me.uuid, me.tipo, me.concepto, me.descripcion, me.monto, me.metodo_pago, 
           me.referencia, me.categoria, me.fecha_movimiento, me.fecha_registro,
           u.nombre as registrado_por_nombre, u.apellidos as registrado_por_apellidos
     FROM movimientos_externos me
     LEFT JOIN usuarios u ON me.registrado_por = u.id
     WHERE me.consultorio_id = ?
  `;
  const params = [req.consultorioId];

  if (desde && hasta) {
    query += ` AND DATE(CONVERT_TZ(me.fecha_movimiento, '+00:00', '-06:00')) >= ? AND DATE(CONVERT_TZ(me.fecha_movimiento, '+00:00', '-06:00')) <= ?`;
    params.push(desde, hasta);
  } else if (desde) {
    query += ` AND DATE(CONVERT_TZ(me.fecha_movimiento, '+00:00', '-06:00')) >= ?`;
    params.push(desde);
  } else if (hasta) {
    query += ` AND DATE(CONVERT_TZ(me.fecha_movimiento, '+00:00', '-06:00')) <= ?`;
    params.push(hasta);
  }

  if (tipo) {
    query += ` AND me.tipo = ?`;
    params.push(tipo);
  }

  if (metodo_pago) {
    query += ` AND me.metodo_pago = ?`;
    params.push(metodo_pago);
  }

  // Contar total
  let countQuery = `
    SELECT COUNT(*) as total
    FROM movimientos_externos me
    WHERE me.consultorio_id = ?
  `;
  const countParams = [req.consultorioId];
  
  if (desde && hasta) {
    countQuery += ` AND DATE(CONVERT_TZ(me.fecha_movimiento, '+00:00', '-06:00')) >= ? AND DATE(CONVERT_TZ(me.fecha_movimiento, '+00:00', '-06:00')) <= ?`;
    countParams.push(desde, hasta);
  } else if (desde) {
    countQuery += ` AND DATE(CONVERT_TZ(me.fecha_movimiento, '+00:00', '-06:00')) >= ?`;
    countParams.push(desde);
  } else if (hasta) {
    countQuery += ` AND DATE(CONVERT_TZ(me.fecha_movimiento, '+00:00', '-06:00')) <= ?`;
    countParams.push(hasta);
  }
  
  if (tipo) {
    countQuery += ` AND me.tipo = ?`;
    countParams.push(tipo);
  }
  
  if (metodo_pago) {
    countQuery += ` AND me.metodo_pago = ?`;
    countParams.push(metodo_pago);
  }
  
  const [countResult] = await pool.query(countQuery, countParams);
  const total = countResult[0]?.total || 0;

  query += ` ORDER BY me.fecha_movimiento DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);

  const [movimientos] = await pool.query(query, params);

  res.json({
    success: true,
    data: {
      movimientos,
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
 * Obtener un movimiento externo por UUID
 * GET /api/movimientos-externos/:uuid
 */
const getMovimiento = asyncHandler(async (req, res) => {
  const { uuid } = req.params;

  const [movimientos] = await pool.query(
    `SELECT me.*, 
            u.nombre as registrado_por_nombre, u.apellidos as registrado_por_apellidos
     FROM movimientos_externos me
     LEFT JOIN usuarios u ON me.registrado_por = u.id
     WHERE me.uuid = ? AND me.consultorio_id = ?`,
    [uuid, req.consultorioId]
  );

  if (movimientos.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Movimiento no encontrado'
    });
  }

  res.json({
    success: true,
    data: { movimiento: movimientos[0] }
  });
});

/**
 * Actualizar un movimiento externo
 * PUT /api/movimientos-externos/:uuid
 */
const actualizarMovimiento = asyncHandler(async (req, res) => {
  const { uuid } = req.params;
  const { 
    tipo, 
    concepto, 
    descripcion, 
    monto, 
    metodo_pago, 
    referencia,
    categoria,
    fecha_movimiento
  } = req.body;

  // Verificar que existe
  const [movimientos] = await pool.query(
    `SELECT id FROM movimientos_externos WHERE uuid = ? AND consultorio_id = ?`,
    [uuid, req.consultorioId]
  );

  if (movimientos.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Movimiento no encontrado'
    });
  }

  const updates = [];
  const params = [];

  if (tipo !== undefined) {
    updates.push('tipo = ?');
    params.push(tipo);
  }
  if (concepto !== undefined) {
    updates.push('concepto = ?');
    params.push(concepto);
  }
  if (descripcion !== undefined) {
    updates.push('descripcion = ?');
    params.push(descripcion);
  }
  if (monto !== undefined) {
    updates.push('monto = ?');
    params.push(monto);
  }
  if (metodo_pago !== undefined) {
    updates.push('metodo_pago = ?');
    params.push(metodo_pago);
  }
  if (referencia !== undefined) {
    updates.push('referencia = ?');
    params.push(referencia);
  }
  if (categoria !== undefined) {
    updates.push('categoria = ?');
    params.push(categoria);
  }
  if (fecha_movimiento !== undefined) {
    updates.push('fecha_movimiento = ?');
    params.push(fecha_movimiento);
  }

  if (updates.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No hay campos para actualizar'
    });
  }

  params.push(uuid, req.consultorioId);

  await pool.query(
    `UPDATE movimientos_externos SET ${updates.join(', ')} WHERE uuid = ? AND consultorio_id = ?`,
    params
  );

  res.json({
    success: true,
    message: 'Movimiento actualizado exitosamente'
  });
});

/**
 * Eliminar un movimiento externo
 * DELETE /api/movimientos-externos/:uuid
 */
const eliminarMovimiento = asyncHandler(async (req, res) => {
  const { uuid } = req.params;

  const [result] = await pool.query(
    `DELETE FROM movimientos_externos WHERE uuid = ? AND consultorio_id = ?`,
    [uuid, req.consultorioId]
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({
      success: false,
      message: 'Movimiento no encontrado'
    });
  }

  res.json({
    success: true,
    message: 'Movimiento eliminado exitosamente'
  });
});

module.exports = {
  registrarMovimiento,
  getMovimientos,
  getMovimiento,
  actualizarMovimiento,
  eliminarMovimiento
};
