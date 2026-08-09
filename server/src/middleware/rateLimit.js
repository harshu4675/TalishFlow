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
    message: "Too many requests. Please try again in 15 minutes.",
  },
  skip: (req) => isDev && req.ip === "::1",
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

export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isDev ? 200 : 25,
  message: {
    success: false,
    message: "Upload limit reached. Maximum 25 uploads per hour.",
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
