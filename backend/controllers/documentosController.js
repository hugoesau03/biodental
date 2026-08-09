const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');
const { asyncHandler } = require('../middleware');

/**
 * Obtener documentos de un paciente
 * GET /api/pacientes/:uuid/documentos
 */
const getDocumentos = asyncHandler(async (req, res) => {
  const { uuid } = req.params;

  // Verificar que el paciente existe y pertenece al consultorio
  const [pacientes] = await pool.query(
    'SELECT id FROM pacientes WHERE uuid = ? AND consultorio_id = ?',
    [uuid, req.consultorioId]
  );

  if (pacientes.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Paciente no encontrado'
    });
  }

  const pacienteId = pacientes[0].id;

  const [documentos] = await pool.query(
    `SELECT id, uuid, nombre, tipo_archivo, tamanio, contenido, descripcion, fecha_creacion
     FROM documentos_paciente 
     WHERE paciente_id = ?
     ORDER BY fecha_creacion DESC`,
    [pacienteId]
  );

  res.json({
    success: true,
    data: {
      documentos
    }
  });
});

/**
 * Subir documento a un paciente
 * POST /api/pacientes/:uuid/documentos
 */
const createDocumento = asyncHandler(async (req, res) => {
  const { uuid } = req.params;
  const { nombre, tipo_archivo, tamanio, contenido, descripcion } = req.body;

  if (!nombre || !contenido) {
    return res.status(400).json({
      success: false,
      message: 'Nombre y contenido son requeridos'
    });
  }

  // Verificar que el paciente existe y pertenece al consultorio
  const [pacientes] = await pool.query(
    'SELECT id FROM pacientes WHERE uuid = ? AND consultorio_id = ?',
    [uuid, req.consultorioId]
  );

  if (pacientes.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Paciente no encontrado'
    });
  }

  const pacienteId = pacientes[0].id;
  const documentoUuid = uuidv4();

  const [result] = await pool.query(
    `INSERT INTO documentos_paciente (paciente_id, uuid, nombre, tipo_archivo, tamanio, contenido, descripcion)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [pacienteId, documentoUuid, nombre, tipo_archivo || null, tamanio || null, contenido, descripcion || null]
  );

  res.status(201).json({
    success: true,
    message: 'Documento subido exitosamente',
    data: {
      id: result.insertId,
      uuid: documentoUuid,
      nombre,
      tipo_archivo,
      tamanio
    }
  });
});

/**
 * Eliminar documento
 * DELETE /api/pacientes/:uuid/documentos/:docUuid
 */
const deleteDocumento = asyncHandler(async (req, res) => {
  const { uuid, docUuid } = req.params;

  // Verificar que el paciente existe y pertenece al consultorio
  const [pacientes] = await pool.query(
    'SELECT id FROM pacientes WHERE uuid = ? AND consultorio_id = ?',
    [uuid, req.consultorioId]
  );

  if (pacientes.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Paciente no encontrado'
    });
  }

  const pacienteId = pacientes[0].id;

  const [result] = await pool.query(
    'DELETE FROM documentos_paciente WHERE uuid = ? AND paciente_id = ?',
    [docUuid, pacienteId]
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({
      success: false,
      message: 'Documento no encontrado'
    });
  }

  res.json({
    success: true,
    message: 'Documento eliminado exitosamente'
  });
});

module.exports = {
  getDocumentos,
  createDocumento,
  deleteDocumento
};
