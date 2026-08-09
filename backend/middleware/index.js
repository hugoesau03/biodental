const { authMiddleware, requireRole, validateConsultorio } = require('./auth');
const { errorHandler, notFound, asyncHandler } = require('./errorHandler');
const { createRateLimiter, loginLimiter } = require('./rateLimiter');

module.exports = {
  authMiddleware,
  requireRole,
  validateConsultorio,
  errorHandler,
  notFound,
  asyncHandler,
  createRateLimiter,
  loginLimiter
};
