/**
 * Rate limiter simple en memoria (sin dependencias externas).
 *
 * Limita el número de peticiones por IP dentro de una ventana de tiempo.
 * Pensado principalmente para proteger endpoints sensibles como /auth/login
 * contra ataques de fuerza bruta.
 *
 * Nota: al ser en memoria, el conteo es por instancia del proceso. Para un
 * despliegue con múltiples instancias conviene migrar a un store compartido
 * (p. ej. Redis), pero para un backend de una sola instancia es suficiente.
 */

const createRateLimiter = ({ windowMs = 15 * 60 * 1000, max = 10, message } = {}) => {
  const hits = new Map(); // ip -> { count, resetAt }

  // Limpieza periódica de entradas expiradas para no acumular memoria
  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of hits.entries()) {
      if (entry.resetAt <= now) {
        hits.delete(ip);
      }
    }
  }, windowMs);
  // No mantener el proceso vivo solo por este timer
  if (cleanup.unref) cleanup.unref();

  return (req, res, next) => {
    // En tests todas las peticiones caen sobre la misma IP dentro de la
    // misma ventana — desactivar el conteo evita que un test tumbe al
    // siguiente con un 429 que no tiene nada que ver con lo que se prueba.
    if (process.env.NODE_ENV === 'test') return next();

    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const now = Date.now();
    const entry = hits.get(ip);

    if (!entry || entry.resetAt <= now) {
      hits.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }

    entry.count += 1;

    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.set('Retry-After', String(retryAfter));
      return res.status(429).json({
        success: false,
        message: message || 'Demasiados intentos. Intenta de nuevo más tarde.'
      });
    }

    next();
  };
};

// Limiter específico para login: 10 intentos cada 15 minutos por IP
const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Demasiados intentos de inicio de sesión. Espera unos minutos e intenta de nuevo.'
});

// Limiter general para toda la API (antes solo existía en las rutas de
// auth — el resto de los endpoints, pacientes/citas/recibos/etc., no
// tenían ningún límite). Bastante más laxo que loginLimiter: la idea es
// frenar abuso/scraping/bugs de cliente en bucle, no estorbar el uso
// normal — incluyendo un consultorio con varios miembros de staff detrás
// de la misma IP de oficina, más el polling de chat/notificaciones.
// Configurable por variables de entorno por si el default no calza con el
// tráfico real de un consultorio en particular.
const apiLimiter = createRateLimiter({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 5 * 60 * 1000, // 5 minutos
  max: Number(process.env.RATE_LIMIT_MAX) || 1500, // ~300 peticiones/min de margen
  message: 'Demasiadas peticiones desde esta IP. Intenta de nuevo en unos minutos.'
});

module.exports = { createRateLimiter, loginLimiter, apiLimiter };
