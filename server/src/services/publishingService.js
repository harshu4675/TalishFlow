import fs from "fs";
import PublishingJob from "../models/PublishingJob.js";
import Clip from "../models/Clip.js";
import User from "../models/User.js";
import OAuthToken from "../models/OAuthToken.js";
import { uploadVideoToYouTube } from "./youtubeService.js";
import { uploadReelToInstagram } from "./instagramService.js";
import { buildSignedMediaUrl } from "./mediaTokenService.js";
import { emitToUser } from "../websocket/wsServer.js";
import { createError } from "../middleware/errorHandler.js";
import logger from "../utils/logger.js";
import { env } from "../config/env.js";

export async function createPublishingJob({
  userId,
  clipId,
  platform,
  title,
  description,
  hashtags,
  tags,
  scheduledAt,
  youtubeConfig,
  instagramConfig,
}) {
  const clip = await Clip.findOne({
    _id: clipId,
    userId,
    isDeleted: false,
  });

  if (!clip) throw createError("Clip not found", 404);
  if (!clip.filePath) throw createError("Clip file is not available", 404);

  const token = await OAuthToken.findOne({ userId, platform });

  if (!token || !token.isValid) {
    throw createError(
      `Your ${platform} account is not connected. Go to Settings to connect it.`,
      400,
    );
  }

  const job = await PublishingJob.create({
    userId,
    clipId,
    platform,
    title,
    description,
    hashtags: hashtags || [],
    tags: tags || [],
    scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
    status: scheduledAt ? "pending" : "queued",
    youtubeConfig: youtubeConfig || {},
    instagramConfig: instagramConfig || {},
  });

  if (!scheduledAt) {
    executePublishingJob(job._id.toString()).catch((error) => {
      logger.error("Publishing job execution failed", {
        jobId: job._id,
        error: error.message,
      });
    });
  }

  return job;
}

export async function executePublishingJob(jobId) {
  const job = await PublishingJob.findById(jobId);

  if (!job) throw new Error(`Publishing job ${jobId} not found`);

  const clip = await Clip.findById(job.clipId);

  if (!clip || !clip.filePath) {
    await failJob(job, "Clip file is not available for publishing");
    return;
  }

  const userId = job.userId.toString();

  try {
    await PublishingJob.findByIdAndUpdate(jobId, {
      status: "publishing",
    });

    emitToUser(userId, "publish:start", {
      jobId,
      platform: job.platform,
      clipId: clip._id,
    });

    let result;

    if (job.platform === "youtube") {
      result = await publishToYouTube(job, clip, userId);
    } else if (job.platform === "instagram") {
      result = await publishToInstagram(job, clip, userId);
    } else {
      throw new Error(`Unsupported platform: ${job.platform}`);
    }

    await PublishingJob.findByIdAndUpdate(jobId, {
      status: "published",
      publishedAt: new Date(),
      platformVideoId: result.videoId || result.mediaId,
      platformVideoUrl: result.videoUrl || result.mediaUrl,
    });

    await User.findByIdAndUpdate(userId, {
      $inc: { "stats.totalPublished": 1 },
    });

    emitToUser(userId, "publish:complete", {
      jobId,
      platform: job.platform,
      clipId: clip._id,
      videoUrl: result.videoUrl || result.mediaUrl,
      platformVideoId: result.videoId || result.mediaId,
    });

    logger.info("Publishing job completed", {
      jobId,
      platform: job.platform,
      userId,
    });
  } catch (error) {
    await failJob(job, error.message);

    emitToUser(userId, "publish:error", {
      jobId,
      platform: job.platform,
      error: error.message,
    });
  }
}

async function publishToYouTube(job, clip, userId) {
  const caption = buildDescription(job);

  return uploadVideoToYouTube({
    userId,
    filePath: clip.filePath,
    title: job.title || clip.title || "TalishFlow Short",
    description: caption,
    tags: job.tags || [],
    categoryId: job.youtubeConfig?.categoryId,
    privacyStatus: job.youtubeConfig?.visibility || "public",
    playlistId: job.youtubeConfig?.playlistId,
    madeForKids: job.youtubeConfig?.madeForKids || false,
    thumbnailPath: clip.thumbnailPath,
    scheduledPublishTime: job.scheduledAt,
    onProgress: (percent) => {
      emitToUser(userId, "publish:progress", {
        jobId: job._id,
        platform: "youtube",
        progress: percent,
      });
    },
  });
}

async function publishToInstagram(job, clip, userId) {
  // Instagram's servers must be able to reach the media over the public
  // internet. We issue a signed, short-lived PUBLIC URL; in production it
  // must be HTTPS (Meta requirement).
  if (env.NODE_ENV === "production" && !env.PUBLIC_API_URL.startsWith("https://")) {
    throw new Error(
      "Instagram publishing requires the API to be reachable over HTTPS. " +
        "Set PUBLIC_API_URL to your public API domain.",
    );
  }

  const videoPublicUrl = buildSignedMediaUrl({
    clipId: clip._id.toString(),
    scope: "publish",
    ttlSeconds: 45 * 60, // Instagram fetches media asynchronously
  });

  const caption = buildDescription(job);

  return uploadReelToInstagram({
    userId,
    videoUrl: videoPublicUrl,
    caption,
    shareToFeed: job.instagramConfig?.shareToFeed !== false,
    scheduledPublishTime: job.scheduledAt,
    onProgress: (percent) => {
      emitToUser(userId, "publish:progress", {
        jobId: job._id,
        platform: "instagram",
        progress: percent,
      });
    },
  });
}

function buildDescription(job) {
  const parts = [];

  if (job.description) parts.push(job.description);
  if (job.hashtags?.length) parts.push(job.hashtags.join(" "));

  return parts.join("\n\n").slice(0, 5000);
}

/**
 * Mark a publishing job as failed with the real error.
 *
 * Automatic in-service re-queueing used to silently flip failed jobs back
 * to "queued" WITHOUT re-executing them — leaving endless "queued" jobs.
 * Recovery is explicit now: the queue backend retries transient failures
 * (Bull attempts), and the user can always hit "Retry" on a failed job.
 */
async function failJob(job, errorMessage) {
  await PublishingJob.findByIdAndUpdate(job._id, {
    status: "failed",
    errorMessage,
  });

  logger.error("publication.failed", {
    jobId: job._id,
    platform: job.platform,
    error: errorMessage,
  });
}
