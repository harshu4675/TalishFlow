import crypto from "crypto";
import { env } from "../../config/env.js";
import { kvSetNX, kvGetDel } from "../keyValueStore.js";

/**
 * OAuth `state` parameter handling.
 *
 * A state token is an HMAC-signed JSON payload carrying:
 *   - mode:     "login" | "connect"
 *   - platform: "youtube" | "instagram" (connect mode)
 *   - userId:   the TalishFlow user the connect belongs to (connect mode)
 *   - nonce:    random, single-use (stored with TTL for replay protection)
 *   - exp:      expiry timestamp
 *
 * Signing makes forgery impossible without ENCRYPTION_KEY; the nonce store
 * makes replay impossible within the state lifetime.
 */

const STATE_TTL_SECONDS = 10 * 60; // 10 minutes
const NONCE_PREFIX = "talishflow:oauth:nonce:";

function base64UrlEncode(input) {
  return Buffer.from(input).toString("base64url");
}

function base64UrlDecode(input) {
  return Buffer.from(input, "base64url").toString("utf-8");
}

function sign(payloadSegment) {
  return crypto
    .createHmac("sha256", env.ENCRYPTION_KEY)
    .update(payloadSegment)
    .digest("base64url");
}

export class OAuthStateError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

/**
 * Create a signed, single-use OAuth state token.
 *
 * @param {{ mode: "login" | "connect", platform?: string, userId?: string }} options
 */
export async function createOAuthState({ mode, platform = null, userId = null }) {
  const nonce = crypto.randomBytes(16).toString("hex");

  // Reserve the nonce atomically — replay of the same state token fails.
  const reserved = await kvSetNX(
    `${NONCE_PREFIX}${nonce}`,
    { used: true },
    STATE_TTL_SECONDS,
  );
  if (!reserved) {
    // Practically impossible (128-bit nonce) — fail closed.
    throw new OAuthStateError("state_nonce_collision");
  }

  const payload = {
    v: 1,
    mode,
    platform,
    userId,
    nonce,
    exp: Date.now() + STATE_TTL_SECONDS * 1000,
  };

  const payloadSegment = base64UrlEncode(JSON.stringify(payload));
  return `${payloadSegment}.${sign(payloadSegment)}`;
}

/**
 * Verify and consume a state token. Each token can only be consumed once.
 *
 * @returns {{ mode: string, platform: string|null, userId: string|null }}
 */
export async function consumeOAuthState(token) {
  if (typeof token !== "string" || !token.includes(".")) {
    throw new OAuthStateError("invalid_state");
  }

  const [payloadSegment, signature] = token.split(".");

  const expected = sign(payloadSegment);
  const providedBuffer = Buffer.from(signature || "");
  const expectedBuffer = Buffer.from(expected);

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    throw new OAuthStateError("invalid_state_signature");
  }

  let payload;
  try {
    payload = JSON.parse(base64UrlDecode(payloadSegment));
  } catch {
    throw new OAuthStateError("invalid_state_payload");
  }

  if (!payload?.nonce || !payload?.exp || !payload?.mode) {
    throw new OAuthStateError("invalid_state_payload");
  }

  if (Date.now() > payload.exp) {
    throw new OAuthStateError("state_expired");
  }

  // Single-use: atomically consume the nonce; if it wasn't present, the
  // state was already used, expired, or never issued by this server.
  const consumed = await kvGetDel(`${NONCE_PREFIX}${payload.nonce}`);
  if (!consumed) {
    throw new OAuthStateError("state_replayed");
  }

  return {
    mode: payload.mode,
    platform: payload.platform ?? null,
    userId: payload.userId ?? null,
  };
}
