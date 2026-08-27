import logger from "../utils/logger.js";
import { env } from "../config/env.js";

/**
 * Create application error with status code and structured metadata.
 *
 * @param {string} message Human readable message
 * @param {number} [statusCode=500] HTTP status code
 * @param {Array|object} [extra]
 *   - Array  → treated as field-level errors (legacy shape)
 *   - object → { code, details, errors }
 * @returns {Error}
 */
export function createError(message, statusCode = 500, extra = null) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.isAppError = true;

  if (Array.isArray(extra)) {
    error.errors = extra;
  } else if (extra && typeof extra === "object") {
    if (extra.code) error.code = extra.code;
    if (extra.details) error.details = extra.details;
    if (extra.errors) error.errors = extra.errors;
  }

  return error;
}

// Map well-known err codes to stable API error codes
function resolveCode(err, statusCode) {
  // Only codes explicitly assigned via createError() are API error codes
  if (err.isAppError && err.code && typeof err.code === "string") {
    return err.code;
  }

  switch (err.name) {
    case "ValidationError":
      return "VALIDATION_FAILED";
    case "CastError":
      return "INVALID_ID";
    case "JsonWebTokenError":
      return "INVALID_TOKEN";
    case "TokenExpiredError":
      return "TOKEN_EXPIRED";
    case "AbortError":
      return "ABORTED";
    default:
      break;
  }

  if (err.code === "LIMIT_FILE_SIZE") return "UPLOAD_FILE_TOO_LARGE";
  if (err.code === "LIMIT_UNEXPECTED_FILE") return "UPLOAD_INVALID_PAYLOAD";
  if (err.code === "LIMIT_FILE_COUNT") return "UPLOAD_TOO_MANY_FILES";

  if (statusCode === 400) return "BAD_REQUEST";
  if (statusCode === 401) return "UNAUTHENTICATED";
  if (statusCode === 403) return "FORBIDDEN";
  if (statusCode === 404) return "NOT_FOUND";
  if (statusCode === 409) return "CONFLICT";
  if (statusCode === 413) return "PAYLOAD_TOO_LARGE";
  if (statusCode === 415) return "UNSUPPORTED_MEDIA_TYPE";
  if (statusCode === 422) return "VALIDATION_FAILED";
  if (statusCode === 429) return "RATE_LIMITED";
  if (statusCode >= 500) return "INTERNAL_ERROR";
  return "ERROR";
}

/**
 * Central error handling middleware for Express.
 * Converts all errors into a consistent structured JSON response:
 * { success: false, code, message, details?, errors? }
 */
export default function errorHandler(err, req, res, next) {
  // Default error structure
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || "Internal Server Error";
  let errors = err.errors || null;
  let details = err.details || null;

  // Mongoose validation errors
  if (err.name === "ValidationError" && !err.code) {
    statusCode = 422;
    message = "Validation failed";
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    err.code = "DUPLICATE_KEY";
  }

  // Mongoose CastError (invalid ObjectId / invalid type)
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
    details = `Expected ${err.constructor.name.replace("CastError", "valid value")} for path "${err.path}"`;
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
  }

  // Multer errors
  if (err.code === "LIMIT_FILE_SIZE") {
    statusCode = 413;
    message = "File too large. Maximum size is 5GB.";
    details = `Received file exceeds the server upload limit of ${Math.round(Number(env.MAX_FILE_SIZE) / 1024 / 1024 / 1024)}GB`;
  }

  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    statusCode = 400;
    message = "Unexpected file field";
  }

  // Multer file filter errors (e.g. unsupported type)
  if (err.name === "MulterError" && !err.code) {
    statusCode = 400;
  }

  // Log server errors
  if (statusCode >= 500) {
    logger.error("Server Error", {
      code: err.code || resolveCode(err, statusCode),
      message: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      userId: req.user?.id,
    });
  } else {
    logger.warn("Client Error", {
      code: err.code || resolveCode(err, statusCode),
      message: err.message,
      url: req.url,
      method: req.method,
      userId: req.user?.id,
    });
  }

  const code = resolveCode(err, statusCode);

  const response = {
    success: false,
    code,
    message,
    ...(details && { details }),
    ...(errors && { errors }),
    ...(env.NODE_ENV === "development" && {
      stack: err.stack,
    }),
  };

  res.status(statusCode).json(response);
}

/**
 * 404 Handler — must be registered before errorHandler
 */
export function notFoundHandler(req, res, next) {
  const error = createError(`Route not found: ${req.method} ${req.originalUrl}`, 404, {
    code: "ROUTE_NOT_FOUND",
  });
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
