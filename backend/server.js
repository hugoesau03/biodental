const app = require('./app');
const { testConnection } = require('./config/database');
const { sincronizarTodosLosDoctores } = require('./controllers/googleCalendarController');
const logger = require('./services/logger');

const PORT = process.env.PORT || 5000;

// Iniciar servidor
const startServer = async () => {
  // Verificar conexión a base de datos
  const dbConnected = await testConnection();

  if (!dbConnected) {
    logger.warn('Servidor iniciando sin conexión a base de datos. Ejecuta: npm run db:init para crear la base de datos');
  }

  app.listen(PORT, () => {
    logger.info(`🏥 Biodental API corriendo en puerto ${PORT} (entorno: ${process.env.NODE_ENV || 'development'})`);
  });

  // Sincronización periódica con Google Calendar (Google -> App) para todos
  // los doctores conectados. Complementa la sincronización on-demand que se
  // dispara al consultar disponibilidad/bloqueos, dando actualizaciones casi
  // en tiempo real sin necesitar webhooks ni un scheduler externo.
  const GOOGLE_SYNC_INTERVAL_MS = 5 * 60 * 1000;
  setInterval(() => {
    sincronizarTodosLosDoctores().catch((err) => {
      logger.error('Error en sincronización periódica de Google Calendar', { error: err.message });
    });
  }, GOOGLE_SYNC_INTERVAL_MS);
};

startServer();
