import { env } from "../config/env.js";
import { getRedisClient } from "../config/redis.js";
import logger from "../utils/logger.js";

/**
 * Job queue manager.
 *
 * Production: Bull queues backed by Redis (durable, retried, distributed).
 * Fallback: a local in-process queue runner used when Redis is unreachable
 * (typical for bare local development). The same job handlers run either
 * way — no functional difference from the user's perspective — but local
 * jobs are not persisted across restarts, which is logged at startup.
 *
 * Queue users only interact with the enqueue*() helpers below.
 */

let bullProcessingQueue = null;
let bullPublishingQueue = null;
let localDriver = null;
let initialized = false;

let processingHandler = null;
let publishingHandler = null;

// ── Local in-process queue driver ────────────────────────────

class LocalQueueDriver {
  constructor() {
    this.jobs = [];
    this.active = 0;
    this.concurrency = 2;
    this.counter = 0;
    this.pendingTimers = new Set();
  }

  add(name, data, options = {}) {
    const job = {
      id: options.jobId || `local-${++this.counter}`,
      name,
      data,
      attempts: 0,
      maxAttempts: options.attempts || 3,
      backoff: options.backoff?.delay || 5000,
      delay: options.delay || 0,
    };

    if (job.delay > 0) {
      const timer = setTimeout(() => {
        this.pendingTimers.delete(timer);
        this.jobs.push(job);
        this.drain();
      }, job.delay);
      timer.unref?.();
      this.pendingTimers.add(timer);
    } else {
      this.jobs.push(job);
    }

    this.drain();

    return Promise.resolve(job);
  }

  drain() {
    while (this.active < this.concurrency && this.jobs.length > 0) {
      const job = this.jobs.shift();
      this.active += 1;

      this.execute(job)
        .catch(() => {})
        .finally(() => {
          this.active -= 1;
          this.drain();
        });
    }
  }

  async execute(job) {
    const handler =
      job.name === "process-video" ? processingHandler : publishingHandler;

    if (!handler) {
      logger.error("LocalQueue: no handler registered for job", {
        name: job.name,
      });
      return;
    }

    try {
      await handler(job);
    } catch (error) {
      job.attempts += 1;
      logger.error("LocalQueue: job failed", {
        id: job.id,
        name: job.name,
        attempt: job.attempts,
        error: error.message,
      });

      if (job.attempts < job.maxAttempts) {
        const delay = job.backoff * 2 ** (job.attempts - 1);
        const timer = setTimeout(() => {
          this.pendingTimers.delete(timer);
          this.jobs.push(job);
          this.drain();
        }, delay);
        timer.unref?.();
        this.pendingTimers.add(timer);
      }
    }
  }
}

// ── Initialization ───────────────────────────────────────────

export async function initQueues({ onProcessVideo, onPublish }) {
  if (initialized) return;

  processingHandler = onProcessVideo;
  publishingHandler = onPublish;

  const redis = getRedisClient();

  if (redis) {
    const [{ default: Bull }, { default: IORedis }] = await Promise.all([
      import("bull"),
      import("ioredis"),
    ]);

    const createRedisConnection = () =>
      new IORedis(env.REDIS_URL, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        tls: env.REDIS_URL?.startsWith("rediss://") ? {} : undefined,
      });

    bullProcessingQueue = new Bull("talishflow-processing", {
      createClient: createRedisConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: { age: 24 * 60 * 60, count: 1000 },
        removeOnFail: { age: 7 * 24 * 60 * 60, count: 5000 },
      },
    });

    bullPublishingQueue = new Bull("talishflow-publishing", {
      createClient: createRedisConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 10000 },
        removeOnComplete: { age: 7 * 24 * 60 * 60, count: 1000 },
        removeOnFail: { age: 30 * 24 * 60 * 60 },
      },
    });

    bullProcessingQueue.process("process-video", 2, async (job) =>
      processingHandler(job),
    );

    bullPublishingQueue.process("publish", 3, async (job) =>
      publishingHandler(job),
    );

    bullProcessingQueue.on("failed", (job, error) =>
      logger.error("Processing queue job failed", {
        jobId: job?.data?.processingJobId,
        error: error.message,
      }),
    );

    bullPublishingQueue.on("failed", (job, error) =>
      logger.error("Publishing queue job failed", {
        jobId: job?.data?.publishingJobId,
        error: error.message,
      }),
    );

    logger.info("Queues: Bull queues active (Redis backend)");
  } else {
    localDriver = new LocalQueueDriver();
    logger.warn(
      "Queues: Redis unavailable — using local in-process queue. " +
        "Jobs run in this process and are NOT persisted across restarts.",
    );
  }

  initialized = true;
}

// ── Public enqueue API (used by controllers) ─────────────────

export async function enqueueProcessingJob(processingJob) {
  const payload = {
    processingJobId: processingJob._id.toString(),
    videoId: processingJob.videoId.toString(),
    userId: processingJob.userId.toString(),
  };

  if (bullProcessingQueue) {
    return bullProcessingQueue.add("process-video", payload, {
      jobId: processingJob._id.toString(),
    });
  }

  if (!localDriver) throw new Error("Queue system not initialized");
  return localDriver.add("process-video", payload, {
    jobId: processingJob._id.toString(),
  });
}

export async function enqueuePublishingJob(publishingJob, scheduledAt = null) {
  const delay = scheduledAt
    ? Math.max(0, new Date(scheduledAt).getTime() - Date.now())
    : 0;

  const payload = { publishingJobId: publishingJob._id.toString() };

  if (bullPublishingQueue) {
    return bullPublishingQueue.add("publish", payload, { delay });
  }

  if (!localDriver) throw new Error("Queue system not initialized");
  return localDriver.add("publish", payload, { delay });
}

export function getQueueMode() {
  if (bullProcessingQueue) return "redis";
  if (localDriver) return "local";
  return "uninitialized";
}

export default {
  initQueues,
  enqueueProcessingJob,
  enqueuePublishingJob,
  getQueueMode,
};
