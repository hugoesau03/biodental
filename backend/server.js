require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { testConnection } = require('./config/database');
const routes = require('./routes');
const { errorHandler, notFound } = require('./middleware');
const { sincronizarTodosLosDoctores } = require('./controllers/googleCalendarController');

const app = express();
const PORT = process.env.PORT || 5000;

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

// Logging en desarrollo
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Rutas API
app.use('/api', routes);

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

// Iniciar servidor
const startServer = async () => {
  // Verificar conexión a base de datos
  const dbConnected = await testConnection();
  
  if (!dbConnected) {
    console.log('⚠️  Servidor iniciando sin conexión a base de datos');
    console.log('   Ejecuta: npm run db:init para crear la base de datos');
  }

  app.listen(PORT, () => {
    console.log('');
    console.log('🏥 ═══════════════════════════════════════');
    console.log('   BIODENTAL API');
    console.log('═══════════════════════════════════════════');
    console.log(`   🚀 Servidor corriendo en puerto ${PORT}`);
    console.log(`   📍 http://localhost:${PORT}`);
    console.log(`   🔧 Entorno: ${process.env.NODE_ENV || 'development'}`);
    console.log('═══════════════════════════════════════════');
    console.log('');
  });

  // Sincronización periódica con Google Calendar (Google -> App) para todos
  // los doctores conectados. Complementa la sincronización on-demand que se
  // dispara al consultar disponibilidad/bloqueos, dando actualizaciones casi
  // en tiempo real sin necesitar webhooks ni un scheduler externo.
  const GOOGLE_SYNC_INTERVAL_MS = 5 * 60 * 1000;
  setInterval(() => {
    sincronizarTodosLosDoctores().catch((err) => {
      console.error('Error en sincronización periódica de Google Calendar:', err.message);
    });
  }, GOOGLE_SYNC_INTERVAL_MS);
};

startServer();
