import { Router } from "express";
import fs from "fs";
import { asyncHandler, createError } from "../middleware/errorHandler.js";
import { verifyMediaToken } from "../services/mediaTokenService.js";
import Clip from "../models/Clip.js";
import Video from "../models/Video.js";
import logger from "../utils/logger.js";

/**
 * Signature-protected public media endpoints.
 *
 * These URLs are NOT guessable (HMAC-signed, short-lived) and are the
 * only way external services can fetch media without user credentials.
 */

const router = Router();

function streamFile(res, filePath, contentType) {
  const stat = fs.statSync(filePath);
  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Length", stat.size);
  res.setHeader("Accept-Ranges", "bytes");
  res.setHeader("Cache-Control", "private, no-store");
  fs.createReadStream(filePath).pipe(res);
}

/** Serve an existing media file or fail honestly. */
function resolveMediaFile(filePath, label) {
  if (!filePath || !fs.existsSync(filePath)) {
    logger.warn(`${label} requested but file is missing`, { filePath });
    throw createError("Media file is no longer available", 410, {
      code: "MEDIA_GONE",
    });
  }
  return filePath;
}

function safeExtension(filePath) {
  return filePath.slice(filePath.lastIndexOf(".")).toLowerCase();
}

// ──────────────────────────────────────────────────────────
// Clip thumbnail — requires a signed "view" scope token.
// The SPA embeds these time-limited URLs in <img> tags; they are short-lived
// (15 min) so they cannot be repurposed as public media links.
// ──────────────────────────────────────────────────────────
router.get(
  "/clips/:clipId/thumbnail",
  asyncHandler(async (req, res) => {
    const tokenPayload = verifyMediaToken(req.query.token, req.params.clipId);
    if (tokenPayload.scope !== "view") {
      throw createError("Media token does not allow this resource", 403, {
        code: "MEDIA_TOKEN_SCOPE",
      });
    }

    const clip = await Clip.findOne({
      _id: req.params.clipId,
      isDeleted: false,
    }).lean();

    if (!clip) {
      throw createError("Clip not found", 404, { code: "CLIP_NOT_FOUND" });
    }

    const filePath = resolveMediaFile(clip.thumbnailPath, "Clip thumbnail");
    streamFile(res, filePath, "image/jpeg");
  }),
);

// ──────────────────────────────────────────────────────────
// Video thumbnail — signed "view" scope token.
// ──────────────────────────────────────────────────────────
router.get(
  "/videos/:videoId/thumbnail",
  asyncHandler(async (req, res) => {
    const tokenPayload = verifyMediaToken(req.query.token, req.params.videoId);
    if (tokenPayload.scope !== "view") {
      throw createError("Media token does not allow this resource", 403, {
        code: "MEDIA_TOKEN_SCOPE",
      });
    }

    const video = await Video.findOne({
      _id: req.params.videoId,
      isDeleted: false,
    }).lean();

    if (!video) {
      throw createError("Video not found", 404, { code: "VIDEO_NOT_FOUND" });
    }

    const filePath = resolveMediaFile(video.thumbnailPath, "Video thumbnail");
    const contentType =
      MEDIA_CONTENT_TYPES[safeExtension(filePath)] || "image/jpeg";
    streamFile(res, filePath, contentType);
  }),
);

const MEDIA_CONTENT_TYPES = {
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
};

router.get(
  "/clips/:clipId/stream",
  asyncHandler(async (req, res) => {
    const { clipId } = req.params;

    let tokenPayload;
    try {
      tokenPayload = verifyMediaToken(req.query.token, clipId);
    } catch (error) {
      throw createError(error.message, 401, {
        code: error.code || "MEDIA_TOKEN_INVALID",
      });
    }

    const clip = await Clip.findOne({
      _id: tokenPayload.clipId,
      isDeleted: false,
    }).lean();

    if (!clip?.filePath) {
      throw createError("Media not found", 404, { code: "MEDIA_NOT_FOUND" });
    }

    if (!fs.existsSync(clip.filePath)) {
      logger.warn("Signed media requested but file is missing", {
        clipId: tokenPayload.clipId,
      });
      throw createError("Media file is no longer available", 410, {
        code: "MEDIA_GONE",
      });
    }

    const stat = fs.statSync(clip.filePath);
    const extension = clip.filePath.slice(
      clip.filePath.lastIndexOf("."),
    ).toLowerCase();
    const contentType = MEDIA_CONTENT_TYPES[extension] || "video/mp4";

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Length", stat.size);
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Cache-Control", "private, no-store");

    fs.createReadStream(clip.filePath).pipe(res);
  }),
);

export default router;
