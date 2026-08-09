import cron from "node-cron";
import path from "path";
import fs from "fs/promises";
import Video from "../models/Video.js";
import Clip from "../models/Clip.js";
import PublishingJob from "../models/PublishingJob.js";
import { deleteFile } from "../services/storageService.js";
import logger from "../utils/logger.js";

async function deleteExpiredVideos() {
  const now = new Date();

  const expiredVideos = await Video.find({
    $or: [
      { scheduledDeletion: { $lte: now }, isDeleted: false },
      { isDeleted: true, filePath: { $exists: true, $ne: null } },
    ],
  })
    .select("filePath thumbnailPath isDeleted")
    .limit(100);

  let deleted = 0;

  for (const video of expiredVideos) {
    try {
      if (video.filePath) await deleteFile(video.filePath);
      if (video.thumbnailPath) await deleteFile(video.thumbnailPath);

      await Video.findByIdAndUpdate(video._id, {
        isDeleted: true,
        filePath: null,
        thumbnailPath: null,
      });

      deleted++;
    } catch (error) {
      logger.error("Failed to delete expired video", {
        videoId: video._id,
        error: error.message,
      });
    }
  }

  if (deleted > 0) {
    logger.info("Expired videos cleaned up", { count: deleted });
  }
}

async function deleteExpiredClips() {
  const now = new Date();

  const expiredClips = await Clip.find({
    scheduledDeletion: { $lte: now },
    isDeleted: false,
  })
    .select("filePath thumbnailPath subtitles exportedVersions")
    .limit(200);

  let deleted = 0;

  for (const clip of expiredClips) {
    try {
      if (clip.filePath) await deleteFile(clip.filePath);
      if (clip.thumbnailPath) await deleteFile(clip.thumbnailPath);
      if (clip.subtitles?.srtPath) await deleteFile(clip.subtitles.srtPath);

      if (clip.exportedVersions?.length) {
        for (const version of clip.exportedVersions) {
          if (version.filePath) await deleteFile(version.filePath);
        }
      }

      await Clip.findByIdAndUpdate(clip._id, {
        isDeleted: true,
        filePath: null,
        thumbnailPath: null,
        exportedVersions: [],
      });

      deleted++;
    } catch (error) {
      logger.error("Failed to delete expired clip", {
        clipId: clip._id,
        error: error.message,
      });
    }
  }

  if (deleted > 0) {
    logger.info("Expired clips cleaned up", { count: deleted });
  }
}

async function deleteExpiredExports() {
  const now = new Date();

  const clipsWithExpiredExports = await Clip.find({
    "exportedVersions.expiresAt": { $lte: now },
    isDeleted: false,
  }).select("exportedVersions");

  for (const clip of clipsWithExpiredExports) {
    const stillValid = [];
    const expired = [];

    for (const version of clip.exportedVersions || []) {
      if (version.expiresAt && version.expiresAt <= now) {
        expired.push(version);
      } else {
        stillValid.push(version);
      }
    }

    for (const version of expired) {
      if (version.filePath)
        await deleteFile(version.filePath).catch(() => null);
    }

    if (expired.length > 0) {
      await Clip.findByIdAndUpdate(clip._id, {
        exportedVersions: stillValid,
      });
    }
  }
}

async function cleanupOrphanedWorkDirectories() {
  try {
    const { getUserUploadDirectory } =
      await import("../services/storageService.js");
    const { env } = await import("../config/env.js");
    const uploadRoot = path.resolve(env.UPLOAD_DIR);

    const userDirs = await fs.readdir(uploadRoot).catch(() => []);

    for (const userDir of userDirs) {
      if (userDir.startsWith(".")) continue;

      const userPath = path.join(uploadRoot, userDir);
      const entries = await fs.readdir(userPath).catch(() => []);

      for (const entry of entries) {
        if (entry.startsWith(".work-")) {
          const workPath = path.join(userPath, entry);
          const stat = await fs.stat(workPath).catch(() => null);

          if (stat && Date.now() - stat.mtimeMs > 2 * 60 * 60 * 1000) {
            await fs
              .rm(workPath, { recursive: true, force: true })
              .catch(() => null);
            logger.info("Cleaned up orphaned work directory", {
              path: workPath,
            });
          }
        }
      }
    }
  } catch (error) {
    logger.warn("Work directory cleanup failed", { error: error.message });
  }
}

export function startCleanupWorker() {
  cron.schedule("0 * * * *", async () => {
    logger.info("Cleanup worker starting");

    try {
      await Promise.allSettled([
        deleteExpiredVideos(),
        deleteExpiredClips(),
        deleteExpiredExports(),
      ]);
    } catch (error) {
      logger.error("Cleanup worker error", { error: error.message });
    }
  });

  cron.schedule("0 3 * * *", async () => {
    logger.info("Deep cleanup worker starting");

    try {
      await cleanupOrphanedWorkDirectories();
    } catch (error) {
      logger.error("Deep cleanup error", { error: error.message });
    }
  });

  logger.info("Cleanup workers scheduled");
}

export default startCleanupWorker;
