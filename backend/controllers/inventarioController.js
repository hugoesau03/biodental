const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');
const { asyncHandler } = require('../middleware');
const { crearNotificacionInterna } = require('./notificacionesController');

/**
 * Obtener inventario del consultorio
 * GET /api/inventario
 */
const getInventario = asyncHandler(async (req, res) => {
  const { tipo, search, stock_bajo, activo } = req.query;

  let query = `
    SELECT id, uuid, nombre, descripcion, tipo, sku, precio, costo,
           stock, stock_minimo, unidad, proveedor, puntos_precio, activo
    FROM inventario
    WHERE consultorio_id = ?
  `;
  const params = [req.consultorioId];

  if (tipo) {
    query += ` AND tipo = ?`;
    params.push(tipo);
  }

  if (search) {
    query += ` AND (nombre LIKE ? OR sku LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  if (stock_bajo === 'true') {
    query += ` AND stock <= stock_minimo`;
  }

  if (activo !== undefined) {
    query += ` AND activo = ?`;
    params.push(activo === 'true');
  }

  query += ` ORDER BY nombre`;

  const [productos] = await pool.query(query, params);

  // Estadísticas
  const [stats] = await pool.query(
    `SELECT 
       COUNT(*) as total_productos,
       SUM(CASE WHEN stock <= stock_minimo THEN 1 ELSE 0 END) as stock_bajo,
       SUM(stock * costo) as valor_inventario
     FROM inventario
     WHERE consultorio_id = ? AND activo = TRUE`,
    [req.consultorioId]
  );

  res.json({
    success: true,
    data: { 
      productos,
      estadisticas: stats[0]
    }
  });
});

/**
 * Obtener productos con stock bajo
 * GET /api/inventario/alertas
 */
const getAlertasStock = asyncHandler(async (req, res) => {
  const [alertas] = await pool.query(
    `SELECT uuid, nombre, tipo, stock, stock_minimo, unidad
     FROM inventario
     WHERE consultorio_id = ? AND stock <= stock_minimo AND activo = TRUE
     ORDER BY (stock_minimo - stock) DESC`,
    [req.consultorioId]
  );

  res.json({
    success: true,
    data: { alertas }
  });
});

/**
 * Obtener un producto por UUID
 * GET /api/inventario/:uuid
 */
const getProducto = asyncHandler(async (req, res) => {
  const { uuid } = req.params;

  const [productos] = await pool.query(
    `SELECT * FROM inventario WHERE uuid = ? AND consultorio_id = ?`,
    [uuid, req.consultorioId]
  );

  if (productos.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Producto no encontrado'
    });
  }

  res.json({
    success: true,
    data: productos[0]
  });
});

/**
 * Crear producto
 * POST /api/inventario
 */
const createProducto = asyncHandler(async (req, res) => {
  const {
    nombre, descripcion, tipo, sku, precio, costo,
    stock, stock_minimo, unidad, proveedor, puntos_precio
  } = req.body;

  if (!nombre) {
    return res.status(400).json({
      success: false,
      message: 'El nombre es requerido'
    });
  }

  const puntosNum = parseInt(puntos_precio, 10);

  const productoUuid = uuidv4();

  await pool.query(
    `INSERT INTO inventario (consultorio_id, uuid, nombre, descripcion, tipo, sku,
                             precio, costo, stock, stock_minimo, unidad, proveedor, puntos_precio)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [req.consultorioId, productoUuid, nombre, descripcion || null,
     tipo || 'producto', sku || null, precio || 0, costo || 0,
     stock || 0, stock_minimo || 5, unidad || 'pieza', proveedor || null,
     isNaN(puntosNum) || puntosNum < 0 ? 0 : puntosNum]
  );

  res.status(201).json({
    success: true,
    message: 'Producto creado exitosamente',
    data: { uuid: productoUuid, nombre }
  });
});

/**
 * Actualizar producto
 * PUT /api/inventario/:uuid
 */
const updateProducto = asyncHandler(async (req, res) => {
  const { uuid } = req.params;
  const updates = req.body;

  const allowedFields = [
    'nombre', 'descripcion', 'tipo', 'sku', 'precio', 'costo',
    'stock', 'stock_minimo', 'unidad', 'proveedor', 'puntos_precio', 'activo'
  ];

  const fieldsToUpdate = {};
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      fieldsToUpdate[field] = updates[field];
    }
  }

  if (fieldsToUpdate.puntos_precio !== undefined) {
    const puntosNum = parseInt(fieldsToUpdate.puntos_precio, 10);
    fieldsToUpdate.puntos_precio = isNaN(puntosNum) || puntosNum < 0 ? 0 : puntosNum;
  }

  if (Object.keys(fieldsToUpdate).length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No hay campos para actualizar'
    });
  }

  const setClause = Object.keys(fieldsToUpdate).map(f => `${f} = ?`).join(', ');
  const values = [...Object.values(fieldsToUpdate), uuid, req.consultorioId];

  const [result] = await pool.query(
    `UPDATE inventario SET ${setClause} WHERE uuid = ? AND consultorio_id = ?`,
    values
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({
      success: false,
      message: 'Producto no encontrado'
    });
  }

  res.json({
    success: true,
    message: 'Producto actualizado exitosamente'
  });
});

/**
 * Ajustar stock
 * PUT /api/inventario/:uuid/stock
 */
const ajustarStock = asyncHandler(async (req, res) => {
  const { uuid } = req.params;
  const { cantidad, tipo_ajuste, motivo } = req.body;

  if (cantidad === undefined || !tipo_ajuste) {
    return res.status(400).json({
      success: false,
      message: 'Cantidad y tipo de ajuste son requeridos'
    });
  }

  const operador = tipo_ajuste === 'entrada' ? '+' : '-';

  const [result] = await pool.query(
    `UPDATE inventario SET stock = stock ${operador} ? 
     WHERE uuid = ? AND consultorio_id = ?`,
    [Math.abs(cantidad), uuid, req.consultorioId]
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({
      success: false,
      message: 'Producto no encontrado'
    });
  }

  // Verificar si quedó con stock bajo y crear notificación
  if (tipo_ajuste === 'salida') {
    const [producto] = await pool.query(
      'SELECT nombre, stock, stock_minimo FROM inventario WHERE uuid = ? AND consultorio_id = ?',
      [uuid, req.consultorioId]
    );
    
    console.log('Verificando stock bajo:', producto[0]);
    
    if (producto.length > 0 && producto[0].stock <= producto[0].stock_minimo) {
      console.log('Stock bajo detectado, creando notificación...');
      try {
        await crearNotificacionInterna(req.consultorioId, {
          tipo: 'inventario',
          titulo: 'Stock bajo',
          mensaje: `El producto "${producto[0].nombre}" tiene stock bajo (${producto[0].stock} unidades)`,
          icono: 'alert-triangle',
          color: 'warning',
          enlace: '/inventario',
          referencia_tipo: 'inventario',
          referencia_uuid: uuid
        });
        console.log('Notificación de stock bajo creada exitosamente');
      } catch (notifError) {
        console.error('Error creando notificación de stock:', notifError);
      }
    }
  }

  res.json({
    success: true,
    message: `Stock ${tipo_ajuste === 'entrada' ? 'incrementado' : 'decrementado'} exitosamente`
  });
});

/**
 * Eliminar producto
 * DELETE /api/inventario/:uuid
 */
const deleteProducto = asyncHandler(async (req, res) => {
  const { uuid } = req.params;

  const [result] = await pool.query(
    'UPDATE inventario SET activo = FALSE WHERE uuid = ? AND consultorio_id = ?',
    [uuid, req.consultorioId]
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({
      success: false,
      message: 'Producto no encontrado'
    });
  }

  res.json({
    success: true,
    message: 'Producto eliminado exitosamente'
  });
});

module.exports = {
  getInventario,
  getAlertasStock,
  getProducto,
  createProducto,
  updateProducto,
  ajustarStock,
  deleteProducto
};
