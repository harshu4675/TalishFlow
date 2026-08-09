import Video from "../models/Video.js";
import Clip from "../models/Clip.js";
import { deleteFile } from "./storageService.js";
import logger from "../utils/logger.js";

export async function deleteVideoFiles(videoId) {
  const video = await Video.findById(videoId);

  if (!video) return;

  if (video.filePath) await deleteFile(video.filePath);
  if (video.thumbnailPath) await deleteFile(video.thumbnailPath);

  logger.info("Video files deleted", { videoId });
}

export async function deleteClipFiles(clipId) {
  const clip = await Clip.findById(clipId);

  if (!clip) return;

  if (clip.filePath) await deleteFile(clip.filePath);
  if (clip.thumbnailPath) await deleteFile(clip.thumbnailPath);
  if (clip.subtitles?.srtPath) await deleteFile(clip.subtitles.srtPath);

  if (clip.exportedVersions?.length) {
    for (const version of clip.exportedVersions) {
      if (version.filePath) await deleteFile(version.filePath);
    }
  }

  logger.info("Clip files deleted", { clipId });
}
