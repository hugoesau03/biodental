const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

/**
 * Middleware de autenticación para el portal de pacientes.
 *
 * Usa el mismo JWT_SECRET que el auth de staff pero con un payload distinto
 * (tipo: 'paciente' + pacienteId) para que un token de un realm nunca sea
 * válido en el otro, aunque ambos usen el mismo secreto de firma.
 */
const authPaciente = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No se proporcionó token de autenticación'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.tipo !== 'paciente') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido para el portal de pacientes'
      });
    }

    const [pacientes] = await pool.query(
      `SELECT p.id, p.uuid, p.consultorio_id, p.nombre, p.apellidos, p.email, p.telefono, p.activo
       FROM pacientes p
       JOIN consultorios c ON p.consultorio_id = c.id
       WHERE p.id = ? AND p.activo = TRUE AND c.activo = TRUE`,
      [decoded.pacienteId]
    );

    if (pacientes.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Paciente no encontrado o inactivo'
      });
    }

    req.paciente = pacientes[0];
    req.pacienteId = pacientes[0].id;
    req.consultorioId = pacientes[0].consultorio_id;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Token inválido' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expirado' });
    }

    console.error('Error en autenticación del portal de pacientes:', error);
    return res.status(500).json({ success: false, message: 'Error en la autenticación' });
  }
};

module.exports = { authPaciente };
