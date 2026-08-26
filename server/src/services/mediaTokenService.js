import crypto from "crypto";
import { env } from "../config/env.js";

/**
 * Signed, expiring media URLs.
 *
 * Some external services (e.g. the Instagram Graph API) must fetch the
 * media itself — they cannot present our users' credentials. Instead of
 * making media broadly public, we issue URLs carrying an HMAC signature
 * over (clipId, expiry, scope) so they:
 *   - expire after a short window (default 30 minutes),
 *   - are bound to one clip and one purpose,
 *   - cannot be forged without ENCRYPTION_KEY.
 */

const DEFAULT_TTL_SECONDS = 30 * 60;

function base64Url(buffer) {
  return Buffer.from(buffer).toString("base64url");
}

function sign(payloadSegment) {
  return crypto
    .createHmac("sha256", env.ENCRYPTION_KEY)
    .update(payloadSegment)
    .digest("base64url");
}

/**
 * Sign a media token (payload + HMAC signature). Exported so serializers can
 * build same-origin relative URLs for first-party clients.
 */
export function signMediaToken({
  resourceId,
  scope = "publish",
  ttlSeconds = DEFAULT_TTL_SECONDS,
}) {
  const payload = {
    clipId: String(resourceId),
    scope,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };

  const payloadSegment = base64Url(JSON.stringify(payload));
  const signature = sign(payloadSegment);

  return `${payloadSegment}.${signature}`;
}

/**
 * Build a signed public media URL for a clip.
 *
 * @param {{ clipId: string, scope?: string, ttlSeconds?: number }} options
 * @returns {string} absolute URL under PUBLIC_API_URL
 */
export function buildSignedMediaUrl({
  clipId,
  scope = "publish",
  ttlSeconds = DEFAULT_TTL_SECONDS,
}) {
  const token = signMediaToken({ resourceId: clipId, scope, ttlSeconds });

  return `${env.PUBLIC_API_URL}/api/v1/media/clips/${clipId}/stream?token=${token}`;
}

/**
 * Build a same-origin (relative) URL to a clip's thumbnail with a signed
 * "view" token, e.g. for use in <img src> from the authenticated SPA.
 */
export function buildRelativeThumbnailUrl(kind, resourceId, ttlSeconds = 15 * 60) {
  const token = signMediaToken({ resourceId, scope: "view", ttlSeconds });
  return `/api/v1/media/${kind}/${resourceId}/thumbnail?token=${token}`;
}

/**
 * Verify a media token. Returns { clipId, scope } or throws with .code.
 */
export function verifyMediaToken(token, expectedClipId = null) {
  if (typeof token !== "string" || !token.includes(".")) {
    const error = new Error("Invalid media token");
    error.code = "MEDIA_TOKEN_INVALID";
    throw error;
  }

  const [payloadSegment, signature] = token.split(".");
  const expected = sign(payloadSegment);

  const providedBuffer = Buffer.from(signature || "");
  const expectedBuffer = Buffer.from(expected);

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    const error = new Error("Invalid media token signature");
    error.code = "MEDIA_TOKEN_INVALID";
    throw error;
  }

  let payload;
  try {
    payload = JSON.parse(Buffer.from(payloadSegment, "base64url").toString("utf-8"));
  } catch {
    const error = new Error("Invalid media token payload");
    error.code = "MEDIA_TOKEN_INVALID";
    throw error;
  }

  if (!payload?.clipId || !payload?.exp) {
    const error = new Error("Invalid media token payload");
    error.code = "MEDIA_TOKEN_INVALID";
    throw error;
  }

  if (Math.floor(Date.now() / 1000) > payload.exp) {
    const error = new Error("Media link has expired");
    error.code = "MEDIA_TOKEN_EXPIRED";
    throw error;
  }

  if (expectedClipId && String(expectedClipId) !== String(payload.clipId)) {
    const error = new Error("Media token does not match this resource");
    error.code = "MEDIA_TOKEN_MISMATCH";
    throw error;
  }

  return { clipId: payload.clipId, scope: payload.scope };
}
