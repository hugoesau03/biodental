const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');
const { asyncHandler } = require('../middleware');

/**
 * Lógica compartida para dar de alta un consultorio (tenant) nuevo junto
 * con su primer usuario admin. La usan tanto el registro público
 * (POST /api/auth/register, sin autenticación) como el alta protegida
 * desde dentro de la app (POST /api/auth/crear-consultorio, superadmin) —
 * mismas validaciones y mismo resultado, cada endpoint decide después qué
 * responder (el público además inicia sesión como el nuevo admin).
 */
const crearConsultorioConAdmin = async ({
  consultorio_nombre,
  consultorio_email,
  consultorio_telefono,
  usuario_nombre,
  usuario_apellidos,
  usuario_email,
  password
}) => {
  if (!consultorio_nombre || !usuario_email || !password || !usuario_nombre) {
    return { error: { status: 400, message: 'Faltan campos requeridos' } };
  }

  if (password.length < 8) {
    return { error: { status: 400, message: 'La contraseña debe tener al menos 8 caracteres' } };
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
      return { error: { status: 400, message: 'Ya existe un consultorio con este email' } };
    }

    // Nota: usuarios.email es único por (email, consultorio_id), no globalmente
    // — el mismo correo puede repetirse entre consultorios distintos, así que
    // no hace falta validarlo aquí: el consultorio_id de este insert siempre es nuevo.

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
      [consultorioUuid, consultorio_nombre, slug, consultorio_email || usuario_email, consultorio_telefono || null]
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

    return {
      consultorio: { id: consultorioId, uuid: consultorioUuid, nombre: consultorio_nombre, slug },
      usuario: {
        id: usuarioResult.insertId,
        uuid: usuarioUuid,
        nombre: usuario_nombre,
        apellidos: usuario_apellidos || '',
        email: usuario_email,
        rol: 'admin'
      }
    };

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Registrar nuevo consultorio y usuario admin (público, autoservicio)
 * POST /api/auth/register
 */
const register = asyncHandler(async (req, res) => {
  const resultado = await crearConsultorioConAdmin(req.body);

  if (resultado.error) {
    return res.status(resultado.error.status).json({
      success: false,
      message: resultado.error.message
    });
  }

  const token = jwt.sign(
    { userId: resultado.usuario.id, consultorioId: resultado.consultorio.id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  res.status(201).json({
    success: true,
    message: 'Consultorio registrado exitosamente',
    data: {
      token,
      usuario: {
        uuid: resultado.usuario.uuid,
        nombre: resultado.usuario.nombre,
        apellidos: resultado.usuario.apellidos,
        email: resultado.usuario.email,
        rol: 'admin'
      },
      consultorio: {
        uuid: resultado.consultorio.uuid,
        nombre: resultado.consultorio.nombre,
        slug: resultado.consultorio.slug
      }
    }
  });
});

/**
 * Crear un nuevo consultorio (tenant) desde dentro de la app, sin pasar por
 * el formulario público de autoservicio. No inicia sesión como el admin
 * recién creado — la sesión de quien lo crea no cambia. Requiere ser
 * superadmin de la plataforma.
 * POST /api/auth/crear-consultorio
 */
const crearConsultorio = asyncHandler(async (req, res) => {
  const resultado = await crearConsultorioConAdmin(req.body);

  if (resultado.error) {
    return res.status(resultado.error.status).json({
      success: false,
      message: resultado.error.message
    });
  }

  res.status(201).json({
    success: true,
    message: 'Consultorio creado exitosamente',
    data: {
      consultorio: {
        uuid: resultado.consultorio.uuid,
        nombre: resultado.consultorio.nombre,
        slug: resultado.consultorio.slug
      },
      usuario: {
        uuid: resultado.usuario.uuid,
        nombre: resultado.usuario.nombre,
        apellidos: resultado.usuario.apellidos,
        email: resultado.usuario.email,
        rol: 'admin'
      }
    }
  });
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
        avatar_url: user.avatar_url,
        es_superadmin: !!user.es_superadmin
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
            u.rol, u.especialidad, u.numero_licencia, u.fecha_registro, u.es_superadmin,
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
        fecha_registro: users[0].fecha_registro,
        es_superadmin: !!users[0].es_superadmin
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
  crearConsultorio,
  login,
  getMe,
  updatePassword
};
