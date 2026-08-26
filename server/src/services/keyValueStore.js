import logger from "../utils/logger.js";

/**
 * Small key-value abstraction used for short-lived server state
 * (resumable upload sessions, OAuth state nonces).
 *
 * Primary backend: Redis. When Redis is unavailable (e.g. local
 * development without a Redis server), an in-process Map with TTL
 * sweeping is used so the application remains fully functional.
 * Jobs/sessions will not survive a restart in fallback mode — that
 * is acceptable for development and logged clearly at startup.
 */

const memoryStore = new Map();
let redisClient = null;
let usingMemory = false;

function sweepExpired() {
  const now = Date.now();
  for (const [key, entry] of memoryStore) {
    if (entry.expiresAt !== null && entry.expiresAt <= now) {
      memoryStore.delete(key);
    }
  }
}

// Sweep every 60s, unref so it never keeps the process alive
const sweeper = setInterval(sweepExpired, 60_000);
sweeper.unref?.();

export function bindRedisClient(client) {
  redisClient = client;
  usingMemory = !client;

  if (!client) {
    logger.warn(
      "KeyValueStore: Redis unavailable — using in-memory store " +
        "(state will NOT survive restarts; fine for development)",
    );
  } else {
    logger.info("KeyValueStore: Using Redis backend");
  }
}

export function isUsingMemoryStore() {
  return usingMemory;
}

/**
 * Set a JSON-serializable value with a TTL in seconds.
 */
export async function kvSet(key, value, ttlSeconds) {
  const serialized = JSON.stringify(value);

  if (redisClient) {
    await redisClient.set(key, serialized, { EX: ttlSeconds });
    return;
  }

  memoryStore.set(key, {
    value: serialized,
    expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
  });
}

/**
 * Get and JSON-parse a value (null when missing/expired).
 */
export async function kvGet(key) {
  let serialized;

  if (redisClient) {
    serialized = await redisClient.get(key);
  } else {
    const entry = memoryStore.get(key);
    if (!entry) return null;
    if (entry.expiresAt !== null && entry.expiresAt <= Date.now()) {
      memoryStore.delete(key);
      return null;
    }
    serialized = entry.value;
  }

  if (serialized == null) return null;

  try {
    return JSON.parse(serialized);
  } catch {
    return null;
  }
}

/**
 * Set only when the key does not exist (atomic with Redis, best-effort
 * in-memory). Returns true when the key was set.
 */
export async function kvSetNX(key, value, ttlSeconds) {
  const serialized = JSON.stringify(value);

  if (redisClient) {
    const result = await redisClient.set(key, serialized, {
      EX: ttlSeconds,
      NX: true,
    });
    return result === "OK";
  }

  if (memoryStore.has(key)) {
    const existing = await kvGet(key);
    if (existing !== null) return false;
  }

  memoryStore.set(key, {
    value: serialized,
    expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
  });
  return true;
}

export async function kvDel(key) {
  if (redisClient) {
    await redisClient.del(key);
    return;
  }
  memoryStore.delete(key);
}

/**
 * Atomic get-and-delete (used for single-use tokens/nonces).
 * Returns the parsed value or null.
 */
export async function kvGetDel(key) {
  if (redisClient) {
    const serialized = await redisClient.getDel(key);
    if (serialized == null) return null;
    try {
      return JSON.parse(serialized);
    } catch {
      return null;
    }
  }

  const value = await kvGet(key);
  if (value !== null) memoryStore.delete(key);
  return value;
}

export default {
  bindRedisClient,
  kvSet,
  kvGet,
  kvSetNX,
  kvDel,
  kvGetDel,
  isUsingMemoryStore,
};
