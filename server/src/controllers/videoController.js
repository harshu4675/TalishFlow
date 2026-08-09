import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { asyncHandler, createError } from "../middleware/errorHandler.js";
import {
  createUploadedVideo,
  createYoutubeVideo,
  sanitizeFilename,
} from "../services/videoService.js";
import {
  ensureDirectory,
  getTemporaryUploadDirectory,
  getUserUploadDirectory,
  mergeChunks,
  deleteDirectory,
  deleteFile,
  getFileSize,
} from "../services/storageService.js";
import {
  extractYouTubeVideoId,
  getYouTubeMetadata,
} from "../services/youtubeMetadataService.js";
import { enqueueProcessingJob } from "../queues/processingQueue.js";
import { emitUploadProgress } from "../websocket/wsServer.js";

const validExtensions = [".mp4", ".mov", ".mkv", ".avi", ".webm"];

function getUploadSessionKey(uploadId) {
  return `talishflow:upload:${uploadId}`;
}

export const uploadFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw createError("Video file is required", 400);
  }

  const clipCount = Number(req.body.clipCount || 10);

  const { video, processingJob } = await createUploadedVideo({
    userId: req.user.id,
    file: req.file,
    clipCount,
  });

  const queueJob = await enqueueProcessingJob(processingJob);

  processingJob.bullJobId = String(queueJob.id);
  await processingJob.save();

  emitUploadProgress(req.user.id, video._id.toString(), {
    status: "uploaded",
    progress: 100,
    videoId: video._id.toString(),
  });

  res.status(201).json({
    success: true,
    message: "Video uploaded and queued for processing",
    data: {
      video,
      processingJob,
    },
  });
});

export const importYoutubeVideo = asyncHandler(async (req, res) => {
  const { url, clipCount } = req.body;
  const videoId = extractYouTubeVideoId(url);

  if (!videoId) {
    throw createError("Invalid YouTube URL", 400);
  }

  const metadata = await getYouTubeMetadata(url);

  const { video, processingJob } = await createYoutubeVideo({
    userId: req.user.id,
    url,
    youtubeVideoId: metadata.videoId,
    title: metadata.title,
    thumbnailUrl: metadata.thumbnailUrl,
    duration: metadata.duration,
    clipCount,
  });

  const queueJob = await enqueueProcessingJob(processingJob);

  processingJob.bullJobId = String(queueJob.id);
  await processingJob.save();

  res.status(201).json({
    success: true,
    message: "YouTube video queued for processing",
    data: {
      video,
      processingJob,
    },
  });
});

export const initializeResumableUpload = asyncHandler(async (req, res) => {
  const { filename, mimeType, fileSize, totalChunks, clipCount } = req.body;
  const extension = path.extname(filename).toLowerCase();

  if (!validExtensions.includes(extension)) {
    throw createError("Unsupported file format", 415);
  }

  const uploadId = crypto.randomUUID();
  const temporaryDirectory = getTemporaryUploadDirectory(req.user.id, uploadId);

  await ensureDirectory(temporaryDirectory);

  const uploadSession = {
    uploadId,
    userId: req.user.id,
    filename,
    mimeType,
    fileSize,
    totalChunks,
    clipCount,
    receivedChunks: [],
    createdAt: new Date().toISOString(),
  };

  const redis = req.app.get("redis");
  await redis.set(
    getUploadSessionKey(uploadId),
    JSON.stringify(uploadSession),
    {
      EX: 24 * 60 * 60,
    },
  );

  res.status(201).json({
    success: true,
    data: {
      uploadId,
      chunkSize: 5 * 1024 * 1024,
      totalChunks,
    },
  });
});

export const uploadChunk = asyncHandler(async (req, res) => {
  const { uploadId, chunkIndex, totalChunks } = req.body;

  if (!req.file) {
    throw createError("Upload chunk is required", 400);
  }

  const redis = req.app.get("redis");
  const sessionRaw = await redis.get(getUploadSessionKey(uploadId));

  if (!sessionRaw) {
    throw createError("Upload session expired or was not found", 404);
  }

  const session = JSON.parse(sessionRaw);

  if (session.userId !== req.user.id) {
    throw createError("You do not have access to this upload session", 403);
  }

  if (Number(totalChunks) !== Number(session.totalChunks)) {
    throw createError("Invalid total chunk count", 400);
  }

  if (
    Number(chunkIndex) < 0 ||
    Number(chunkIndex) >= Number(session.totalChunks)
  ) {
    throw createError("Invalid chunk index", 400);
  }

  const temporaryDirectory = await ensureDirectory(
    getTemporaryUploadDirectory(req.user.id, uploadId),
  );

  const chunkPath = path.join(temporaryDirectory, `${chunkIndex}.part`);

  await fs.rename(req.file.path, chunkPath);

  if (!session.receivedChunks.includes(Number(chunkIndex))) {
    session.receivedChunks.push(Number(chunkIndex));
  }

  const progress = Math.round(
    (session.receivedChunks.length / session.totalChunks) * 100,
  );

  await redis.set(getUploadSessionKey(uploadId), JSON.stringify(session), {
    EX: 24 * 60 * 60,
  });

  emitUploadProgress(req.user.id, uploadId, {
    status: "uploading",
    progress,
    receivedChunks: session.receivedChunks.length,
    totalChunks: session.totalChunks,
  });

  res.json({
    success: true,
    data: {
      uploadId,
      chunkIndex: Number(chunkIndex),
      progress,
      receivedChunks: session.receivedChunks.length,
      totalChunks: session.totalChunks,
    },
  });
});

export const completeResumableUpload = asyncHandler(async (req, res) => {
  const { uploadId, clipCount } = req.body;
  const redis = req.app.get("redis");
  const sessionRaw = await redis.get(getUploadSessionKey(uploadId));

  if (!sessionRaw) {
    throw createError("Upload session expired or was not found", 404);
  }

  const session = JSON.parse(sessionRaw);

  if (session.userId !== req.user.id) {
    throw createError("You do not have access to this upload session", 403);
  }

  if (session.receivedChunks.length !== session.totalChunks) {
    throw createError(
      "All upload chunks must be uploaded before completion",
      400,
    );
  }

  const extension = path.extname(session.filename).toLowerCase();
  const safeFilename = `${Date.now()}-${crypto.randomUUID()}${extension}`;

  const mergedPath = await mergeChunks({
    userId: req.user.id,
    uploadId,
    filename: safeFilename,
    totalChunks: session.totalChunks,
  });

  const fileSize = await getFileSize(mergedPath);

  if (fileSize !== Number(session.fileSize)) {
    await deleteFile(mergedPath);
    throw createError("Uploaded file size verification failed", 400);
  }

  const file = {
    path: mergedPath,
    filename: safeFilename,
    originalname: session.filename,
    mimetype: session.mimeType,
    size: fileSize,
  };

  const { video, processingJob } = await createUploadedVideo({
    userId: req.user.id,
    file,
    clipCount: clipCount || session.clipCount,
  });

  const queueJob = await enqueueProcessingJob(processingJob);

  processingJob.bullJobId = String(queueJob.id);
  await processingJob.save();

  await redis.del(getUploadSessionKey(uploadId));

  emitUploadProgress(req.user.id, uploadId, {
    status: "completed",
    progress: 100,
    videoId: video._id.toString(),
  });

  res.status(201).json({
    success: true,
    message: "Video uploaded and queued for processing",
    data: {
      video,
      processingJob,
    },
  });
});

export const getResumableUploadStatus = asyncHandler(async (req, res) => {
  const { uploadId } = req.params;
  const redis = req.app.get("redis");
  const sessionRaw = await redis.get(getUploadSessionKey(uploadId));

  if (!sessionRaw) {
    throw createError("Upload session expired or was not found", 404);
  }

  const session = JSON.parse(sessionRaw);

  if (session.userId !== req.user.id) {
    throw createError("You do not have access to this upload session", 403);
  }

  res.json({
    success: true,
    data: {
      uploadId: session.uploadId,
      totalChunks: session.totalChunks,
      receivedChunks: session.receivedChunks,
      progress: Math.round(
        (session.receivedChunks.length / session.totalChunks) * 100,
      ),
    },
  });
});

export const cancelResumableUpload = asyncHandler(async (req, res) => {
  const { uploadId } = req.params;
  const redis = req.app.get("redis");
  const sessionRaw = await redis.get(getUploadSessionKey(uploadId));

  if (sessionRaw) {
    const session = JSON.parse(sessionRaw);

    if (session.userId !== req.user.id) {
      throw createError("You do not have access to this upload session", 403);
    }

    await deleteDirectory(getTemporaryUploadDirectory(req.user.id, uploadId));
    await redis.del(getUploadSessionKey(uploadId));
  }

  res.json({
    success: true,
    message: "Upload cancelled",
  });
});
