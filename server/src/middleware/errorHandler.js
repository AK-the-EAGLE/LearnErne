import { env } from '../config/env.js';

export function errorHandler(err, req, res, _next) {
  const statusCode = err.status || err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);

  // Avoid logging secrets or excessive data
  if (!env.isTest && statusCode >= 500) {
    console.error(`[UnhandledError] ${req.method} ${req.originalUrl}:`, err.message);
  }

  // Handle Mongoose CastError / ValidationError
  let code = err.code || 'INTERNAL_SERVER_ERROR';
  let message = err.message || 'An unexpected error occurred.';

  if (err.name === 'ValidationError') {
    code = 'VALIDATION_ERROR';
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  } else if (err.code === 11000) {
    code = 'DUPLICATE_KEY';
    message = 'A resource with this identifier already exists.';
  } else if (statusCode >= 500 && env.isProduction) {
    // Redact internal error message details in production
    message = 'Internal server error';
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
    },
  });
}
