import { createClient } from "redis";
import { env } from "./env.js";
import logger from "../utils/logger.js";

let redisClient = null;

export async function connectRedis() {
  if (redisClient?.isReady) return redisClient;

  redisClient = createClient({
    url: env.REDIS_URL,
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          logger.error("Redis: Max reconnection attempts reached");
          return new Error("Redis max reconnection attempts reached");
        }
        return Math.min(retries * 100, 3000);
      },
      tls: env.REDIS_URL?.startsWith("rediss://") ? true : undefined,
    },
  });

  redisClient.on("connect", () => logger.info("Redis: Connecting..."));
  redisClient.on("ready", () => logger.info("Redis: Ready"));
  redisClient.on("error", (err) =>
    logger.error("Redis: Error", { error: err.message }),
  );
  redisClient.on("reconnecting", () => logger.warn("Redis: Reconnecting..."));

  await redisClient.connect();

  return redisClient;
}

export function getRedisClient() {
  if (!redisClient?.isReady) {
    throw new Error("Redis client not initialized. Call connectRedis() first.");
  }
  return redisClient;
}

export async function disconnectRedis() {
  if (redisClient?.isReady) {
    await redisClient.quit();
    logger.info("Redis: Disconnected");
  }
}

export default { connectRedis, getRedisClient, disconnectRedis };
