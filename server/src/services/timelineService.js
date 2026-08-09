import path from "path";
import fs from "fs/promises";
import {
  extractClipSegment,
  extractThumbnail,
  generateWaveformData,
  extractAudioTrack,
} from "./ffmpegService.js";
import { ensureDirectory, getUserUploadDirectory } from "./storageService.js";
import Clip from "../models/Clip.js";
import { createError } from "../middleware/errorHandler.js";
import logger from "../utils/logger.js";
import os from "os";

export async function trimClip({ clip, startTime, endTime, userId }) {
  if (startTime < 0) throw createError("Start time cannot be negative", 400);
  if (endTime <= startTime)
    throw createError("End time must be after start time", 400);

  const duration = endTime - startTime;

  if (duration < 3)
    throw createError("Clip must be at least 3 seconds long", 400);
  if (duration > 180) throw createError("Clip cannot exceed 180 seconds", 400);

  if (!clip.filePath)
    throw createError("Clip source file is not available", 404);

  const outputDirectory = path.join(getUserUploadDirectory(userId), "clips");
  await ensureDirectory(outputDirectory);

  const outputFilename = `trimmed-${clip._id}-${Date.now()}.mp4`;
  const outputPath = path.join(outputDirectory, outputFilename);
  const thumbnailPath = path.join(
    outputDirectory,
    `trimmed-${clip._id}-thumb.jpg`,
  );

  await extractClipSegment({
    inputPath: clip.filePath,
    outputPath,
    startTime,
    endTime,
  });

  await extractThumbnail(outputPath, thumbnailPath, 1);

  const stat = await fs.stat(outputPath);
  const previousFilePath = clip.filePath;

  await Clip.findByIdAndUpdate(clip._id, {
    filePath: outputPath,
    thumbnailPath,
    fileSize: stat.size,
    startTime: clip.startTime + startTime,
    endTime: clip.startTime + endTime,
    duration,
  });

  try {
    await fs.unlink(previousFilePath);
  } catch {
    logger.warn("Could not delete previous clip file after trim", {
      path: previousFilePath,
    });
  }

  return {
    filePath: outputPath,
    thumbnailPath,
    fileSize: stat.size,
    duration,
  };
}

export async function splitClip({ clip, splitTime, userId }) {
  if (!clip.filePath)
    throw createError("Clip source file is not available", 404);

  const duration = clip.duration || clip.endTime - clip.startTime;

  if (splitTime <= 3)
    throw createError("Split point must be after 3 seconds", 400);
  if (splitTime >= duration - 3)
    throw createError(
      "Split point must be at least 3 seconds before the end",
      400,
    );

  const outputDirectory = path.join(getUserUploadDirectory(userId), "clips");
  await ensureDirectory(outputDirectory);

  const timestamp = Date.now();
  const firstFilename = `split-a-${clip._id}-${timestamp}.mp4`;
  const secondFilename = `split-b-${clip._id}-${timestamp}.mp4`;
  const firstPath = path.join(outputDirectory, firstFilename);
  const secondPath = path.join(outputDirectory, secondFilename);
  const firstThumbPath = path.join(
    outputDirectory,
    `split-a-${clip._id}-thumb.jpg`,
  );
  const secondThumbPath = path.join(
    outputDirectory,
    `split-b-${clip._id}-thumb.jpg`,
  );

  await Promise.all([
    extractClipSegment({
      inputPath: clip.filePath,
      outputPath: firstPath,
      startTime: 0,
      endTime: splitTime,
    }),
    extractClipSegment({
      inputPath: clip.filePath,
      outputPath: secondPath,
      startTime: splitTime,
      endTime: duration,
    }),
  ]);

  await Promise.all([
    extractThumbnail(firstPath, firstThumbPath, 1),
    extractThumbnail(secondPath, secondThumbPath, 1),
  ]);

  const [firstStat, secondStat] = await Promise.all([
    fs.stat(firstPath),
    fs.stat(secondPath),
  ]);

  const firstClip = await Clip.findByIdAndUpdate(
    clip._id,
    {
      filePath: firstPath,
      thumbnailPath: firstThumbPath,
      fileSize: firstStat.size,
      endTime: clip.startTime + splitTime,
      duration: splitTime,
      title: clip.title ? `${clip.title} (Part 1)` : "Part 1",
    },
    { new: true },
  );

  const secondClip = await Clip.create({
    userId: clip.userId,
    videoId: clip.videoId,
    title: clip.title ? `${clip.title} (Part 2)` : "Part 2",
    filePath: secondPath,
    thumbnailPath: secondThumbPath,
    fileSize: secondStat.size,
    startTime: clip.startTime + splitTime,
    endTime: clip.endTime,
    duration: duration - splitTime,
    width: clip.width,
    height: clip.height,
    detectionScore: clip.detectionScore,
    detectionReasons: clip.detectionReasons,
    status: "ready",
    scheduledDeletion: clip.scheduledDeletion,
  });

  return { firstClip, secondClip };
}

export async function getWaveformData(filePath) {
  const tempDirectory = path.join(os.tmpdir(), "talishflow-waveform");
  await ensureDirectory(tempDirectory);

  const tempAudioPath = path.join(tempDirectory, `waveform-${Date.now()}.wav`);

  try {
    await extractAudioTrack(filePath, tempAudioPath);
    const waveformData = await generateWaveformData(tempAudioPath, 200);
    return waveformData;
  } finally {
    try {
      await fs.unlink(tempAudioPath);
    } catch {
      logger.warn("Could not delete temp waveform audio file", {
        path: tempAudioPath,
      });
    }
  }
}

export async function validateTrimBounds(clip, startTime, endTime) {
  const duration = clip.duration || clip.endTime - clip.startTime;

  const errors = [];

  if (typeof startTime !== "number" || startTime < 0) {
    errors.push("Start time must be a non-negative number");
  }

  if (typeof endTime !== "number" || endTime <= 0) {
    errors.push("End time must be a positive number");
  }

  if (startTime >= endTime) {
    errors.push("Start time must be before end time");
  }

  if (endTime > duration) {
    errors.push(
      `End time cannot exceed clip duration of ${Math.round(duration)} seconds`,
    );
  }

  if (endTime - startTime < 3) {
    errors.push("Clip must be at least 3 seconds after trimming");
  }

  if (errors.length) throw createError(errors[0], 400);

  return true;
}
