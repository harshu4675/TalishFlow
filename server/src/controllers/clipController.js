import path from "path";
import fs from "fs/promises";
import { asyncHandler, createError } from "../middleware/errorHandler.js";
import Clip from "../models/Clip.js";
import Video from "../models/Video.js";
import {
  generateCaption,
  generateTitles,
  generateHashtags,
  extractKeywords,
  regenerateCaption,
} from "../services/captionService.js";
import { exportWithQuality, burnSubtitles } from "../services/ffmpegService.js";
import { ensureDirectory } from "../services/storageService.js";
import { emitToUser } from "../websocket/wsServer.js";
import logger from "../utils/logger.js";

export const listClips = asyncHandler(async (req, res) => {
  const { videoId, limit = 20, page = 1, sort = "-detectionScore" } = req.query;

  const filter = { userId: req.user.id, isDeleted: false };
  if (videoId) filter.videoId = videoId;

  const [clips, total] = await Promise.all([
    Clip.find(filter)
      .sort(sort)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .lean(),
    Clip.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      clips,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    },
  });
});

export const getClip = asyncHandler(async (req, res) => {
  const clip = await Clip.findOne({
    _id: req.params.id,
    userId: req.user.id,
    isDeleted: false,
  }).populate("videoId", "title source youtubeUrl transcript");

  if (!clip) throw createError("Clip not found", 404);

  res.json({ success: true, data: { clip } });
});

export const updateClip = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  const clip = await Clip.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
    },
    { new: true, runValidators: true },
  );

  if (!clip) throw createError("Clip not found", 404);

  res.json({ success: true, data: { clip } });
});

export const generateClipCaption = asyncHandler(async (req, res) => {
  const {
    style = "professional",
    language = "en",
    platform = "general",
  } = req.body;

  const clip = await Clip.findOne({
    _id: req.params.id,
    userId: req.user.id,
    isDeleted: false,
  }).populate("videoId", "transcript");

  if (!clip) throw createError("Clip not found", 404);

  const transcript = clip.transcript || clip.videoId?.transcript?.text || "";
  const keywords = await extractKeywords(transcript);
  const caption = await generateCaption({
    transcript,
    style,
    language,
    platform,
    keywords,
  });

  await Clip.findByIdAndUpdate(req.params.id, {
    $push: {
      generatedCaptions: {
        language,
        style,
        text: caption,
        generatedAt: new Date(),
      },
    },
  });

  res.json({
    success: true,
    data: { caption, keywords },
  });
});

export const regenerateClipCaption = asyncHandler(async (req, res) => {
  const { style, language, platform, feedback } = req.body;

  const clip = await Clip.findOne({
    _id: req.params.id,
    userId: req.user.id,
    isDeleted: false,
  }).populate("videoId", "transcript");

  if (!clip) throw createError("Clip not found", 404);

  const transcript = clip.transcript || clip.videoId?.transcript?.text || "";
  const keywords = await extractKeywords(transcript);

  const caption = await regenerateCaption({
    transcript,
    style,
    language,
    platform,
    keywords,
    feedback,
  });

  await Clip.findByIdAndUpdate(req.params.id, {
    $push: {
      generatedCaptions: {
        language,
        style,
        text: caption,
        generatedAt: new Date(),
      },
    },
  });

  res.json({
    success: true,
    data: { caption },
  });
});

export const generateClipTitles = asyncHandler(async (req, res) => {
  const clip = await Clip.findOne({
    _id: req.params.id,
    userId: req.user.id,
    isDeleted: false,
  }).populate("videoId", "transcript");

  if (!clip) throw createError("Clip not found", 404);

  const transcript = clip.transcript || clip.videoId?.transcript?.text || "";
  const keywords = await extractKeywords(transcript);
  const titles = await generateTitles({ transcript, keywords });

  const titleEntries = Object.entries(titles).map(([platform, title]) => ({
    platform,
    title,
    generatedAt: new Date(),
  }));

  await Clip.findByIdAndUpdate(req.params.id, {
    generatedTitles: titleEntries,
  });

  res.json({
    success: true,
    data: { titles },
  });
});

export const generateClipHashtags = asyncHandler(async (req, res) => {
  const { category = "" } = req.body;

  const clip = await Clip.findOne({
    _id: req.params.id,
    userId: req.user.id,
    isDeleted: false,
  }).populate("videoId", "transcript");

  if (!clip) throw createError("Clip not found", 404);

  const transcript = clip.transcript || clip.videoId?.transcript?.text || "";
  const keywords = await extractKeywords(transcript);
  const hashtags = await generateHashtags({ transcript, keywords, category });

  await Clip.findByIdAndUpdate(req.params.id, {
    generatedHashtags: hashtags,
  });

  res.json({
    success: true,
    data: { hashtags },
  });
});

export const exportClip = asyncHandler(async (req, res) => {
  const { quality = "1080p", codec = "h264" } = req.body;

  const allowedQualities = ["1080p", "2k", "4k"];
  const allowedCodecs = ["h264", "h265", "av1"];

  if (!allowedQualities.includes(quality)) {
    throw createError("Invalid export quality. Use 1080p, 2k, or 4k.", 400);
  }

  if (!allowedCodecs.includes(codec)) {
    throw createError("Invalid codec. Use h264, h265, or av1.", 400);
  }

  const clip = await Clip.findOne({
    _id: req.params.id,
    userId: req.user.id,
    isDeleted: false,
  });

  if (!clip) throw createError("Clip not found", 404);

  if (!clip.filePath)
    throw createError("Clip source file is not available", 404);

  const existing = clip.exportedVersions?.find(
    (v) =>
      v.quality === quality && v.codec === codec && v.expiresAt > new Date(),
  );

  if (existing) {
    return res.json({
      success: true,
      data: {
        exportId: existing._id,
        quality,
        codec,
        fileSize: existing.fileSize,
        downloadUrl: existing.downloadUrl,
      },
    });
  }

  const exportsDirectory = path.join(
    path.dirname(clip.filePath),
    "..",
    "exports",
  );
  await ensureDirectory(exportsDirectory);

  const exportFilename = `${clip._id}-${quality}-${codec}-${Date.now()}.mp4`;
  const exportPath = path.join(exportsDirectory, exportFilename);

  emitToUser(req.user.id, "export:start", {
    clipId: clip._id,
    quality,
    codec,
  });

  exportWithQuality({
    inputPath: clip.filePath,
    outputPath: exportPath,
    quality,
    codec,
    onProgress: (percent) => {
      emitToUser(req.user.id, "export:progress", {
        clipId: clip._id,
        progress: percent,
      });
    },
  })
    .then(async () => {
      const stat = await fs.stat(exportPath);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const downloadUrl = `/api/v1/clips/${clip._id}/download/${exportFilename}`;

      await Clip.findByIdAndUpdate(clip._id, {
        $push: {
          exportedVersions: {
            quality,
            codec,
            filePath: exportPath,
            fileSize: stat.size,
            exportedAt: new Date(),
            downloadUrl,
            expiresAt,
          },
        },
      });

      emitToUser(req.user.id, "export:complete", {
        clipId: clip._id,
        quality,
        codec,
        downloadUrl,
        fileSize: stat.size,
      });
    })
    .catch((error) => {
      logger.error("Export failed", { clipId: clip._id, error: error.message });

      emitToUser(req.user.id, "export:error", {
        clipId: clip._id,
        error: error.message,
      });
    });

  res.json({
    success: true,
    message: "Export started. You will be notified when it is ready.",
    data: { quality, codec },
  });
});

export const downloadClip = asyncHandler(async (req, res) => {
  const { filename } = req.params;

  const clip = await Clip.findOne({
    _id: req.params.id,
    userId: req.user.id,
    isDeleted: false,
  });

  if (!clip) throw createError("Clip not found", 404);

  const exportedVersion = clip.exportedVersions?.find(
    (v) => path.basename(v.filePath) === filename,
  );

  if (!exportedVersion) throw createError("Export not found", 404);

  if (exportedVersion.expiresAt < new Date()) {
    throw createError(
      "This export link has expired. Please export the clip again.",
      410,
    );
  }

  const fileExists = await fs
    .access(exportedVersion.filePath)
    .then(() => true)
    .catch(() => false);

  if (!fileExists) throw createError("Export file not found on disk", 404);

  const safeFilename = `talishflow-clip-${clip._id}-${exportedVersion.quality}.mp4`;

  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${safeFilename}"`,
  );
  res.setHeader("Content-Type", "video/mp4");
  res.setHeader("Content-Length", exportedVersion.fileSize);

  const readStream = (await import("fs")).createReadStream(
    exportedVersion.filePath,
  );
  readStream.pipe(res);
});

export const burnClipSubtitles = asyncHandler(async (req, res) => {
  const { style = {} } = req.body;

  const clip = await Clip.findOne({
    _id: req.params.id,
    userId: req.user.id,
    isDeleted: false,
  });

  if (!clip) throw createError("Clip not found", 404);

  if (!clip.subtitles?.srtPath) {
    throw createError("No subtitle file is available for this clip", 404);
  }

  const subtitleFileExists = await fs
    .access(clip.subtitles.srtPath)
    .then(() => true)
    .catch(() => false);

  if (!subtitleFileExists) {
    throw createError("Subtitle file not found on disk", 404);
  }

  const outputDirectory = path.dirname(clip.filePath);
  const burnedFilename = `${clip._id}-burned-${Date.now()}.mp4`;
  const burnedPath = path.join(outputDirectory, burnedFilename);

  emitToUser(req.user.id, "subtitles:start", { clipId: clip._id });

  burnSubtitles({
    inputPath: clip.filePath,
    outputPath: burnedPath,
    subtitlePath: clip.subtitles.srtPath,
    style,
    onProgress: (percent) => {
      emitToUser(req.user.id, "subtitles:progress", {
        clipId: clip._id,
        progress: percent,
      });
    },
  })
    .then(async () => {
      const stat = await fs.stat(burnedPath);

      await Clip.findByIdAndUpdate(clip._id, {
        "subtitles.burnedIn": true,
        $push: {
          exportedVersions: {
            quality: "1080p",
            codec: "h264",
            filePath: burnedPath,
            fileSize: stat.size,
            exportedAt: new Date(),
            downloadUrl: `/api/v1/clips/${clip._id}/download/${burnedFilename}`,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        },
      });

      emitToUser(req.user.id, "subtitles:complete", {
        clipId: clip._id,
        downloadUrl: `/api/v1/clips/${clip._id}/download/${burnedFilename}`,
      });
    })
    .catch((error) => {
      logger.error("Subtitle burn failed", {
        clipId: clip._id,
        error: error.message,
      });

      emitToUser(req.user.id, "subtitles:error", {
        clipId: clip._id,
        error: error.message,
      });
    });

  res.json({
    success: true,
    message: "Subtitle burning started. You will be notified when it is ready.",
  });
});

export const deleteClip = asyncHandler(async (req, res) => {
  const clip = await Clip.findOne({
    _id: req.params.id,
    userId: req.user.id,
  });

  if (!clip) throw createError("Clip not found", 404);

  clip.isDeleted = true;
  await clip.save();

  res.json({ success: true, message: "Clip deleted" });
});
