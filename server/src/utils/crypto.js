import CryptoJS from "crypto-js";
import crypto from "crypto";
import { env } from "../config/env.js";

const ENCRYPTION_KEY = env.ENCRYPTION_KEY;

// ============================================================
// Token Encryption / Decryption
// ============================================================

/**
 * Encrypt a string value using AES-256
 */
export function encrypt(text) {
  if (!text) return null;

  const encrypted = CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
  return encrypted;
}

/**
 * Decrypt an AES-256 encrypted string
 */
export function decrypt(encryptedText) {
  if (!encryptedText) return null;

  try {
    const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch {
    return null;
  }
}

// ============================================================
// Secure Token Generation
// ============================================================

/**
 * Generate cryptographically secure random token
 */
export function generateSecureToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex");
}

/**
 * Generate a hashed version of a token for storage
 */
export function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Generate secure random password
 */
export function generateSecurePassword(length = 20) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  const randomBytes = crypto.randomBytes(length);
  return Array.from(randomBytes)
    .map((byte) => chars[byte % chars.length])
    .join("");
}
