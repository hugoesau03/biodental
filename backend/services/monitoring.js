const Sentry = require('@sentry/node');
const logger = require('./logger');

/**
 * Monitoreo de errores (Sentry), completamente opcional: si no hay
 * SENTRY_DSN configurado, `init()` no hace nada y `captureException()` es
 * un no-op — el backend funciona igual sin cuenta de Sentry. Se activa
 * solo poniendo SENTRY_DSN en el .env.
 */

let inicializado = false;

const init = () => {
  if (inicializado) return;
  inicializado = true;

  if (!process.env.SENTRY_DSN) {
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 0.1
  });

  logger.info('Sentry inicializado');
};

const captureException = (error, extra = {}) => {
  if (!process.env.SENTRY_DSN) return;
  Sentry.captureException(error, { extra });
};

module.exports = { init, captureException };
