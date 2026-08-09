import winston from "winston";
import path from "path";
import { env } from "../config/env.js";

const { combine, timestamp, errors, json, colorize, simple, printf } =
  winston.format;

// Custom format for development
const devFormat = printf(({ level, message, timestamp: ts, ...meta }) => {
  const metaStr = Object.keys(meta).length
    ? `\n${JSON.stringify(meta, null, 2)}`
    : "";
  return `${ts} [${level}] ${message}${metaStr}`;
});

const logger = winston.createLogger({
  level: env.NODE_ENV === "production" ? "info" : "debug",

  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true }),
  ),

  transports: [
    // Console transport
    new winston.transports.Console({
      format: combine(colorize({ all: true }), devFormat),
    }),

    // File transport (production)
    ...(env.NODE_ENV === "production"
      ? [
          new winston.transports.File({
            filename: "logs/error.log",
            level: "error",
            format: json(),
            maxsize: 10 * 1024 * 1024, // 10MB
            maxFiles: 5,
          }),
          new winston.transports.File({
            filename: "logs/combined.log",
            format: json(),
            maxsize: 10 * 1024 * 1024,
            maxFiles: 5,
          }),
        ]
      : []),
  ],

  exitOnError: false,
});

// Convenience methods with structured logging
export default {
  info: (message, meta = {}) => logger.info(message, meta),
  warn: (message, meta = {}) => logger.warn(message, meta),
  error: (message, meta = {}) => logger.error(message, meta),
  debug: (message, meta = {}) => logger.debug(message, meta),
  http: (message, meta = {}) => logger.http(message, meta),
  stream: {
    write: (message) => logger.http(message.trim()),
  },
};
