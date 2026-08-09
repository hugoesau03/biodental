const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');
const { asyncHandler } = require('../middleware');

/**
 * Obtener recetas del consultorio (con filtros)
 * GET /api/recetas
 */
const getRecetas = asyncHandler(async (req, res) => {
  const { paciente_uuid, cita_uuid, search } = req.query;

  let query = `
    SELECT r.uuid, r.numero_receta, r.diagnostico, r.medicamentos, r.indicaciones_generales, r.fecha_emision,
           p.uuid as paciente_uuid, p.nombre as paciente_nombre, p.apellidos as paciente_apellidos,
           u.uuid as doctor_uuid, u.nombre as doctor_nombre, u.apellidos as doctor_apellidos, u.numero_licencia,
           c.uuid as cita_uuid
    FROM recetas r
    JOIN pacientes p ON r.paciente_id = p.id
    JOIN usuarios u ON r.doctor_id = u.id
    LEFT JOIN citas c ON r.cita_id = c.id
    WHERE r.consultorio_id = ?
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

  if (search) {
    query += ` AND (p.nombre LIKE ? OR p.apellidos LIKE ? OR r.numero_receta LIKE ?)`;
    const like = `%${search}%`;
    params.push(like, like, like);
  }

  query += ` ORDER BY r.fecha_emision DESC`;

  const [recetas] = await pool.query(query, params);

  res.json({
    success: true,
    data: { recetas }
  });
});

/**
 * Obtener una receta por uuid
 * GET /api/recetas/:uuid
 */
const getReceta = asyncHandler(async (req, res) => {
  const { uuid } = req.params;

  const [recetas] = await pool.query(
    `SELECT r.uuid, r.numero_receta, r.diagnostico, r.medicamentos, r.indicaciones_generales, r.fecha_emision,
            p.uuid as paciente_uuid, p.nombre as paciente_nombre, p.apellidos as paciente_apellidos,
            p.fecha_nacimiento, p.telefono as paciente_telefono,
            u.uuid as doctor_uuid, u.nombre as doctor_nombre, u.apellidos as doctor_apellidos,
            u.numero_licencia, u.especialidad,
            c.uuid as cita_uuid,
            co.nombre as consultorio_nombre, co.direccion as consultorio_direccion, co.telefono as consultorio_telefono
     FROM recetas r
     JOIN pacientes p ON r.paciente_id = p.id
     JOIN usuarios u ON r.doctor_id = u.id
     JOIN consultorios co ON r.consultorio_id = co.id
     LEFT JOIN citas c ON r.cita_id = c.id
     WHERE r.uuid = ? AND r.consultorio_id = ?`,
    [uuid, req.consultorioId]
  );

  if (recetas.length === 0) {
    return res.status(404).json({ success: false, message: 'Receta no encontrada' });
  }

  res.json({ success: true, data: recetas[0] });
});

/**
 * Obtener la receta de una cita (si existe)
 * GET /api/recetas/cita/:citaUuid
 */
const getRecetaPorCita = asyncHandler(async (req, res) => {
  const { citaUuid } = req.params;

  const [recetas] = await pool.query(
    `SELECT r.uuid FROM recetas r
     JOIN citas c ON r.cita_id = c.id
     WHERE c.uuid = ? AND r.consultorio_id = ?
     ORDER BY r.fecha_emision DESC LIMIT 1`,
    [citaUuid, req.consultorioId]
  );

  res.json({
    success: true,
    data: { receta: recetas[0] || null }
  });
});

/**
 * Crear receta médica
 * POST /api/recetas
 */
const createReceta = asyncHandler(async (req, res) => {
  const { cita_uuid, paciente_uuid, doctor_uuid, diagnostico, medicamentos, indicaciones_generales } = req.body;

  if (!paciente_uuid || !medicamentos || !Array.isArray(medicamentos) || medicamentos.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Paciente y al menos un medicamento son requeridos'
    });
  }

  const medicamentosValidos = medicamentos.every(m => m && typeof m.nombre === 'string' && m.nombre.trim().length > 0);
  if (!medicamentosValidos) {
    return res.status(400).json({
      success: false,
      message: 'Cada medicamento debe tener al menos un nombre'
    });
  }

  const [pacientes] = await pool.query(
    'SELECT id FROM pacientes WHERE uuid = ? AND consultorio_id = ?',
    [paciente_uuid, req.consultorioId]
  );
  if (pacientes.length === 0) {
    return res.status(404).json({ success: false, message: 'Paciente no encontrado' });
  }

  // El doctor de la receta: el indicado explícitamente, o el usuario autenticado si es doctor
  let doctorId = null;
  if (doctor_uuid) {
    const [doctores] = await pool.query(
      'SELECT id FROM usuarios WHERE uuid = ? AND consultorio_id = ? AND rol = "doctor"',
      [doctor_uuid, req.consultorioId]
    );
    if (doctores.length === 0) {
      return res.status(404).json({ success: false, message: 'Doctor no encontrado' });
    }
    doctorId = doctores[0].id;
  } else if (req.user.rol === 'doctor') {
    doctorId = req.user.id;
  } else {
    return res.status(400).json({
      success: false,
      message: 'Se requiere especificar el doctor que emite la receta'
    });
  }

  let citaId = null;
  if (cita_uuid) {
    const [citas] = await pool.query(
      'SELECT id FROM citas WHERE uuid = ? AND consultorio_id = ?',
      [cita_uuid, req.consultorioId]
    );
    if (citas.length > 0) citaId = citas[0].id;
  }

  // Folio consecutivo por año, mismo patrón que recibos
  const year = new Date().getFullYear();
  const [ultima] = await pool.query(
    `SELECT numero_receta FROM recetas
     WHERE consultorio_id = ? AND numero_receta LIKE ?
     ORDER BY id DESC LIMIT 1`,
    [req.consultorioId, `RX-${year}-%`]
  );

  let numeroReceta;
  if (ultima.length > 0) {
    const lastNum = parseInt(ultima[0].numero_receta.split('-')[2]) || 0;
    numeroReceta = `RX-${year}-${String(lastNum + 1).padStart(5, '0')}`;
  } else {
    numeroReceta = `RX-${year}-00001`;
  }

  const recetaUuid = uuidv4();

  await pool.query(
    `INSERT INTO recetas (consultorio_id, uuid, numero_receta, cita_id, paciente_id, doctor_id,
                           diagnostico, medicamentos, indicaciones_generales)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [req.consultorioId, recetaUuid, numeroReceta, citaId, pacientes[0].id, doctorId,
     diagnostico || null, JSON.stringify(medicamentos), indicaciones_generales || null]
  );

  res.status(201).json({
    success: true,
    message: 'Receta creada exitosamente',
    data: { uuid: recetaUuid, numero_receta: numeroReceta }
  });
});

/**
 * Actualizar receta médica
 * PUT /api/recetas/:uuid
 */
const updateReceta = asyncHandler(async (req, res) => {
  const { uuid } = req.params;
  const { diagnostico, medicamentos, indicaciones_generales } = req.body;

  const [existentes] = await pool.query(
    'SELECT id FROM recetas WHERE uuid = ? AND consultorio_id = ?',
    [uuid, req.consultorioId]
  );
  if (existentes.length === 0) {
    return res.status(404).json({ success: false, message: 'Receta no encontrada' });
  }

  if (!medicamentos || !Array.isArray(medicamentos) || medicamentos.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Se requiere al menos un medicamento'
    });
  }

  const medicamentosValidos = medicamentos.every(m => m && typeof m.nombre === 'string' && m.nombre.trim().length > 0);
  if (!medicamentosValidos) {
    return res.status(400).json({
      success: false,
      message: 'Cada medicamento debe tener al menos un nombre'
    });
  }

  await pool.query(
    `UPDATE recetas SET diagnostico = ?, medicamentos = ?, indicaciones_generales = ?
     WHERE uuid = ? AND consultorio_id = ?`,
    [diagnostico || null, JSON.stringify(medicamentos), indicaciones_generales || null, uuid, req.consultorioId]
  );

  res.json({ success: true, message: 'Receta actualizada exitosamente' });
});

module.exports = {
  getRecetas,
  getReceta,
  getRecetaPorCita,
  createReceta,
  updateReceta
};
