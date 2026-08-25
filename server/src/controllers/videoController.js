import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { asyncHandler, createError } from "../middleware/errorHandler.js";
import {
  createUploadedVideo,
  createYoutubeVideo,
} from "../services/videoService.js";
import {
  ensureDirectory,
  getTemporaryUploadDirectory,
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
import { kvSet, kvGet, kvDel } from "../services/keyValueStore.js";
import {
  normalizeClipCount,
  VIDEO_CONTENT_SIGNATURES,
} from "../utils/constants.js";
import logger from "../utils/logger.js";

const validExtensions = [".mp4", ".mov", ".mkv", ".avi", ".webm"];
const UPLOAD_SESSION_TTL_SECONDS = 24 * 60 * 60;

function getUploadSessionKey(uploadId) {
  return `talishflow:upload:${uploadId}`;
}

/**
 * Sniff the first bytes of a merged file and make sure it is really a
 * video container — not a renamed executable or document. Defense in
 * depth on top of MIME/extension validation (both client-spoofable).
 */
async function sniffIsVideoContainer(filePath) {
  let handle;
  try {
    handle = await fs.open(filePath, "r");
    const buffer = Buffer.alloc(16);
    await handle.read(buffer, 0, 16, 0);

    return VIDEO_CONTENT_SIGNATURES.some(({ bytes, offset }) =>
      bytes.every((byte, index) => buffer[offset + index] === byte),
    );
  } catch {
    return false;
  } finally {
    await handle?.close().catch(() => {});
  }
}

export const uploadFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw createError("Video file is required", 400, {
      code: "VIDEO_FILE_REQUIRED",
    });
  }

  const clipCount = normalizeClipCount(req.body.clipCount);

  // Content sniff — extension/MIME were validated by multer, both are
  // client-controlled and cannot be trusted on their own.
  if (!(await sniffIsVideoContainer(req.file.path))) {
    await deleteFile(req.file.path).catch(() => {});
    throw createError(
      "The uploaded file does not look like a valid video. Please export it as MP4/MOV and try again.",
      415,
      { code: "INVALID_FILE_CONTENT" },
    );
  }

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
  const { url } = req.body;
  const clipCount = normalizeClipCount(req.body.clipCount);

  const videoId = extractYouTubeVideoId(url);

  if (!videoId) {
    throw createError(
      "That doesn't look like a supported YouTube link. Use a watch, share (youtu.be), or Shorts URL.",
      400,
      { code: "YOUTUBE_URL_INVALID" },
    );
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
  const extension = path.extname(filename || "").toLowerCase();

  if (!validExtensions.includes(extension)) {
    throw createError(
      "Unsupported file format. Use MP4, MOV, MKV, AVI, or WebM.",
      415,
      { code: "UNSUPPORTED_FILE_TYPE" },
    );
  }

  const maxFileSize = Number(process.env.MAX_FILE_SIZE || 5368709120);
  if (Number(fileSize) > maxFileSize) {
    throw createError(
      `File is too large. Maximum size is ${Math.round(maxFileSize / 1024 ** 3)}GB.`,
      413,
      { code: "FILE_TOO_LARGE" },
    );
  }

  const uploadId = crypto.randomUUID();
  const temporaryDirectory = getTemporaryUploadDirectory(req.user.id, uploadId);

  await ensureDirectory(temporaryDirectory);

  const uploadSession = {
    uploadId,
    userId: req.user.id,
    filename: path.basename(filename), // strip any directory components
    mimeType,
    fileSize,
    totalChunks,
    clipCount: normalizeClipCount(clipCount),
    receivedChunks: [],
    createdAt: new Date().toISOString(),
  };

  await kvSet(
    getUploadSessionKey(uploadId),
    uploadSession,
    UPLOAD_SESSION_TTL_SECONDS,
  );

  logger.info("video.upload.started", { userId: req.user.id, uploadId });

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
    throw createError("Upload chunk is required", 400, {
      code: "UPLOAD_CHUNK_REQUIRED",
    });
  }

  const session = await kvGet(getUploadSessionKey(uploadId));

  if (!session) {
    await deleteFile(req.file.path).catch(() => {});
    throw createError(
      "Upload session expired or was not found. Please restart the upload.",
      404,
      { code: "UPLOAD_SESSION_EXPIRED" },
    );
  }

  if (session.userId !== req.user.id) {
    await deleteFile(req.file.path).catch(() => {});
    throw createError("You do not have access to this upload session", 403, {
      code: "UPLOAD_SESSION_FORBIDDEN",
    });
  }

  if (Number(totalChunks) !== Number(session.totalChunks)) {
    await deleteFile(req.file.path).catch(() => {});
    throw createError("Invalid total chunk count", 400, {
      code: "UPLOAD_INVALID_CHUNKS",
    });
  }

  if (
    Number(chunkIndex) < 0 ||
    Number(chunkIndex) >= Number(session.totalChunks)
  ) {
    await deleteFile(req.file.path).catch(() => {});
    throw createError("Invalid chunk index", 400, {
      code: "UPLOAD_INVALID_CHUNK_INDEX",
    });
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

  await kvSet(
    getUploadSessionKey(uploadId),
    session,
    UPLOAD_SESSION_TTL_SECONDS,
  );

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
  const { uploadId } = req.body;
  const clipCount = normalizeClipCount(
    req.body.clipCount ?? undefined,
  );

  const session = await kvGet(getUploadSessionKey(uploadId));

  if (!session) {
    throw createError(
      "Upload session expired or was not found. Please restart the upload.",
      404,
      { code: "UPLOAD_SESSION_EXPIRED" },
    );
  }

  if (session.userId !== req.user.id) {
    throw createError("You do not have access to this upload session", 403, {
      code: "UPLOAD_SESSION_FORBIDDEN",
    });
  }

  if (session.receivedChunks.length !== session.totalChunks) {
    throw createError(
      "Some chunks are missing. The upload is incomplete — it will resume where it left off.",
      400,
      { code: "UPLOAD_INCOMPLETE" },
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
    throw createError(
      "The uploaded file failed integrity verification. Please try again.",
      400,
      { code: "UPLOAD_INTEGRITY_FAILED" },
    );
  }

  if (!(await sniffIsVideoContainer(mergedPath))) {
    await deleteFile(mergedPath);
    await deleteDirectory(
      getTemporaryUploadDirectory(req.user.id, uploadId),
    ).catch(() => {});
    throw createError(
      "The uploaded file does not look like a valid video. Please export it as MP4/MOV and try again.",
      415,
      { code: "INVALID_FILE_CONTENT" },
    );
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

  await kvDel(getUploadSessionKey(uploadId));

  logger.info("video.upload.completed", {
    userId: req.user.id,
    videoId: video._id,
    uploadId,
  });

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
  const session = await kvGet(getUploadSessionKey(uploadId));

  if (!session) {
    throw createError("Upload session expired or was not found", 404, {
      code: "UPLOAD_SESSION_EXPIRED",
    });
  }

  if (session.userId !== req.user.id) {
    throw createError("You do not have access to this upload session", 403, {
      code: "UPLOAD_SESSION_FORBIDDEN",
    });
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
  const session = await kvGet(getUploadSessionKey(uploadId));

  if (session) {
    if (session.userId !== req.user.id) {
      throw createError("You do not have access to this upload session", 403, {
        code: "UPLOAD_SESSION_FORBIDDEN",
      });
    }

    await deleteDirectory(getTemporaryUploadDirectory(req.user.id, uploadId));
    await kvDel(getUploadSessionKey(uploadId));
  }

  res.json({
    success: true,
    message: "Upload cancelled",
  });
});
