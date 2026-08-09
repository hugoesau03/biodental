const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');
const { asyncHandler } = require('../middleware');

/**
 * Obtener todos los servicios del consultorio
 * GET /api/servicios
 */
const getServicios = asyncHandler(async (req, res) => {
  const { categoria, activo } = req.query;

  let query = `
    SELECT uuid, nombre, descripcion, duracion_minutos, precio, color, categoria, puntos_recompensa, activo
    FROM servicios
    WHERE consultorio_id = ?
  `;
  const params = [req.consultorioId];

  if (categoria) {
    query += ` AND categoria = ?`;
    params.push(categoria);
  }

  if (activo !== undefined) {
    query += ` AND activo = ?`;
    params.push(activo === 'true');
  }

  query += ` ORDER BY nombre`;

  const [servicios] = await pool.query(query, params);

  res.json({
    success: true,
    data: { servicios }
  });
});

/**
 * Crear nuevo servicio
 * POST /api/servicios
 */
const createServicio = asyncHandler(async (req, res) => {
  const { nombre, descripcion, duracion_minutos, precio, color, categoria, puntos_recompensa } = req.body;

  if (!nombre) {
    return res.status(400).json({
      success: false,
      message: 'El nombre es requerido'
    });
  }

  const puntosNum = parseInt(puntos_recompensa, 10);

  const servicioUuid = uuidv4();

  await pool.query(
    `INSERT INTO servicios (consultorio_id, uuid, nombre, descripcion, duracion_minutos, precio, color, categoria, puntos_recompensa)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [req.consultorioId, servicioUuid, nombre, descripcion || null,
     duracion_minutos || 30, precio || 0, color || '#4F46E5', categoria || null,
     isNaN(puntosNum) || puntosNum < 0 ? 0 : puntosNum]
  );

  res.status(201).json({
    success: true,
    message: 'Servicio creado exitosamente',
    data: { uuid: servicioUuid, nombre }
  });
});

/**
 * Actualizar servicio
 * PUT /api/servicios/:uuid
 */
const updateServicio = asyncHandler(async (req, res) => {
  const { uuid } = req.params;
  const updates = req.body;

  const allowedFields = ['nombre', 'descripcion', 'duracion_minutos', 'precio', 'color', 'categoria', 'puntos_recompensa', 'activo'];
  const fieldsToUpdate = {};

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      fieldsToUpdate[field] = updates[field];
    }
  }

  if (fieldsToUpdate.puntos_recompensa !== undefined) {
    const puntosNum = parseInt(fieldsToUpdate.puntos_recompensa, 10);
    fieldsToUpdate.puntos_recompensa = isNaN(puntosNum) || puntosNum < 0 ? 0 : puntosNum;
  }

  if (Object.keys(fieldsToUpdate).length === 0) {
    return res.status(400).json({ success: false, message: 'No hay campos para actualizar' });
  }

  const setClause = Object.keys(fieldsToUpdate).map(f => `${f} = ?`).join(', ');
  const values = [...Object.values(fieldsToUpdate), uuid, req.consultorioId];

  const [result] = await pool.query(
    `UPDATE servicios SET ${setClause} WHERE uuid = ? AND consultorio_id = ?`,
    values
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({ success: false, message: 'Servicio no encontrado' });
  }

  res.json({ success: true, message: 'Servicio actualizado exitosamente' });
});

/**
 * Eliminar servicio
 * DELETE /api/servicios/:uuid
 */
const deleteServicio = asyncHandler(async (req, res) => {
  const { uuid } = req.params;

  const [result] = await pool.query(
    'UPDATE servicios SET activo = FALSE WHERE uuid = ? AND consultorio_id = ?',
    [uuid, req.consultorioId]
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({ success: false, message: 'Servicio no encontrado' });
  }

  res.json({ success: true, message: 'Servicio eliminado exitosamente' });
});

/**
 * Obtener servicios de un doctor específico
 * GET /api/servicios/doctor/:doctor_uuid
 */
const getServiciosDoctor = asyncHandler(async (req, res) => {
  const { doctor_uuid } = req.params;

  // Obtener doctor ID
  const [doctores] = await pool.query(
    'SELECT id FROM usuarios WHERE uuid = ? AND consultorio_id = ?',
    [doctor_uuid, req.consultorioId]
  );

  if (doctores.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Doctor no encontrado'
    });
  }

  const doctorId = doctores[0].id;

  const [servicios] = await pool.query(
    `SELECT s.id, s.uuid, s.nombre, s.descripcion, s.duracion_minutos,
            COALESCE(ds.precio_personalizado, s.precio) as precio,
            s.color, s.categoria, s.puntos_recompensa, ds.activo
     FROM doctor_servicios ds
     JOIN servicios s ON ds.servicio_id = s.id
     WHERE ds.doctor_id = ? AND ds.activo = TRUE AND s.activo = TRUE
     ORDER BY s.nombre`,
    [doctorId]
  );

  res.json({
    success: true,
    data: { servicios }
  });
});

/**
 * Asignar servicios a un doctor
 * POST /api/servicios/doctor/:doctor_uuid
 * Body: { servicios: [{ uuid, precio_personalizado? }] }
 */
const setServiciosDoctor = asyncHandler(async (req, res) => {
  const { doctor_uuid } = req.params;
  const { servicios } = req.body;

  if (!servicios || !Array.isArray(servicios)) {
    return res.status(400).json({
      success: false,
      message: 'Se requiere un array de servicios'
    });
  }

  // Obtener doctor ID
  const [doctores] = await pool.query(
    'SELECT id FROM usuarios WHERE uuid = ? AND consultorio_id = ?',
    [doctor_uuid, req.consultorioId]
  );

  if (doctores.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Doctor no encontrado'
    });
  }

  const doctorId = doctores[0].id;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Desactivar todos los servicios actuales del doctor
    await connection.query(
      'UPDATE doctor_servicios SET activo = FALSE WHERE doctor_id = ?',
      [doctorId]
    );

    // Insertar o actualizar servicios
    for (const servicio of servicios) {
      // Obtener servicio ID
      const [servRows] = await connection.query(
        'SELECT id FROM servicios WHERE uuid = ? AND consultorio_id = ?',
        [servicio.uuid, req.consultorioId]
      );

      if (servRows.length > 0) {
        const servicioId = servRows[0].id;
        await connection.query(
          `INSERT INTO doctor_servicios (doctor_id, servicio_id, precio_personalizado, activo)
           VALUES (?, ?, ?, TRUE)
           ON DUPLICATE KEY UPDATE precio_personalizado = VALUES(precio_personalizado), activo = TRUE`,
          [doctorId, servicioId, servicio.precio_personalizado || null]
        );
      }
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'Servicios del doctor actualizados exitosamente'
    });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});

/**
 * Agregar un servicio a un doctor
 * POST /api/servicios/doctor/:doctor_uuid/agregar/:servicio_uuid
 */
const agregarServicioDoctor = asyncHandler(async (req, res) => {
  const { doctor_uuid, servicio_uuid } = req.params;
  const { precio_personalizado } = req.body;

  // Obtener doctor ID
  const [doctores] = await pool.query(
    'SELECT id FROM usuarios WHERE uuid = ? AND consultorio_id = ?',
    [doctor_uuid, req.consultorioId]
  );

  if (doctores.length === 0) {
    return res.status(404).json({ success: false, message: 'Doctor no encontrado' });
  }

  // Obtener servicio ID
  const [serviciosRows] = await pool.query(
    'SELECT id FROM servicios WHERE uuid = ? AND consultorio_id = ?',
    [servicio_uuid, req.consultorioId]
  );

  if (serviciosRows.length === 0) {
    return res.status(404).json({ success: false, message: 'Servicio no encontrado' });
  }

  await pool.query(
    `INSERT INTO doctor_servicios (doctor_id, servicio_id, precio_personalizado, activo)
     VALUES (?, ?, ?, TRUE)
     ON DUPLICATE KEY UPDATE activo = TRUE, precio_personalizado = VALUES(precio_personalizado)`,
    [doctores[0].id, serviciosRows[0].id, precio_personalizado || null]
  );

  res.json({ success: true, message: 'Servicio agregado al doctor' });
});

/**
 * Quitar un servicio de un doctor
 * DELETE /api/servicios/doctor/:doctor_uuid/quitar/:servicio_uuid
 */
const quitarServicioDoctor = asyncHandler(async (req, res) => {
  const { doctor_uuid, servicio_uuid } = req.params;

  // Obtener doctor ID
  const [doctores] = await pool.query(
    'SELECT id FROM usuarios WHERE uuid = ? AND consultorio_id = ?',
    [doctor_uuid, req.consultorioId]
  );

  if (doctores.length === 0) {
    return res.status(404).json({ success: false, message: 'Doctor no encontrado' });
  }

  // Obtener servicio ID
  const [serviciosRows] = await pool.query(
    'SELECT id FROM servicios WHERE uuid = ? AND consultorio_id = ?',
    [servicio_uuid, req.consultorioId]
  );

  if (serviciosRows.length === 0) {
    return res.status(404).json({ success: false, message: 'Servicio no encontrado' });
  }

  await pool.query(
    'UPDATE doctor_servicios SET activo = FALSE WHERE doctor_id = ? AND servicio_id = ?',
    [doctores[0].id, serviciosRows[0].id]
  );

  res.json({ success: true, message: 'Servicio quitado del doctor' });
});

module.exports = {
  getServicios,
  createServicio,
  updateServicio,
  deleteServicio,
  getServiciosDoctor,
  setServiciosDoctor,
  agregarServicioDoctor,
  quitarServicioDoctor
};
