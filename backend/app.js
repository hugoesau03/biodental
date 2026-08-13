require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const { errorHandler, notFound, apiLimiter } = require('./middleware');
const logger = require('./services/logger');
const monitoring = require('./services/monitoring');

// Sentry (si SENTRY_DSN está configurado) debe inicializarse antes de que
// se registre cualquier middleware, para poder capturar errores desde el
// primer momento.
monitoring.init();

const app = express();

// El backend corre detrás de un proxy inverso (nginx) en producción.
// Necesario para que req.ip refleje la IP real del cliente (X-Forwarded-For)
// y para que el rate limiter funcione correctamente.
app.set('trust proxy', 1);

// Cabeceras de seguridad básicas (equivalente ligero a helmet, sin dependencia)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-XSS-Protection', '0');
  // Esta API solo devuelve JSON, nunca HTML — 'none' es intencional y
  // correcto aquí (no es un descuido de copiar/pegar una CSP de página web).
  res.setHeader('Content-Security-Policy', "default-src 'none'");
  // No hace nada si la petición llega por HTTP plano (los navegadores solo
  // respetan HSTS sobre HTTPS) — inofensivo dejarla puesta siempre, y entra
  // en efecto sola en cuanto haya TLS delante (nginx, un proxy, Cloudflare).
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.removeHeader('X-Powered-By');
  next();
});

// Middlewares
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : ['http://localhost:3000'];

app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origin (como mobile apps o Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging de peticiones (omitido en tests para no ensuciar la salida de jest)
if (process.env.NODE_ENV !== 'test') {
  app.use((req, res, next) => {
    logger.debug(`${req.method} ${req.path}`);
    next();
  });
}

// Rutas API — el límite general va antes de montar las rutas para cubrir
// todos los endpoints, no solo los de auth (que además tienen su propio
// loginLimiter, más estricto, aplicado dentro de routes/auth.js y portal.js).
app.use('/api', apiLimiter, routes);

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    name: 'Biodental API',
    version: '1.0.0',
    description: 'Sistema de gestión de consultorios médicos',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      pacientes: '/api/pacientes',
      citas: '/api/citas',
      servicios: '/api/servicios'
    }
  });
});

// Manejo de errores
app.use(notFound);
app.use(errorHandler);

module.exports = app;
