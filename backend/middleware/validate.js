const { validationResult } = require('express-validator');

/**
 * Middleware que corre después de una cadena de validadores de
 * express-validator (p. ej. `body('email').isEmail()`) y corta la
 * petición con 400 si alguno falló. Sin esto, los validadores solo
 * anotan `req` — nunca bloquean nada por sí solos.
 *
 * Uso: router.post('/ruta', [body('email').isEmail(), ...], validate, controlador)
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors: errors.array().map((e) => ({ campo: e.path, mensaje: e.msg }))
    });
  }

  next();
};

module.exports = { validate };
