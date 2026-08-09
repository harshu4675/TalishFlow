import { asyncHandler, createError } from "../middleware/errorHandler.js";
import { z } from "zod";
import PublishingJob from "../models/PublishingJob.js";
import Clip from "../models/Clip.js";
import OAuthToken from "../models/OAuthToken.js";
import {
  createPublishingJob,
  executePublishingJob,
} from "../services/publishingService.js";
import {
  getYouTubeChannelInfo,
  getYouTubePlaylists,
  getYouTubeVideoCategories,
} from "../services/youtubeService.js";
import {
  getInstagramAccountInfo,
  getInstagramPublishingLimit,
} from "../services/instagramService.js";
import { enqueuePublishingJob } from "../queues/publishingQueue.js";
import logger from "../utils/logger.js";

export const createJob = asyncHandler(async (req, res) => {
  const {
    clipId,
    platform,
    title,
    description,
    hashtags,
    tags,
    scheduledAt,
    youtubeConfig,
    instagramConfig,
  } = req.body;

  if (!clipId) throw createError("clipId is required", 400);
  if (!platform) throw createError("platform is required", 400);
  if (!["youtube", "instagram"].includes(platform)) {
    throw createError("platform must be youtube or instagram", 400);
  }

  const job = await createPublishingJob({
    userId: req.user.id,
    clipId,
    platform,
    title,
    description,
    hashtags,
    tags,
    scheduledAt,
    youtubeConfig,
    instagramConfig,
  });

  if (scheduledAt) {
    const queueJob = await enqueuePublishingJob(job, scheduledAt);

    await PublishingJob.findByIdAndUpdate(job._id, {
      "meta.bullJobId": queueJob.id.toString(),
    });
  }

  res.status(201).json({
    success: true,
    message: scheduledAt
      ? "Publishing job scheduled successfully"
      : "Publishing started",
    data: { job },
  });
});

export const listJobs = asyncHandler(async (req, res) => {
  const {
    platform,
    status,
    limit = 20,
    page = 1,
    sort = "-createdAt",
  } = req.query;

  const filter = { userId: req.user.id };

  if (platform) filter.platform = platform;
  if (status) filter.status = status;

  const [jobs, total] = await Promise.all([
    PublishingJob.find(filter)
      .populate("clipId", "title thumbnailPath duration")
      .sort(sort)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .lean(),
    PublishingJob.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      jobs,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    },
  });
});

export const getJob = asyncHandler(async (req, res) => {
  const job = await PublishingJob.findOne({
    _id: req.params.id,
    userId: req.user.id,
  })
    .populate("clipId", "title thumbnailPath duration width height")
    .lean();

  if (!job) throw createError("Publishing job not found", 404);

  res.json({ success: true, data: { job } });
});

export const cancelJob = asyncHandler(async (req, res) => {
  const job = await PublishingJob.findOne({
    _id: req.params.id,
    userId: req.user.id,
  });

  if (!job) throw createError("Publishing job not found", 404);

  if (!["pending", "queued"].includes(job.status)) {
    throw createError(`Cannot cancel a job with status: ${job.status}`, 400);
  }

  job.status = "cancelled";
  await job.save();

  res.json({ success: true, message: "Publishing job cancelled" });
});

export const retryJob = asyncHandler(async (req, res) => {
  const job = await PublishingJob.findOne({
    _id: req.params.id,
    userId: req.user.id,
  });

  if (!job) throw createError("Publishing job not found", 404);

  if (job.status !== "failed") {
    throw createError("Only failed jobs can be retried", 400);
  }

  job.status = "queued";
  job.retryCount = 0;
  job.errorMessage = undefined;
  await job.save();

  executePublishingJob(job._id.toString()).catch((error) => {
    logger.error("Retry publishing job failed", {
      jobId: job._id,
      error: error.message,
    });
  });

  res.json({
    success: true,
    message: "Publishing job queued for retry",
    data: { job },
  });
});

export const getScheduledPosts = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const posts = await PublishingJob.find({
    userId: req.user.id,
    status: { $in: ["pending", "published", "queued"] },
  })
    .populate("clipId", "title thumbnailPath duration")
    .sort({ scheduledAt: 1, createdAt: -1 })
    .limit(Number(limit))
    .lean();

  res.json({ success: true, data: { posts } });
});

export const getYouTubeData = asyncHandler(async (req, res) => {
  const [channelInfo, playlists, categories] = await Promise.all([
    getYouTubeChannelInfo(req.user.id),
    getYouTubePlaylists(req.user.id),
    getYouTubeVideoCategories(req.user.id),
  ]);

  res.json({
    success: true,
    data: { channelInfo, playlists, categories },
  });
});

export const getInstagramData = asyncHandler(async (req, res) => {
  const [accountInfo, publishingLimit] = await Promise.all([
    getInstagramAccountInfo(req.user.id),
    getInstagramPublishingLimit(req.user.id),
  ]);

  res.json({
    success: true,
    data: { accountInfo, publishingLimit },
  });
});
