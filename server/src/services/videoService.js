import path from "path";
import crypto from "crypto";
import Video from "../models/Video.js";
import ProcessingJob from "../models/ProcessingJob.js";
import { createError } from "../middleware/errorHandler.js";
import { getFileSize } from "./storageService.js";

const VIDEO_TTL_HOURS = 24;

export function getScheduledDeletionDate() {
  return new Date(Date.now() + VIDEO_TTL_HOURS * 60 * 60 * 1000);
}

export function sanitizeFilename(filename) {
  const extension = path.extname(filename).toLowerCase();
  const basename = path
    .basename(filename, extension)
    .replace(/[^a-zA-Z0-9-_ ]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 120);

  const random = crypto.randomBytes(6).toString("hex");

  return `${basename || "video"}-${Date.now()}-${random}${extension}`;
}

export async function createUploadedVideo({ userId, file, clipCount = 10 }) {
  if (!file?.path) {
    throw createError("Uploaded file is required", 400);
  }

  const title = path.basename(
    file.originalname,
    path.extname(file.originalname),
  );
  const scheduledDeletion = getScheduledDeletionDate();

  const video = await Video.create({
    userId,
    title,
    source: "upload",
    originalFilename: file.originalname,
    filePath: file.path,
    fileSize: file.size,
    mimeType: file.mimetype,
    processingStatus: "queued",
    processingProgress: 0,
    scheduledDeletion,
  });

  const processingJob = await ProcessingJob.create({
    userId,
    videoId: video._id,
    videoTitle: video.title,
    status: "queued",
    progress: 0,
    currentStep: "Waiting in queue",
    clipCountRequested: clipCount,
  });

  video.processingJobId = processingJob._id.toString();
  await video.save();

  return { video, processingJob };
}

export async function createYoutubeVideo({
  userId,
  url,
  youtubeVideoId,
  title,
  thumbnailUrl,
  duration,
  clipCount = 10,
}) {
  const scheduledDeletion = getScheduledDeletionDate();

  const video = await Video.create({
    userId,
    title: title || "YouTube Video",
    source: "youtube",
    youtubeUrl: url,
    youtubeVideoId,
    thumbnailUrl,
    duration,
    processingStatus: "queued",
    processingProgress: 0,
    scheduledDeletion,
  });

  const processingJob = await ProcessingJob.create({
    userId,
    videoId: video._id,
    videoTitle: video.title,
    status: "queued",
    progress: 0,
    currentStep: "Waiting to download YouTube video",
    clipCountRequested: clipCount,
  });

  video.processingJobId = processingJob._id.toString();
  await video.save();

  return { video, processingJob };
}

export async function getUserVideo(userId, videoId) {
  const video = await Video.findOne({
    _id: videoId,
    userId,
    isDeleted: false,
  });

  if (!video) {
    throw createError("Video not found", 404);
  }

  return video;
}

export async function updateVideoProgress(videoId, status, progress) {
  return Video.findByIdAndUpdate(
    videoId,
    {
      processingStatus: status,
      processingProgress: progress,
    },
    { new: true },
  );
}
