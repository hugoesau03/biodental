/**
 * Middleware para manejo centralizado de errores
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Error de validación de express-validator
  if (err.array && typeof err.array === 'function') {
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors: err.array()
    });
  }

  // Error de MySQL
  if (err.code && err.code.startsWith('ER_')) {
    let message = 'Error en la base de datos';
    
    if (err.code === 'ER_DUP_ENTRY') {
      message = 'El registro ya existe';
    } else if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      message = 'Referencia inválida';
    }

    return res.status(400).json({
      success: false,
      message,
      code: err.code
    });
  }

  // Error personalizado con código de estado
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  }

  // Error genérico
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'development' 
      ? err.message 
      : 'Error interno del servidor'
  });
};

/**
 * Middleware para rutas no encontradas
 */
const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`
  });
};

/**
 * Wrapper para async/await en controladores
 * Evita tener que usar try/catch en cada controlador
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  notFound,
  asyncHandler
};
