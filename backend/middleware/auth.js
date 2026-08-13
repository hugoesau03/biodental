const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

/**
 * Middleware de autenticación JWT
 * Verifica el token y añade el usuario al request
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Obtener token del header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No se proporcionó token de autenticación'
      });
    }

    const token = authHeader.split(' ')[1];

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Buscar usuario en la base de datos
    const [users] = await pool.query(
      `SELECT u.id, u.uuid, u.email, u.nombre, u.apellidos, u.rol, u.consultorio_id,
              u.especialidad, u.activo, u.es_superadmin, u.tokens_invalidos_antes,
              c.nombre as consultorio_nombre, c.uuid as consultorio_uuid
       FROM usuarios u
       JOIN consultorios c ON u.consultorio_id = c.id
       WHERE u.id = ? AND u.activo = TRUE AND c.activo = TRUE`,
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado o inactivo'
      });
    }

    // Revocación: si el usuario cerró sesión en todos los dispositivos o
    // cambió su contraseña después de que se emitió este token (iat, en
    // segundos), el token ya no es válido aunque no haya expirado.
    if (
      users[0].tokens_invalidos_antes &&
      decoded.iat * 1000 < new Date(users[0].tokens_invalidos_antes).getTime()
    ) {
      return res.status(401).json({
        success: false,
        message: 'Sesión cerrada. Vuelve a iniciar sesión.'
      });
    }

    // Añadir usuario al request
    req.user = users[0];
    req.userId = users[0].id;
    req.consultorioId = users[0].consultorio_id;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado'
      });
    }
    
    console.error('Error en autenticación:', error);
    return res.status(500).json({
      success: false,
      message: 'Error en la autenticación'
    });
  }
};

/**
 * Middleware para verificar roles
 * @param  {...string} roles - Roles permitidos
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }

    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para realizar esta acción'
      });
    }

    next();
  };
};

/**
 * Middleware para acciones exclusivas del superadmin de la plataforma
 * (p. ej. dar de alta consultorios nuevos). Es una bandera aparte del rol
 * admin/doctor/recepcionista/asistente — no reemplaza a requireRole, se usa
 * junto a él cuando la acción no debe depender del consultorio del usuario
 * sino de si es el operador de la plataforma.
 */
const requireSuperadmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'No autenticado'
    });
  }

  if (!req.user.es_superadmin) {
    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para realizar esta acción'
    });
  }

  next();
};

/**
 * Middleware para verificar que el recurso pertenece al consultorio
 * Se usa después de authMiddleware
 */
const validateConsultorio = async (req, res, next) => {
  // El consultorio_id ya está en req.consultorioId desde authMiddleware
  // Este middleware se asegura de que las queries incluyan el filtro de consultorio
  if (!req.consultorioId) {
    return res.status(403).json({
      success: false,
      message: 'Consultorio no identificado'
    });
  }
  next();
};

module.exports = {
  authMiddleware,
  requireRole,
  requireSuperadmin,
  validateConsultorio
};
