const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');
const { asyncHandler } = require('../middleware');
const { crearNotificacionInterna } = require('./notificacionesController');

/**
 * Obtener todos los pacientes del consultorio
 * GET /api/pacientes
 */
const getPacientes = asyncHandler(async (req, res) => {
  const { search, tipo, activo, page = 1, limit = 500 } = req.query;
  const offset = (page - 1) * limit;

  let baseWhere = `WHERE p.consultorio_id = ?`;
  const params = [req.consultorioId];
  const countParams = [req.consultorioId];

  // Filtros
  if (search) {
    baseWhere += ` AND (p.nombre LIKE ? OR p.apellidos LIKE ? OR p.numero_expediente LIKE ? OR p.dni LIKE ?)`;
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    countParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  if (tipo) {
    baseWhere += ` AND p.tipo = ?`;
    params.push(tipo);
    countParams.push(tipo);
  }

  if (activo !== undefined) {
    baseWhere += ` AND p.activo = ?`;
    params.push(activo === 'true');
    countParams.push(activo === 'true');
  }

  // Contar total
  const countQuery = `SELECT COUNT(*) as total FROM pacientes p ${baseWhere}`;
  const [countResult] = await pool.query(countQuery, countParams);
  const total = countResult[0]?.total || 0;

  // Query principal
  let query = `
    SELECT p.uuid, p.numero_expediente, p.nombre, p.apellidos, p.fecha_nacimiento, 
           p.genero, p.tipo, p.email, p.telefono, p.foto_url, p.activo, p.fecha_registro,
           (SELECT MAX(c.fecha) FROM citas c WHERE c.paciente_id = p.id AND c.estado NOT IN ('cancelada')) as ultima_cita
    FROM pacientes p
    ${baseWhere}
    ORDER BY p.nombre, p.apellidos LIMIT ? OFFSET ?
  `;
  params.push(parseInt(limit), offset);

  const [pacientes] = await pool.query(query, params);

  res.json({
    success: true,
    data: {
      pacientes: pacientes || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit) || 0
      }
    }
  });
});

/**
 * Obtener un paciente por UUID
 * GET /api/pacientes/:uuid
 */
const getPaciente = asyncHandler(async (req, res) => {
  const { uuid } = req.params;

  const [pacientes] = await pool.query(
    `SELECT * FROM pacientes WHERE uuid = ? AND consultorio_id = ?`,
    [uuid, req.consultorioId]
  );

  if (pacientes.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Paciente no encontrado'
    });
  }

  // Obtener historial de citas
  const [citas] = await pool.query(
    `SELECT c.uuid, c.fecha, c.hora_inicio, c.estado, c.motivo,
            u.nombre as doctor_nombre, u.apellidos as doctor_apellidos
     FROM citas c
     JOIN usuarios u ON c.doctor_id = u.id
     WHERE c.paciente_id = (SELECT id FROM pacientes WHERE uuid = ?)
     ORDER BY c.fecha DESC, c.hora_inicio DESC
     LIMIT 10`,
    [uuid]
  );

  res.json({
    success: true,
    data: {
      ...pacientes[0],
      historial_citas: citas
    }
  });
});

/**
 * Crear nuevo paciente
 * POST /api/pacientes
 */
const createPaciente = asyncHandler(async (req, res) => {
  const {
    nombre, apellidos, fecha_nacimiento, genero, tipo,
    email, telefono, telefono_emergencia, direccion, ciudad,
    codigo_postal, dni, seguro_medico, numero_seguro,
    grupo_sanguineo, alergias, antecedentes, notas,
    padecimientos, medicamentos, motivo_consulta
  } = req.body;

  if (!nombre) {
    return res.status(400).json({
      success: false,
      message: 'El nombre es requerido'
    });
  }

  // Generar número de expediente
  const [lastPaciente] = await pool.query(
    `SELECT numero_expediente FROM pacientes 
     WHERE consultorio_id = ? 
     ORDER BY id DESC LIMIT 1`,
    [req.consultorioId]
  );

  let numeroExpediente;
  if (lastPaciente.length > 0 && lastPaciente[0].numero_expediente) {
    const lastNum = parseInt(lastPaciente[0].numero_expediente.split('-')[1]) || 0;
    numeroExpediente = `PT-${String(lastNum + 1).padStart(5, '0')}`;
  } else {
    numeroExpediente = 'PT-00001';
  }

  const pacienteUuid = uuidv4();

  const [result] = await pool.query(
    `INSERT INTO pacientes (
      consultorio_id, uuid, numero_expediente, nombre, apellidos,
      fecha_nacimiento, genero, tipo, email, telefono, telefono_emergencia,
      direccion, ciudad, codigo_postal, dni, seguro_medico, numero_seguro,
      grupo_sanguineo, alergias, antecedentes, notas,
      padecimientos, medicamentos, motivo_consulta
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      req.consultorioId, pacienteUuid, numeroExpediente, nombre, apellidos || '',
      fecha_nacimiento || null, genero || 'otro', tipo || 'adulto',
      email || null, telefono || null, telefono_emergencia || null,
      direccion || null, ciudad || null, codigo_postal || null,
      dni || null, seguro_medico || null, numero_seguro || null,
      grupo_sanguineo || null, alergias || null, antecedentes || null, notas || null,
      padecimientos || null, medicamentos || null, motivo_consulta || null
    ]
  );

  res.status(201).json({
    success: true,
    message: 'Paciente creado exitosamente',
    data: {
      uuid: pacienteUuid,
      numero_expediente: numeroExpediente,
      nombre,
      apellidos
    }
  });

  // Crear notificación de nuevo paciente (después del response para no bloquear)
  try {
    await crearNotificacionInterna(req.consultorioId, {
      tipo: 'paciente',
      titulo: 'Nuevo paciente registrado',
      mensaje: `Se registró al paciente ${nombre} ${apellidos || ''} (${numeroExpediente})`,
      icono: 'user-plus',
      color: 'success',
      enlace: `/perfil-paciente/${pacienteUuid}`,
      referencia_tipo: 'paciente',
      referencia_uuid: pacienteUuid
    });
  } catch (notifError) {
    console.error('Error creando notificación:', notifError);
  }
});

/**
 * Actualizar paciente
 * PUT /api/pacientes/:uuid
 */
const updatePaciente = asyncHandler(async (req, res) => {
  const { uuid } = req.params;
  const updates = req.body;

  // Verificar que existe y pertenece al consultorio
  const [existing] = await pool.query(
    'SELECT id FROM pacientes WHERE uuid = ? AND consultorio_id = ?',
    [uuid, req.consultorioId]
  );

  if (existing.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Paciente no encontrado'
    });
  }

  // Campos permitidos para actualizar
  const allowedFields = [
    'nombre', 'apellidos', 'fecha_nacimiento', 'genero', 'tipo',
    'email', 'telefono', 'telefono_emergencia', 'direccion', 'ciudad',
    'codigo_postal', 'dni', 'seguro_medico', 'numero_seguro',
    'grupo_sanguineo', 'alergias', 'antecedentes', 'notas', 'foto_url', 'activo',
    'padecimientos', 'medicamentos', 'motivo_consulta'
  ];

  const fieldsToUpdate = {};
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      fieldsToUpdate[field] = updates[field];
    }
  }

  if (Object.keys(fieldsToUpdate).length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No hay campos para actualizar'
    });
  }

  const setClause = Object.keys(fieldsToUpdate).map(f => `${f} = ?`).join(', ');
  const values = [...Object.values(fieldsToUpdate), uuid, req.consultorioId];

  await pool.query(
    `UPDATE pacientes SET ${setClause} WHERE uuid = ? AND consultorio_id = ?`,
    values
  );

  res.json({
    success: true,
    message: 'Paciente actualizado exitosamente'
  });
});

/**
 * Cambiar estado activo del paciente (activar/desactivar)
 * PATCH /api/pacientes/:uuid/toggle-active
 */
const toggleActivePaciente = asyncHandler(async (req, res) => {
  const { uuid } = req.params;
  const { activo } = req.body;

  if (activo === undefined) {
    return res.status(400).json({
      success: false,
      message: 'El campo activo es requerido'
    });
  }

  const [result] = await pool.query(
    'UPDATE pacientes SET activo = ? WHERE uuid = ? AND consultorio_id = ?',
    [activo, uuid, req.consultorioId]
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({
      success: false,
      message: 'Paciente no encontrado'
    });
  }

  res.json({
    success: true,
    message: `Paciente ${activo ? 'activado' : 'desactivado'} exitosamente`
  });
});

/**
 * Eliminar paciente permanentemente
 * DELETE /api/pacientes/:uuid
 */
const deletePaciente = asyncHandler(async (req, res) => {
  const { uuid } = req.params;

  // Verificar que existe
  const [existing] = await pool.query(
    'SELECT id FROM pacientes WHERE uuid = ? AND consultorio_id = ?',
    [uuid, req.consultorioId]
  );

  if (existing.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Paciente no encontrado'
    });
  }

  // No permitir borrado permanente si el paciente tiene recibos asociados.
  // Los recibos son historial financiero (afectan cortes de caja pasados) y no deben
  // eliminarse en cascada. En ese caso se sugiere desactivar al paciente.
  const [recibos] = await pool.query(
    'SELECT COUNT(*) as total FROM recibos WHERE paciente_id = ?',
    [existing[0].id]
  );

  if (recibos[0].total > 0) {
    return res.status(409).json({
      success: false,
      message: 'No se puede eliminar el paciente porque tiene recibos asociados. Desactívalo para conservar el historial.'
    });
  }

  // Eliminar el paciente (CASCADE eliminará citas, documentos y formularios asociados)
  await pool.query(
    'DELETE FROM pacientes WHERE uuid = ? AND consultorio_id = ?',
    [uuid, req.consultorioId]
  );

  res.json({
    success: true,
    message: 'Paciente eliminado exitosamente'
  });
});

module.exports = {
  getPacientes,
  getPaciente,
  createPaciente,
  updatePaciente,
  toggleActivePaciente,
  deletePaciente
};
