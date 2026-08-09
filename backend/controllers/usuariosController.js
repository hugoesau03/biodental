const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');
const { asyncHandler } = require('../middleware');

/**
 * Obtener todos los usuarios/doctores del consultorio
 * GET /api/usuarios
 */
const getUsuarios = asyncHandler(async (req, res) => {
  const { rol, activo } = req.query;

  let query = `
    SELECT uuid, email, nombre, apellidos, telefono, avatar_url, avatar_blob, descripcion,
           rol, especialidad, numero_licencia, activo, ultimo_login, fecha_registro
    FROM usuarios
    WHERE consultorio_id = ?
  `;
  const params = [req.consultorioId];

  if (rol) {
    query += ` AND rol = ?`;
    params.push(rol);
  }

  if (activo !== undefined) {
    query += ` AND activo = ?`;
    params.push(activo === 'true');
  }

  query += ` ORDER BY nombre, apellidos`;

  const [usuarios] = await pool.query(query, params);

  res.json({
    success: true,
    data: { usuarios }
  });
});

/**
 * Obtener doctores del consultorio (solo usuarios con rol doctor)
 * GET /api/usuarios/doctores
 */
const getDoctores = asyncHandler(async (req, res) => {
  const [doctores] = await pool.query(
    `SELECT uuid, nombre, apellidos, avatar_url, avatar_blob, especialidad, numero_licencia, descripcion
     FROM usuarios
     WHERE consultorio_id = ? AND rol = 'doctor' AND activo = TRUE
     ORDER BY nombre, apellidos`,
    [req.consultorioId]
  );

  res.json({
    success: true,
    data: { doctores }
  });
});

/**
 * Obtener un usuario por UUID
 * GET /api/usuarios/:uuid
 */
const getUsuario = asyncHandler(async (req, res) => {
  const { uuid } = req.params;

  const [usuarios] = await pool.query(
    `SELECT uuid, email, nombre, apellidos, telefono, avatar_url, avatar_blob, descripcion,
            rol, especialidad, numero_licencia, activo, ultimo_login, fecha_registro
     FROM usuarios
     WHERE uuid = ? AND consultorio_id = ?`,
    [uuid, req.consultorioId]
  );

  if (usuarios.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Usuario no encontrado'
    });
  }

  // Si es doctor, obtener sus horarios
  const [horarios] = await pool.query(
    `SELECT dia_semana, hora_inicio, hora_fin, intervalo_minutos, activo
     FROM horarios_doctor
     WHERE doctor_id = (SELECT id FROM usuarios WHERE uuid = ?)
     ORDER BY dia_semana`,
    [uuid]
  );

  res.json({
    success: true,
    data: {
      ...usuarios[0],
      horarios
    }
  });
});

/**
 * Crear nuevo usuario
 * POST /api/usuarios
 */
const createUsuario = asyncHandler(async (req, res) => {
  const {
    email, password, nombre, apellidos, telefono,
    rol, especialidad, numero_licencia
  } = req.body;

  if (!email || !password || !nombre) {
    return res.status(400).json({
      success: false,
      message: 'Email, contraseña y nombre son requeridos'
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      message: 'La contraseña debe tener al menos 8 caracteres'
    });
  }

  // Verificar email único en el consultorio
  const [existing] = await pool.query(
    'SELECT id FROM usuarios WHERE email = ? AND consultorio_id = ?',
    [email, req.consultorioId]
  );

  if (existing.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Ya existe un usuario con este email'
    });
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const usuarioUuid = uuidv4();

  await pool.query(
    `INSERT INTO usuarios (consultorio_id, uuid, email, password_hash, nombre, apellidos, 
                           telefono, rol, especialidad, numero_licencia)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [req.consultorioId, usuarioUuid, email, passwordHash, nombre, apellidos || '',
     telefono || null, rol || 'recepcionista', especialidad || null, numero_licencia || null]
  );

  res.status(201).json({
    success: true,
    message: 'Usuario creado exitosamente',
    data: {
      uuid: usuarioUuid,
      email,
      nombre,
      rol: rol || 'recepcionista'
    }
  });
});

/**
 * Actualizar usuario
 * PUT /api/usuarios/:uuid
 * - Un usuario puede actualizar su propio perfil (foto, descripción)
 * - Solo admin puede actualizar otros usuarios o campos sensibles
 */
const updateUsuario = asyncHandler(async (req, res) => {
  const { uuid } = req.params;
  const updates = req.body;
  const isOwnProfile = req.user.uuid === uuid;
  const isAdmin = req.user.rol === 'admin';

  // Si no es su propio perfil y no es admin, denegar acceso
  if (!isOwnProfile && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'No tienes permiso para actualizar este usuario'
    });
  }

  const [existing] = await pool.query(
    'SELECT id FROM usuarios WHERE uuid = ? AND consultorio_id = ?',
    [uuid, req.consultorioId]
  );

  if (existing.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Usuario no encontrado'
    });
  }

  // Campos que cualquier usuario puede editar en su propio perfil
  const selfEditableFields = ['avatar_url', 'avatar_blob', 'descripcion'];
  
  // Campos que solo admin puede editar
  const adminOnlyFields = ['nombre', 'apellidos', 'telefono', 'rol', 'especialidad', 'numero_licencia', 'activo'];

  const fieldsToUpdate = {};
  
  // Procesar campos según permisos
  for (const field of selfEditableFields) {
    if (updates[field] !== undefined) {
      fieldsToUpdate[field] = updates[field];
    }
  }

  // Solo admin puede editar campos sensibles
  if (isAdmin) {
    for (const field of adminOnlyFields) {
      if (updates[field] !== undefined) {
        fieldsToUpdate[field] = updates[field];
      }
    }
    
    // Si se proporciona nueva contraseña (solo admin)
    if (updates.password) {
      if (updates.password.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'La contraseña debe tener al menos 8 caracteres'
        });
      }
      const salt = await bcrypt.genSalt(10);
      fieldsToUpdate.password_hash = await bcrypt.hash(updates.password, salt);
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
    `UPDATE usuarios SET ${setClause} WHERE uuid = ? AND consultorio_id = ?`,
    values
  );

  res.json({
    success: true,
    message: 'Usuario actualizado exitosamente'
  });
});

/**
 * Eliminar usuario (soft delete)
 * DELETE /api/usuarios/:uuid
 */
const deleteUsuario = asyncHandler(async (req, res) => {
  const { uuid } = req.params;

  // No permitir eliminarse a sí mismo
  if (uuid === req.user.uuid) {
    return res.status(400).json({
      success: false,
      message: 'No puedes eliminar tu propia cuenta'
    });
  }

  const [result] = await pool.query(
    'UPDATE usuarios SET activo = FALSE WHERE uuid = ? AND consultorio_id = ?',
    [uuid, req.consultorioId]
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({
      success: false,
      message: 'Usuario no encontrado'
    });
  }

  res.json({
    success: true,
    message: 'Usuario eliminado exitosamente'
  });
});

module.exports = {
  getUsuarios,
  getDoctores,
  getUsuario,
  createUsuario,
  updateUsuario,
  deleteUsuario
};
