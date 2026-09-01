import path from "path";
import crypto from "crypto";
import Video from "../models/Video.js";
import ProcessingJob from "../models/ProcessingJob.js";
import { createError } from "../middleware/errorHandler.js";
import { getFileSize } from "./storageService.js";
import { parseIso8601Duration } from "./youtubeMetadataService.js";

const VIDEO_TTL_HOURS = 24;

const MAX_TITLE_LENGTH = 200; // must match Video.title maxlength

function normalizeTitle(title, fallback = "Video") {
  const cleaned =
    typeof title === "string" ? title.replace(/\s+/g, " ").trim() : null;
  if (!cleaned) return fallback;
  return cleaned.length > MAX_TITLE_LENGTH
    ? cleaned.slice(0, MAX_TITLE_LENGTH).trim()
    : cleaned;
}

/**
 * Duration must be stored as whole seconds (Number) — the Video schema
 * rejects anything else with a validation error.
 */
function normalizeDuration(duration) {
  const seconds = parseIso8601Duration(duration);
  return seconds !== null && seconds >= 0 ? seconds : null;
}

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

  const title = normalizeTitle(
    path.basename(file.originalname, path.extname(file.originalname)),
    "Video",
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
    title: normalizeTitle(title, "YouTube Video"),
    source: "youtube",
    youtubeUrl: url,
    youtubeVideoId,
    thumbnailUrl: typeof thumbnailUrl === "string" ? thumbnailUrl : null,
    duration: normalizeDuration(duration),
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
