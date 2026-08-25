import logger from "../utils/logger.js";
import { env } from "../config/env.js";

/**
 * Central error handling middleware for Express.
 *
 * Normalizes every failure into a consistent JSON shape:
 *
 * {
 *   "success": false,
 *   "message": "Human readable message",       // legacy, consumed by clients
 *   "error": {
 *     "code": "ERROR_CODE",
 *     "message": "Human readable message",
 *     "details": [ ... ]                        // optional field-level errors
 *   }
 * }
 *
 * Stack traces are only included in development mode.
 */
export default function errorHandler(err, req, res, _next) {
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || "Internal Server Error";
  let code = err.code || "INTERNAL_ERROR";
  let details = err.errors || err.details || null;

  // Mongoose validation errors
  if (err.name === "ValidationError") {
    statusCode = 422;
    code = "VALIDATION_FAILED";
    message = "Validation failed";
    details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    code = "DUPLICATE_KEY";
    const field = Object.keys(err.keyValue || {})[0] || "value";
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === "CastError") {
    statusCode = 400;
    code = "INVALID_ID";
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    code = "TOKEN_INVALID";
    message = "Invalid token";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    code = "TOKEN_EXPIRED";
    message = "Token expired";
  }

  // Multer errors
  if (err.code === "LIMIT_FILE_SIZE") {
    statusCode = 413;
    code = "FILE_TOO_LARGE";
    message = "File too large. Maximum size is 5GB.";
  }

  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    statusCode = 400;
    code = "UNEXPECTED_FILE_FIELD";
    message = "Unexpected file field";
  }

  // Never leak internal detail for 5xx in production
  if (statusCode >= 500 && env.NODE_ENV === "production") {
    message =
      code === "INTERNAL_ERROR" ? "Something went wrong on our side. Please try again." : message;
  }

  // Log server errors (never log secrets, tokens, or request bodies)
  if (statusCode >= 500) {
    logger.error("Server Error", {
      code,
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      userId: req.user?.id,
    });
  } else if (statusCode >= 400) {
    logger.debug("Client Error", {
      code,
      message: err.message,
      url: req.originalUrl,
      method: req.method,
      userId: req.user?.id,
    });
  }

  res.status(statusCode).json({
    success: false,
    message,
    error: {
      code,
      message,
      ...(details && { details }),
    },
    ...(env.NODE_ENV === "development" && { stack: err.stack }),
  });
}

/**
 * 404 Handler — must be registered before errorHandler
 */
export function notFoundHandler(req, res, next) {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  error.code = "ROUTE_NOT_FOUND";
  next(error);
}

/**
 * Async route handler wrapper — eliminates try/catch boilerplate
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Create an application error with status code, machine-readable code and
 * optional structured details.
 *
 * @param {string} message   user-safe message
 * @param {number} statusCode
 * @param {{ code?: string, details?: any }} options
 */
export function createError(message, statusCode = 500, options = null) {
  const error = new Error(message);
  error.statusCode = statusCode;

  if (Array.isArray(options)) {
    // Backwards compatibility: createError(message, status, errors[])
    error.errors = options;
  } else if (options && typeof options === "object") {
    if (options.code) error.code = options.code;
    if (options.details) error.details = options.details;
  }

  return error;
}
