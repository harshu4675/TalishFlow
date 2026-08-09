import Bull from "bull";
import IORedis from "ioredis";
import { env } from "../config/env.js";
import { executePublishingJob } from "../services/publishingService.js";
import logger from "../utils/logger.js";

function createRedisConnection() {
  return new IORedis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    tls: env.REDIS_URL?.startsWith("rediss://") ? {} : undefined,
  });
}

const publishingQueue = new Bull("talishflow-publishing", {
  createClient: () => createRedisConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 10000,
    },
    removeOnComplete: {
      age: 7 * 24 * 60 * 60,
      count: 1000,
    },
    removeOnFail: {
      age: 30 * 24 * 60 * 60,
    },
  },
});

publishingQueue.process("publish", 3, async (queueJob) => {
  const { publishingJobId } = queueJob.data;

  logger.info("Publishing queue job started", { publishingJobId });

  await executePublishingJob(publishingJobId);
});

publishingQueue.on("failed", (queueJob, error) => {
  logger.error("Publishing queue job failed", {
    jobId: queueJob.data.publishingJobId,
    error: error.message,
  });
});

export async function enqueuePublishingJob(publishingJob, scheduledAt) {
  const delay = scheduledAt
    ? Math.max(0, new Date(scheduledAt).getTime() - Date.now())
    : 0;

  const queueJob = await publishingQueue.add(
    "publish",
    { publishingJobId: publishingJob._id.toString() },
    { delay },
  );

  return queueJob;
}

export default publishingQueue;
