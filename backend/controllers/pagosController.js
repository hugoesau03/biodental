const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');
const { asyncHandler } = require('../middleware');
const { crearNotificacionInterna } = require('./notificacionesController');

// Programa de recompensas del portal de pacientes: puntos otorgados por cada
// peso pagado, acreditados una sola vez cuando un recibo queda totalmente
// pagado (no por abono parcial). 0.05 = 1 punto por cada $20 MXN.
const PUNTOS_POR_PESO = 0.05;

/**
 * Registrar un pago
 * POST /api/pagos
 */
const registrarPago = asyncHandler(async (req, res) => {
  const { 
    recibo_uuid, 
    monto, 
    metodo_pago, 
    referencia, 
    notas,
    es_abono, // Nuevo: indica si es un pago parcial
    items // Array de items con producto_id para descontar stock
  } = req.body;

  // Validaciones
  if (!recibo_uuid || monto === undefined || monto === null || !metodo_pago) {
    return res.status(400).json({
      success: false,
      message: 'Recibo, monto y método de pago son requeridos'
    });
  }

  const montoNum = parseFloat(monto);
  if (isNaN(montoNum) || montoNum <= 0) {
    return res.status(400).json({
      success: false,
      message: 'El monto debe ser un número mayor a cero'
    });
  }

  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    // Obtener el recibo (bloqueado para evitar pagos simultáneos sobre el mismo recibo)
    const [recibos] = await connection.query(
      `SELECT id, estado, total, paciente_id FROM recibos WHERE uuid = ? AND consultorio_id = ? FOR UPDATE`,
      [recibo_uuid, req.consultorioId]
    );

    if (recibos.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Recibo no encontrado'
      });
    }

    const recibo = recibos[0];

    if (recibo.estado === 'pagado') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Este recibo ya ha sido pagado'
      });
    }

    // Calcular total pagado hasta ahora
    const [pagosPrevios] = await connection.query(
      `SELECT COALESCE(SUM(monto), 0) as total_pagado FROM pagos WHERE recibo_id = ?`,
      [recibo.id]
    );
    
    const totalPagado = parseFloat(pagosPrevios[0].total_pagado) + montoNum;
    const pagoCompleto = totalPagado >= parseFloat(recibo.total);

    // Validar que no se pague más del total
    if (totalPagado > parseFloat(recibo.total)) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `El monto excede el total del recibo. Resta por pagar: $${(parseFloat(recibo.total) - parseFloat(pagosPrevios[0].total_pagado)).toFixed(2)}`
      });
    }

    // Registrar el pago
    const pagoUuid = uuidv4();
    await connection.query(
      `INSERT INTO pagos (consultorio_id, uuid, recibo_id, monto, metodo_pago, referencia, notas, registrado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.consultorioId, pagoUuid, recibo.id, montoNum, metodo_pago, referencia || null, notas || null, req.userId || null]
    );

    // Actualizar estado del recibo según si es pago completo o parcial
    if (pagoCompleto) {
      await connection.query(
        `UPDATE recibos SET estado = 'pagado', metodo_pago = ?, fecha_pago = NOW() WHERE id = ?`,
        [metodo_pago, recibo.id]
      );
    } else {
      // Mantener como pendiente si es abono parcial
      await connection.query(
        `UPDATE recibos SET metodo_pago = ? WHERE id = ?`,
        [metodo_pago, recibo.id]
      );
    }

    // Obtener cita_id del recibo para actualizar estado
    const [reciboData] = await connection.query(
      `SELECT cita_id FROM recibos WHERE id = ?`,
      [recibo.id]
    );

    if (reciboData[0]?.cita_id) {
      if (pagoCompleto) {
        // Pago completo: marcar como pagado y completada
        await connection.query(
          `UPDATE citas SET pagado = TRUE, estado = 'completada' WHERE id = ?`,
          [reciboData[0].cita_id]
        );
      } else {
        // Pago parcial: marcar como pendiente_pago
        await connection.query(
          `UPDATE citas SET estado = 'pendiente_pago' WHERE id = ?`,
          [reciboData[0].cita_id]
        );
      }
    }

    // Lista de productos con stock bajo para notificaciones
    const productosStockBajo = [];

    // El stock se descuenta UNA sola vez, cuando el recibo queda completamente pagado.
    // Esto evita descontar dos veces cuando el pago se hace en abonos parciales.
    if (pagoCompleto) {
      // Obtener items del recibo directamente de la base de datos (bloqueando el stock)
      const [reciboItems] = await connection.query(
        `SELECT ri.*, i.uuid as producto_uuid, i.nombre as producto_nombre, i.stock as stock_actual, i.stock_minimo
         FROM recibo_items ri
         LEFT JOIN inventario i ON ri.producto_id = i.id
         WHERE ri.recibo_id = ?
         FOR UPDATE`,
        [recibo.id]
      );

      // Descontar stock de productos
      for (const item of reciboItems) {
        if (item.producto_id && item.cantidad > 0) {
          const stockActual = item.stock_actual || 0;
          const nuevoStock = stockActual - item.cantidad;

          if (nuevoStock < 0) {
            await connection.rollback();
            return res.status(400).json({
              success: false,
              message: `Stock insuficiente para ${item.producto_nombre || item.descripcion}. Disponible: ${stockActual}`
            });
          }

          // Actualizar stock
          await connection.query(
            `UPDATE inventario SET stock = ? WHERE id = ?`,
            [nuevoStock, item.producto_id]
          );

          // Verificar si quedó con stock bajo
          if (item.stock_minimo && nuevoStock <= item.stock_minimo) {
            productosStockBajo.push({
              uuid: item.producto_uuid,
              nombre: item.producto_nombre,
              stock: nuevoStock,
              stock_minimo: item.stock_minimo
            });
          }
        }
      }

      // Acreditar puntos del programa de recompensas (portal de pacientes),
      // solo si el paciente ya activó su acceso (password_hash) — no tiene
      // sentido acumular puntos que nunca podrá ver ni canjear.
      if (recibo.paciente_id) {
        const puntosGanados = Math.floor(parseFloat(recibo.total) * PUNTOS_POR_PESO);
        if (puntosGanados > 0) {
          const [pacienteRows] = await connection.query(
            'SELECT password_hash FROM pacientes WHERE id = ? FOR UPDATE',
            [recibo.paciente_id]
          );

          if (pacienteRows.length > 0 && pacienteRows[0].password_hash) {
            await connection.query(
              'UPDATE pacientes SET puntos = puntos + ? WHERE id = ?',
              [puntosGanados, recibo.paciente_id]
            );
            await connection.query(
              `INSERT INTO paciente_recompensas_movimientos
               (consultorio_id, paciente_id, tipo, puntos, concepto, referencia_tipo, referencia_id)
               VALUES (?, ?, 'acumulado', ?, ?, 'recibo', ?)`,
              [req.consultorioId, recibo.paciente_id, puntosGanados, `Pago de recibo`, recibo.id]
            );
          }
        }
      }
    }

    await connection.commit();

    // Crear notificaciones de stock bajo (después del commit)
    for (const producto of productosStockBajo) {
      try {
        await crearNotificacionInterna(req.consultorioId, {
          tipo: 'inventario',
          titulo: 'Stock bajo',
          mensaje: `El producto "${producto.nombre}" tiene stock bajo (${producto.stock} unidades)`,
          icono: 'alert-triangle',
          color: 'warning',
          enlace: '/inventario',
          referencia_tipo: 'inventario',
          referencia_uuid: producto.uuid
        });
      } catch (notifError) {
        console.error('Error creando notificación de stock bajo:', notifError);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Pago registrado exitosamente',
      data: {
        uuid: pagoUuid,
        monto,
        metodo_pago,
        fecha_pago: new Date().toISOString()
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
 * Obtener pagos de un recibo
 * GET /api/pagos/recibo/:recibo_uuid
 */
const getPagosByRecibo = asyncHandler(async (req, res) => {
  const { recibo_uuid } = req.params;

  const [pagos] = await pool.query(
    `SELECT p.uuid, p.monto, p.metodo_pago, p.referencia, p.notas, p.fecha_pago,
            u.nombre as registrado_por_nombre, u.apellidos as registrado_por_apellidos
     FROM pagos p
     LEFT JOIN usuarios u ON p.registrado_por = u.id
     WHERE p.recibo_id = (SELECT id FROM recibos WHERE uuid = ? AND consultorio_id = ?)
     ORDER BY p.fecha_pago DESC`,
    [recibo_uuid, req.consultorioId]
  );

  res.json({
    success: true,
    data: { pagos }
  });
});

/**
 * Obtener todos los pagos del consultorio
 * GET /api/pagos
 */
const getPagos = asyncHandler(async (req, res) => {
  const { desde, hasta, metodo_pago, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let query = `
    SELECT p.uuid, p.monto, p.metodo_pago, p.referencia, p.notas, p.fecha_pago,
           r.numero_recibo, r.uuid as recibo_uuid, r.id as recibo_id,
           pac.nombre as paciente_nombre, pac.apellidos as paciente_apellidos,
           u.nombre as registrado_por_nombre
     FROM pagos p
     JOIN recibos r ON p.recibo_id = r.id
     JOIN pacientes pac ON r.paciente_id = pac.id
     LEFT JOIN usuarios u ON p.registrado_por = u.id
     WHERE p.consultorio_id = ?
  `;
  const params = [req.consultorioId];

  if (desde && hasta) {
    // Convertir la fecha UTC a zona horaria local de México (UTC-6) para comparar correctamente
    query += ` AND DATE(CONVERT_TZ(p.fecha_pago, '+00:00', '-06:00')) >= ? AND DATE(CONVERT_TZ(p.fecha_pago, '+00:00', '-06:00')) <= ?`;
    params.push(desde, hasta);
  }

  if (metodo_pago) {
    query += ` AND p.metodo_pago = ?`;
    params.push(metodo_pago);
  }

  // Contar total
  let countQuery = `
    SELECT COUNT(*) as total
    FROM pagos p
    JOIN recibos r ON p.recibo_id = r.id
    JOIN pacientes pac ON r.paciente_id = pac.id
    WHERE p.consultorio_id = ?
  `;
  const countParams = [req.consultorioId];
  
  if (desde && hasta) {
    countQuery += ` AND DATE(CONVERT_TZ(p.fecha_pago, '+00:00', '-06:00')) >= ? AND DATE(CONVERT_TZ(p.fecha_pago, '+00:00', '-06:00')) <= ?`;
    countParams.push(desde, hasta);
  }
  
  if (metodo_pago) {
    countQuery += ` AND p.metodo_pago = ?`;
    countParams.push(metodo_pago);
  }
  
  const [countResult] = await pool.query(countQuery, countParams);
  const total = countResult[0]?.total || 0;

  query += ` ORDER BY p.fecha_pago DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);

  const [pagos] = await pool.query(query, params);

  // Obtener items/servicios para cada pago
  const pagosConServicios = await Promise.all(pagos.map(async (pago) => {
    try {
      const [items] = await pool.query(
        `SELECT ri.tipo, ri.descripcion, ri.cantidad, ri.precio_unitario, ri.total
         FROM recibo_items ri
         WHERE ri.recibo_id = ?`,
        [pago.recibo_id]
      );
      return { ...pago, servicios: items || [] };
    } catch (error) {
      console.error(`Error obteniendo items del recibo ${pago.recibo_id}:`, error.message);
      return { ...pago, servicios: [] };
    }
  }));

  res.json({
    success: true,
    data: {
      pagos: pagosConServicios,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

module.exports = {
  registrarPago,
  getPagosByRecibo,
  getPagos
};
