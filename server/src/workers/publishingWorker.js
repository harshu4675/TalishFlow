import { executePublishingJob } from "../services/publishingService.js";
import logger from "../utils/logger.js";

/**
 * Publishing queue handler — thin adapter between the queue manager and
 * the publishing service. Kept separate so the queue backend (Bull or
 * local) never needs to know about domain services.
 */
export async function handlePublish(queueJob) {
  const { publishingJobId } = queueJob.data;

  if (!publishingJobId) {
    throw new Error("Publishing queue job missing publishingJobId");
  }

  logger.info("Publishing job started", { publishingJobId });

  await executePublishingJob(publishingJobId);
}

export default handlePublish;
