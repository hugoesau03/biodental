const winston = require('winston');

/**
 * Logger estructurado para el backend. En desarrollo imprime en consola
 * con colores y formato legible; en producción imprime JSON de una línea
 * (fácil de indexar si algún día se manda a un colector de logs externo).
 *
 * Pensado para lo que vale la pena tener estructurado y poder buscar
 * después: arranque del servidor, peticiones HTTP, errores no manejados.
 * El resto del código (controladores) puede seguir usando console.* para
 * mensajes puntuales sin que eso sea un problema.
 */

const isProduction = process.env.NODE_ENV === 'production';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  format: isProduction
    ? winston.format.combine(winston.format.timestamp(), winston.format.json())
    : winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'HH:mm:ss' }),
        winston.format.printf(({ level, message, timestamp, ...meta }) => {
          const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
          return `${timestamp} ${level}: ${message}${metaStr}`;
        })
      ),
  transports: [new winston.transports.Console()]
});

module.exports = logger;
