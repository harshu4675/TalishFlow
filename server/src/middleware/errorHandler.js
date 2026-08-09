import logger from "../utils/logger.js";
import { env } from "../config/env.js";

/**
 * Central error handling middleware for Express.
 * Converts all errors into a consistent JSON response format.
 */
export default function errorHandler(err, req, res, next) {
  // Default error structure
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || "Internal Server Error";
  let errors = err.errors || null;

  // Mongoose validation errors
  if (err.name === "ValidationError") {
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
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
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
  }

  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    statusCode = 400;
    message = "Unexpected file field";
  }

  // Log server errors
  if (statusCode >= 500) {
    logger.error("Server Error", {
      message: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      userId: req.user?.id,
    });
  }

  const response = {
    success: false,
    message,
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
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
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
 * Create application error with status code
 */
export function createError(message, statusCode = 500, errors = null) {
  const error = new Error(message);
  error.statusCode = statusCode;
  if (errors) error.errors = errors;
  return error;
}
