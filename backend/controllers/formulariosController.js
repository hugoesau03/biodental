const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');
const { asyncHandler } = require('../middleware');

/**
 * Obtener plantillas de formularios
 * GET /api/formularios
 */
const getFormularios = asyncHandler(async (req, res) => {
  const { categoria, activo } = req.query;

  let query = `
    SELECT uuid, nombre, descripcion, categoria, requiere_firma, activo, fecha_registro
    FROM formularios
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

  const [formularios] = await pool.query(query, params);

  res.json({
    success: true,
    data: { formularios }
  });
});

/**
 * Obtener un formulario por UUID
 * GET /api/formularios/:uuid
 */
const getFormulario = asyncHandler(async (req, res) => {
  const { uuid } = req.params;

  const [formularios] = await pool.query(
    `SELECT * FROM formularios WHERE uuid = ? AND consultorio_id = ?`,
    [uuid, req.consultorioId]
  );

  if (formularios.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Formulario no encontrado'
    });
  }

  // Parsear campos JSON
  const formulario = formularios[0];
  if (typeof formulario.campos === 'string') {
    formulario.campos = JSON.parse(formulario.campos);
  }

  res.json({
    success: true,
    data: formulario
  });
});

/**
 * Crear plantilla de formulario
 * POST /api/formularios
 */
const createFormulario = asyncHandler(async (req, res) => {
  const { nombre, descripcion, campos, categoria, requiere_firma } = req.body;

  if (!nombre || !campos) {
    return res.status(400).json({
      success: false,
      message: 'Nombre y campos son requeridos'
    });
  }

  const formularioUuid = uuidv4();
  const camposJson = typeof campos === 'string' ? campos : JSON.stringify(campos);

  await pool.query(
    `INSERT INTO formularios (consultorio_id, uuid, nombre, descripcion, campos, categoria, requiere_firma)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [req.consultorioId, formularioUuid, nombre, descripcion || null, 
     camposJson, categoria || null, requiere_firma || false]
  );

  res.status(201).json({
    success: true,
    message: 'Formulario creado exitosamente',
    data: { uuid: formularioUuid, nombre }
  });
});

/**
 * Actualizar formulario
 * PUT /api/formularios/:uuid
 */
const updateFormulario = asyncHandler(async (req, res) => {
  const { uuid } = req.params;
  const { nombre, descripcion, campos, categoria, requiere_firma, activo } = req.body;

  const updates = {};
  if (nombre !== undefined) updates.nombre = nombre;
  if (descripcion !== undefined) updates.descripcion = descripcion;
  if (campos !== undefined) updates.campos = typeof campos === 'string' ? campos : JSON.stringify(campos);
  if (categoria !== undefined) updates.categoria = categoria;
  if (requiere_firma !== undefined) updates.requiere_firma = requiere_firma;
  if (activo !== undefined) updates.activo = activo;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No hay campos para actualizar'
    });
  }

  const setClause = Object.keys(updates).map(f => `${f} = ?`).join(', ');
  const values = [...Object.values(updates), uuid, req.consultorioId];

  const [result] = await pool.query(
    `UPDATE formularios SET ${setClause} WHERE uuid = ? AND consultorio_id = ?`,
    values
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({
      success: false,
      message: 'Formulario no encontrado'
    });
  }

  res.json({
    success: true,
    message: 'Formulario actualizado exitosamente'
  });
});

/**
 * Eliminar formulario
 * DELETE /api/formularios/:uuid
 */
const deleteFormulario = asyncHandler(async (req, res) => {
  const { uuid } = req.params;

  const [result] = await pool.query(
    'UPDATE formularios SET activo = FALSE WHERE uuid = ? AND consultorio_id = ?',
    [uuid, req.consultorioId]
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({
      success: false,
      message: 'Formulario no encontrado'
    });
  }

  res.json({
    success: true,
    message: 'Formulario eliminado'
  });
});

/**
 * Obtener formularios completados de un paciente
 * GET /api/formularios/completados/:paciente_uuid
 * GET /api/formularios/completados?paciente_uuid=xxx
 */
const getFormulariosCompletados = asyncHandler(async (req, res) => {
  const paciente_uuid = req.params.paciente_uuid || req.query.paciente_uuid;

  if (!paciente_uuid) {
    return res.status(400).json({
      success: false,
      message: 'Se requiere el UUID del paciente'
    });
  }

  const [completados] = await pool.query(
    `SELECT fc.id, fc.datos, fc.firma_url, fc.fecha_completado,
            f.uuid as formulario_uuid, f.nombre as formulario_nombre, f.campos as formulario_campos,
            u.nombre as completado_por_nombre, u.apellidos as completado_por_apellidos
     FROM formularios_completados fc
     JOIN formularios f ON fc.formulario_id = f.id
     JOIN pacientes p ON fc.paciente_id = p.id
     LEFT JOIN usuarios u ON fc.completado_por = u.id
     WHERE p.uuid = ? AND f.consultorio_id = ?
     ORDER BY fc.fecha_completado DESC`,
    [paciente_uuid, req.consultorioId]
  );

  // Parsear datos JSON
  for (const fc of completados) {
    if (typeof fc.datos === 'string') {
      fc.datos = JSON.parse(fc.datos);
    }
    if (typeof fc.formulario_campos === 'string') {
      fc.formulario_campos = JSON.parse(fc.formulario_campos);
    }
  }

  res.json({
    success: true,
    data: { formularios_completados: completados }
  });
});

/**
 * Guardar formulario completado
 * POST /api/formularios/completados
 */
const completarFormulario = asyncHandler(async (req, res) => {
  const { formulario_id, paciente_id, respuestas, cita_uuid, firma_url } = req.body;

  // Soportar tanto formulario_id (uuid) como los campos antiguos
  const formUuid = formulario_id;
  const pacienteUuid = paciente_id;
  const datos = respuestas;

  if (!formUuid || !pacienteUuid || !datos) {
    return res.status(400).json({
      success: false,
      message: 'Formulario, paciente y datos son requeridos'
    });
  }

  // Obtener IDs
  const [formularios] = await pool.query(
    'SELECT id FROM formularios WHERE uuid = ? AND consultorio_id = ?',
    [formUuid, req.consultorioId]
  );

  const [pacientes] = await pool.query(
    'SELECT id FROM pacientes WHERE uuid = ? AND consultorio_id = ?',
    [pacienteUuid, req.consultorioId]
  );

  if (formularios.length === 0) {
    return res.status(404).json({ success: false, message: 'Formulario no encontrado' });
  }

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

  const datosJson = typeof datos === 'string' ? datos : JSON.stringify(datos);

  // Verificar si ya existe un formulario completado para este paciente y formulario
  const [existing] = await pool.query(
    'SELECT id FROM formularios_completados WHERE formulario_id = ? AND paciente_id = ?',
    [formularios[0].id, pacientes[0].id]
  );

  let result;
  if (existing.length > 0) {
    // Actualizar el existente
    [result] = await pool.query(
      `UPDATE formularios_completados 
       SET datos = ?, firma_url = ?, completado_por = ?, fecha_completado = NOW()
       WHERE id = ?`,
      [datosJson, firma_url || null, req.user.id, existing[0].id]
    );
    res.status(200).json({
      success: true,
      message: 'Formulario actualizado exitosamente',
      data: { id: existing[0].id }
    });
  } else {
    // Crear nuevo
    [result] = await pool.query(
      `INSERT INTO formularios_completados (formulario_id, paciente_id, cita_id, datos, firma_url, completado_por)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [formularios[0].id, pacientes[0].id, citaId, datosJson, firma_url || null, req.user.id]
    );
    res.status(201).json({
      success: true,
      message: 'Formulario guardado exitosamente',
      data: { id: result.insertId }
    });
  }
});

/**
 * Eliminar formulario completado de un paciente
 * DELETE /api/formularios/completados/:id
 */
const deleteFormularioCompletado = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verificar que el formulario completado pertenece al consultorio
  const [existing] = await pool.query(
    `SELECT fc.id 
     FROM formularios_completados fc
     JOIN formularios f ON fc.formulario_id = f.id
     WHERE fc.id = ? AND f.consultorio_id = ?`,
    [id, req.consultorioId]
  );

  if (existing.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Formulario completado no encontrado'
    });
  }

  await pool.query('DELETE FROM formularios_completados WHERE id = ?', [id]);

  res.json({
    success: true,
    message: 'Formulario eliminado exitosamente'
  });
});

module.exports = {
  getFormularios,
  getFormulario,
  createFormulario,
  updateFormulario,
  deleteFormulario,
  getFormulariosCompletados,
  completarFormulario,
  deleteFormularioCompletado
};
