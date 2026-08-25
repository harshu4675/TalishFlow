import { createClient } from "redis";
import { env } from "./env.js";
import logger from "../utils/logger.js";
import { bindRedisClient } from "../services/keyValueStore.js";

let redisClient = null;

/**
 * Connect to Redis. Returns the connected client, or `null` when Redis
 * is unreachable. A missing Redis must never prevent the API from
 * booting — the app falls back to in-memory state and a local job
 * runner in that case (development convenience).
 */
export async function connectRedis() {
  if (redisClient?.isReady) return redisClient;

  const client = createClient({
    url: env.REDIS_URL,
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 5) {
          return new Error("Redis max reconnection attempts reached");
        }
        return Math.min(retries * 250, 2000);
      },
      connectTimeout: 2500,
      tls: env.REDIS_URL?.startsWith("rediss://") ? true : undefined,
    },
  });

  client.on("ready", () => logger.info("Redis: Ready"));
  client.on("error", (err) =>
    logger.error("Redis: Error", { error: err.message }),
  );

  try {
    await client.connect();
    redisClient = client;
    bindRedisClient(client);
    return redisClient;
  } catch (error) {
    logger.warn(
      `Redis: Connection failed (${error.message}). Continuing without Redis.`,
    );
    try {
      await client.disconnect();
    } catch {
      /* already closed */
    }
    redisClient = null;
    bindRedisClient(null);
    return null;
  }
}

export function getRedisClient() {
  return redisClient?.isReady ? redisClient : null;
}

export async function disconnectRedis() {
  if (redisClient?.isReady) {
    await redisClient.quit();
    logger.info("Redis: Disconnected");
  }
}

export default { connectRedis, getRedisClient, disconnectRedis };
