import { Router } from "express";
import fs from "fs";
import { authenticate } from "../middleware/authenticate.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { aiGenerationLimiter } from "../middleware/rateLimit.js";
import Clip from "../models/Clip.js";
import {
  listClips,
  getClip,
  updateClip,
  generateClipCaption,
  regenerateClipCaption,
  generateClipTitles,
  generateClipHashtags,
  exportClip,
  downloadClip,
  burnClipSubtitles,
  deleteClip,
} from "../controllers/clipController.js";

const router = Router();

router.use(authenticate);

router.get("/", listClips);
router.get("/:id", getClip);
router.patch("/:id", updateClip);
router.delete("/:id", deleteClip);

router.post("/:id/captions/generate", aiGenerationLimiter, generateClipCaption);
router.post(
  "/:id/captions/regenerate",
  aiGenerationLimiter,
  regenerateClipCaption,
);

router.post("/:id/titles/generate", aiGenerationLimiter, generateClipTitles);

router.post(
  "/:id/hashtags/generate",
  aiGenerationLimiter,
  generateClipHashtags,
);

router.post("/:id/export", exportClip);
router.get("/:id/download/:filename", downloadClip);

router.post("/:id/subtitles/burn", burnClipSubtitles);

router.get(
  "/:id/thumbnail",
  asyncHandler(async (req, res) => {
    const clip = await Clip.findOne({
      _id: req.params.id,
      userId: req.user.id,
    }).lean();

    if (!clip?.thumbnailPath) {
      return res
        .status(404)
        .json({ success: false, message: "Thumbnail not found" });
    }

    const exists = fs.existsSync(clip.thumbnailPath);

    if (!exists) {
      return res
        .status(404)
        .json({ success: false, message: "Thumbnail file not found" });
    }

    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader("Cache-Control", "public, max-age=3600");
    fs.createReadStream(clip.thumbnailPath).pipe(res);
  }),
);

router.get(
  "/:id/stream",
  asyncHandler(async (req, res) => {
    const clip = await Clip.findOne({
      _id: req.params.id,
      userId: req.user.id,
    }).lean();

    if (!clip?.filePath) {
      return res
        .status(404)
        .json({ success: false, message: "Clip not found" });
    }

    const exists = fs.existsSync(clip.filePath);

    if (!exists) {
      return res
        .status(404)
        .json({ success: false, message: "Clip file not found" });
    }

    const stat = fs.statSync(clip.filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize,
        "Content-Type": "video/mp4",
      });

      fs.createReadStream(clip.filePath, { start, end }).pipe(res);
    } else {
      res.writeHead(200, {
        "Content-Length": fileSize,
        "Content-Type": "video/mp4",
        "Accept-Ranges": "bytes",
      });

      fs.createReadStream(clip.filePath).pipe(res);
    }
  }),
);

export default router;
