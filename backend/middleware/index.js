const { authMiddleware, requireRole, requireSuperadmin, validateConsultorio } = require('./auth');
const { errorHandler, notFound, asyncHandler } = require('./errorHandler');
const { createRateLimiter, loginLimiter, apiLimiter } = require('./rateLimiter');
const { validate } = require('./validate');

module.exports = {
  authMiddleware,
  requireRole,
  requireSuperadmin,
  validateConsultorio,
  errorHandler,
  notFound,
  asyncHandler,
  createRateLimiter,
  loginLimiter,
  apiLimiter,
  validate
};
