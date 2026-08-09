import Bull from "bull";
import IORedis from "ioredis";
import { env } from "../config/env.js";

function createRedisConnection() {
  return new IORedis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    tls: env.REDIS_URL?.startsWith("rediss://") ? {} : undefined,
  });
}

const processingQueue = new Bull("talishflow-processing", {
  createClient: () => createRedisConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: {
      age: 24 * 60 * 60,
      count: 1000,
    },
    removeOnFail: {
      age: 7 * 24 * 60 * 60,
      count: 5000,
    },
  },
});

export async function enqueueProcessingJob(processingJob) {
  const queueJob = await processingQueue.add(
    "process-video",
    {
      processingJobId: processingJob._id.toString(),
      videoId: processingJob.videoId.toString(),
      userId: processingJob.userId.toString(),
    },
    {
      jobId: processingJob._id.toString(),
    },
  );

  return queueJob;
}

export default processingQueue;
