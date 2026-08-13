// Variables de entorno mínimas para que la app se pueda requerir en tests
// sin depender de un .env real ni de una base de datos de verdad.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-no-usar-en-produccion';
process.env.JWT_EXPIRES_IN = '1h';
process.env.CORS_ORIGIN = 'http://localhost:3000';
process.env.FRONTEND_URL = 'http://localhost:3000';
// Sin SENTRY_DSN ni SMTP_HOST: monitoring.init() y emailService quedan en
// modo no-op/simulado, tal como en desarrollo local sin esas credenciales.
