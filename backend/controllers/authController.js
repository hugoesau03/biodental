const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');
const { asyncHandler } = require('../middleware');

/**
 * Registrar nuevo consultorio y usuario admin
 * POST /api/auth/register
 */
const register = asyncHandler(async (req, res) => {
  const { 
    consultorio_nombre, 
    consultorio_email,
    consultorio_telefono,
    usuario_nombre, 
    usuario_apellidos,
    usuario_email, 
    password 
  } = req.body;

  // Validaciones básicas
  if (!consultorio_nombre || !usuario_email || !password || !usuario_nombre) {
    return res.status(400).json({
      success: false,
      message: 'Faltan campos requeridos'
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      message: 'La contraseña debe tener al menos 8 caracteres'
    });
  }

  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    // Verificar si el email del consultorio ya existe
    const [existingConsultorio] = await connection.query(
      'SELECT id FROM consultorios WHERE email = ?',
      [consultorio_email || usuario_email]
    );

    if (existingConsultorio.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Ya existe un consultorio con este email'
      });
    }

    // Crear slug único para el consultorio
    let slug = consultorio_nombre
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    const [existingSlug] = await connection.query(
      'SELECT id FROM consultorios WHERE slug = ?',
      [slug]
    );
    
    if (existingSlug.length > 0) {
      slug = `${slug}-${Date.now()}`;
    }

    // Crear consultorio
    const consultorioUuid = uuidv4();
    const [consultorioResult] = await connection.query(
      `INSERT INTO consultorios (uuid, nombre, slug, email, telefono) 
       VALUES (?, ?, ?, ?, ?)`,
      [consultorioUuid, consultorio_nombre, slug, consultorio_email || usuario_email, consultorio_telefono]
    );

    const consultorioId = consultorioResult.insertId;

    // Hash de contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Crear usuario admin
    const usuarioUuid = uuidv4();
    const [usuarioResult] = await connection.query(
      `INSERT INTO usuarios (consultorio_id, uuid, email, password_hash, nombre, apellidos, rol) 
       VALUES (?, ?, ?, ?, ?, ?, 'admin')`,
      [consultorioId, usuarioUuid, usuario_email, passwordHash, usuario_nombre, usuario_apellidos || '']
    );

    await connection.commit();

    // Generar token
    const token = jwt.sign(
      { userId: usuarioResult.insertId, consultorioId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Consultorio registrado exitosamente',
      data: {
        token,
        usuario: {
          uuid: usuarioUuid,
          nombre: usuario_nombre,
          apellidos: usuario_apellidos,
          email: usuario_email,
          rol: 'admin'
        },
        consultorio: {
          uuid: consultorioUuid,
          nombre: consultorio_nombre,
          slug
        }
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
 * Iniciar sesión
 * POST /api/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email y contraseña son requeridos'
    });
  }

  // Buscar usuario
  const [users] = await pool.query(
    `SELECT u.*, c.nombre as consultorio_nombre, c.uuid as consultorio_uuid, c.slug as consultorio_slug
     FROM usuarios u
     JOIN consultorios c ON u.consultorio_id = c.id
     WHERE u.email = ? AND u.activo = TRUE AND c.activo = TRUE`,
    [email]
  );

  if (users.length === 0) {
    return res.status(401).json({
      success: false,
      message: 'Credenciales inválidas'
    });
  }

  const user = users[0];

  // Verificar contraseña
  const isMatch = await bcrypt.compare(password, user.password_hash);

  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Credenciales inválidas'
    });
  }

  // Actualizar último login
  await pool.query(
    'UPDATE usuarios SET ultimo_login = NOW() WHERE id = ?',
    [user.id]
  );

  // Generar token
  const token = jwt.sign(
    { userId: user.id, consultorioId: user.consultorio_id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  res.json({
    success: true,
    message: 'Inicio de sesión exitoso',
    data: {
      token,
      usuario: {
        uuid: user.uuid,
        nombre: user.nombre,
        apellidos: user.apellidos,
        email: user.email,
        rol: user.rol,
        especialidad: user.especialidad,
        avatar_url: user.avatar_url
      },
      consultorio: {
        uuid: user.consultorio_uuid,
        nombre: user.consultorio_nombre,
        slug: user.consultorio_slug
      }
    }
  });
});

/**
 * Obtener perfil del usuario actual
 * GET /api/auth/me
 */
const getMe = asyncHandler(async (req, res) => {
  const [users] = await pool.query(
    `SELECT u.uuid, u.email, u.nombre, u.apellidos, u.telefono, u.avatar_url, u.avatar_blob, u.descripcion,
            u.rol, u.especialidad, u.numero_licencia, u.fecha_registro,
            c.uuid as consultorio_uuid, c.nombre as consultorio_nombre, 
            c.slug as consultorio_slug, c.plan
     FROM usuarios u
     JOIN consultorios c ON u.consultorio_id = c.id
     WHERE u.id = ?`,
    [req.user.id]
  );

  res.json({
    success: true,
    data: {
      usuario: {
        uuid: users[0].uuid,
        nombre: users[0].nombre,
        apellidos: users[0].apellidos,
        email: users[0].email,
        telefono: users[0].telefono,
        avatar_url: users[0].avatar_url,
        avatar_blob: users[0].avatar_blob,
        descripcion: users[0].descripcion,
        rol: users[0].rol,
        especialidad: users[0].especialidad,
        numero_licencia: users[0].numero_licencia,
        fecha_registro: users[0].fecha_registro
      },
      consultorio: {
        uuid: users[0].consultorio_uuid,
        nombre: users[0].consultorio_nombre,
        slug: users[0].consultorio_slug,
        plan: users[0].plan
      }
    }
  });
});

/**
 * Actualizar contraseña
 * PUT /api/auth/password
 */
const updatePassword = asyncHandler(async (req, res) => {
  const { current_password, new_password } = req.body;

  if (!current_password || !new_password) {
    return res.status(400).json({
      success: false,
      message: 'Se requiere contraseña actual y nueva'
    });
  }

  if (new_password.length < 8) {
    return res.status(400).json({
      success: false,
      message: 'La nueva contraseña debe tener al menos 8 caracteres'
    });
  }

  // Obtener usuario con password
  const [users] = await pool.query(
    'SELECT password_hash FROM usuarios WHERE id = ?',
    [req.user.id]
  );

  // Verificar contraseña actual
  const isMatch = await bcrypt.compare(current_password, users[0].password_hash);

  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Contraseña actual incorrecta'
    });
  }

  // Hash de nueva contraseña
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(new_password, salt);

  // Actualizar
  await pool.query(
    'UPDATE usuarios SET password_hash = ? WHERE id = ?',
    [passwordHash, req.user.id]
  );

  res.json({
    success: true,
    message: 'Contraseña actualizada exitosamente'
  });
});

module.exports = {
  register,
  login,
  getMe,
  updatePassword
};
