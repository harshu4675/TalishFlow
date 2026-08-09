import path from "path";
import { asyncHandler, createError } from "../middleware/errorHandler.js";
import Clip from "../models/Clip.js";
import {
  trimClip,
  splitClip,
  getWaveformData,
  validateTrimBounds,
} from "../services/timelineService.js";
import {
  computeReframingOptions,
  applyCustomReframing,
  generateReframingPreview,
} from "../services/reframingService.js";
import { getUserUploadDirectory } from "../services/storageService.js";
import { emitToUser } from "../websocket/wsServer.js";
import logger from "../utils/logger.js";

export const getClipWaveform = asyncHandler(async (req, res) => {
  const clip = await Clip.findOne({
    _id: req.params.id,
    userId: req.user.id,
    isDeleted: false,
  }).lean();

  if (!clip) throw createError("Clip not found", 404);
  if (!clip.filePath) throw createError("Clip file is not available", 404);

  const waveformData = await getWaveformData(clip.filePath);

  res.json({
    success: true,
    data: { waveform: waveformData, duration: clip.duration },
  });
});

export const trimClipHandler = asyncHandler(async (req, res) => {
  const { startTime, endTime } = req.body;

  if (typeof startTime !== "number" || typeof endTime !== "number") {
    throw createError("startTime and endTime must be numbers", 400);
  }

  const clip = await Clip.findOne({
    _id: req.params.id,
    userId: req.user.id,
    isDeleted: false,
  });

  if (!clip) throw createError("Clip not found", 404);

  await validateTrimBounds(clip, startTime, endTime);

  emitToUser(req.user.id, "timeline:trim:start", { clipId: clip._id });

  trimClip({
    clip,
    startTime,
    endTime,
    userId: req.user.id,
  })
    .then((result) => {
      emitToUser(req.user.id, "timeline:trim:complete", {
        clipId: clip._id,
        ...result,
      });
    })
    .catch((error) => {
      logger.error("Trim failed", { clipId: clip._id, error: error.message });
      emitToUser(req.user.id, "timeline:trim:error", {
        clipId: clip._id,
        error: error.message,
      });
    });

  res.json({
    success: true,
    message: "Trim started. You will be notified when complete.",
  });
});

export const splitClipHandler = asyncHandler(async (req, res) => {
  const { splitTime } = req.body;

  if (typeof splitTime !== "number" || splitTime <= 0) {
    throw createError("splitTime must be a positive number", 400);
  }

  const clip = await Clip.findOne({
    _id: req.params.id,
    userId: req.user.id,
    isDeleted: false,
  });

  if (!clip) throw createError("Clip not found", 404);

  emitToUser(req.user.id, "timeline:split:start", { clipId: clip._id });

  splitClip({
    clip,
    splitTime,
    userId: req.user.id,
  })
    .then(({ firstClip, secondClip }) => {
      emitToUser(req.user.id, "timeline:split:complete", {
        originalClipId: clip._id,
        firstClipId: firstClip._id,
        secondClipId: secondClip._id,
      });
    })
    .catch((error) => {
      logger.error("Split failed", { clipId: clip._id, error: error.message });
      emitToUser(req.user.id, "timeline:split:error", {
        clipId: clip._id,
        error: error.message,
      });
    });

  res.json({
    success: true,
    message: "Split started. You will be notified when complete.",
  });
});

export const getReframingOptions = asyncHandler(async (req, res) => {
  const clip = await Clip.findOne({
    _id: req.params.id,
    userId: req.user.id,
    isDeleted: false,
  }).lean();

  if (!clip) throw createError("Clip not found", 404);
  if (!clip.filePath) throw createError("Clip file is not available", 404);

  const options = await computeReframingOptions(clip.filePath);

  res.json({
    success: true,
    data: options,
  });
});

export const applyReframing = asyncHandler(async (req, res) => {
  const { cropData } = req.body;

  if (
    !cropData ||
    typeof cropData.x !== "number" ||
    typeof cropData.y !== "number" ||
    typeof cropData.width !== "number" ||
    typeof cropData.height !== "number"
  ) {
    throw createError(
      "Invalid cropData. Provide x, y, width, and height as numbers.",
      400,
    );
  }

  const clip = await Clip.findOne({
    _id: req.params.id,
    userId: req.user.id,
    isDeleted: false,
  });

  if (!clip) throw createError("Clip not found", 404);
  if (!clip.filePath) throw createError("Clip file is not available", 404);

  emitToUser(req.user.id, "timeline:reframe:start", { clipId: clip._id });

  const outputDirectory = path.join(
    getUserUploadDirectory(req.user.id),
    "clips",
  );

  applyCustomReframing({
    clipId: clip._id.toString(),
    inputPath: clip.filePath,
    outputDirectory,
    cropData,
    userId: req.user.id,
  })
    .then(async (result) => {
      await Clip.findByIdAndUpdate(clip._id, {
        filePath: result.filePath,
        thumbnailPath: result.thumbnailPath,
        fileSize: result.fileSize,
        width: result.width,
        height: result.height,
      });

      emitToUser(req.user.id, "timeline:reframe:complete", {
        clipId: clip._id,
        ...result,
      });
    })
    .catch((error) => {
      logger.error("Reframing failed", {
        clipId: clip._id,
        error: error.message,
      });
      emitToUser(req.user.id, "timeline:reframe:error", {
        clipId: clip._id,
        error: error.message,
      });
    });

  res.json({
    success: true,
    message: "Reframing started. You will be notified when complete.",
  });
});

export const getReframingPreview = asyncHandler(async (req, res) => {
  const { x, y, width, height, time = 1 } = req.query;

  if (!x || !y || !width || !height) {
    throw createError(
      "Provide x, y, width, and height as query parameters",
      400,
    );
  }

  const clip = await Clip.findOne({
    _id: req.params.id,
    userId: req.user.id,
    isDeleted: false,
  }).lean();

  if (!clip) throw createError("Clip not found", 404);
  if (!clip.filePath) throw createError("Clip file is not available", 404);

  const outputDirectory = path.join(
    getUserUploadDirectory(req.user.id),
    ".previews",
  );

  const previewPath = await generateReframingPreview({
    inputPath: clip.filePath,
    outputDirectory,
    cropData: {
      x: parseInt(x),
      y: parseInt(y),
      width: parseInt(width),
      height: parseInt(height),
    },
    previewTime: parseFloat(time),
  });

  res.setHeader("Content-Type", "image/jpeg");
  res.setHeader("Cache-Control", "no-store");

  const { createReadStream } = await import("fs");
  createReadStream(previewPath).pipe(res);

  res.on("finish", async () => {
    try {
      const fs = await import("fs/promises");
      await fs.unlink(previewPath);
    } catch {
      logger.warn("Could not clean up reframing preview file");
    }
  });
});
