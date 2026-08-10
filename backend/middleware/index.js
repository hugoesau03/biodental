const { authMiddleware, requireRole, requireSuperadmin, validateConsultorio } = require('./auth');
const { errorHandler, notFound, asyncHandler } = require('./errorHandler');
const { createRateLimiter, loginLimiter } = require('./rateLimiter');

module.exports = {
  authMiddleware,
  requireRole,
  requireSuperadmin,
  validateConsultorio,
  errorHandler,
  notFound,
  asyncHandler,
  createRateLimiter,
  loginLimiter
};
