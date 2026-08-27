import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

const isDev = env.NODE_ENV === "development";

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 2000 : 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: "RATE_LIMITED",
    message: "Too many requests. Please try again in 15 minutes.",
  },
  // Chunk traffic is authenticated and bounded per-user by
  // uploadTransferLimiter; counting it here (per IP) would break large
  // uploads on shared IPs / NAT.
  skip: (req) =>
    (isDev && req.ip === "::1") ||
    req.path.startsWith("/api/v1/videos/resumable/chunk"),
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 100 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Too many authentication attempts. Please try again in 15 minutes.",
  },
  keyGenerator: (req) => `auth:${req.ip}:${req.body?.email || "anon"}`,
});

/**
 * Limits the number of upload SESSIONS a user can start per hour.
 * Applied to the endpoints that create an upload (/upload, /resumable/init).
 *
 * NOTE: chunk/complete endpoints are NOT counted here — a single large
 * upload can consist of many chunk requests and must not exhaust the
 * per-hour upload budget mid-upload.
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isDev ? 200 : 25,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `upload:${req.user?.id || req.ip}`,
  message: {
    success: false,
    code: "RATE_LIMITED",
    message: "Upload limit reached. Maximum 25 uploads per hour.",
  },
});

/**
 * High-volume limiter for in-progress upload traffic (chunks, completion).
 * Keyed per user so one user's large file cannot exhaust another's budget.
 */
export const uploadTransferLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isDev ? 10000 : 5000,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `upload-transfer:${req.user?.id || req.ip}`,
  message: {
    success: false,
    code: "RATE_LIMITED",
    message: "Too many upload requests. Please try again shortly.",
  },
});

export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Too many password reset attempts. Try again in 1 hour.",
  },
});

export const aiGenerationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isDev ? 500 : 100,
  message: {
    success: false,
    message:
      "AI generation limit reached. You can generate up to 100 items per hour.",
  },
  keyGenerator: (req) => `ai:${req.user?.id || req.ip}`,
});
