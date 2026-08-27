import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { asyncHandler, createError } from "../middleware/errorHandler.js";
import { validate } from "../middleware/validate.js";
import { uploadLimiter, uploadTransferLimiter } from "../middleware/rateLimit.js";
import uploadVideo, { uploadChunk } from "../config/multer.js";
import Video from "../models/Video.js";
import {
  youtubeUrlSchema,
  resumableInitSchema,
  resumableChunkSchema,
  resumableCompleteSchema,
} from "../validators/videoValidators.js";
import {
  uploadFile,
  importYoutubeVideo,
  initializeResumableUpload,
  uploadChunk as uploadChunkController,
  completeResumableUpload,
  getResumableUploadStatus,
  cancelResumableUpload,
} from "../controllers/videoController.js";

const router = Router();

router.use(authenticate);

router.post("/upload", uploadLimiter, uploadVideo.single("video"), uploadFile);

router.post(
  "/youtube",
  uploadLimiter,
  validate(youtubeUrlSchema),
  importYoutubeVideo,
);

router.post(
  "/resumable/init",
  uploadLimiter,
  validate(resumableInitSchema),
  initializeResumableUpload,
);

router.post(
  "/resumable/chunk",
  uploadTransferLimiter,
  uploadChunk.single("chunk"),
  validate(resumableChunkSchema),
  uploadChunkController,
);

router.post(
  "/resumable/complete",
  uploadTransferLimiter,
  validate(resumableCompleteSchema),
  completeResumableUpload,
);

router.get("/resumable/:uploadId", getResumableUploadStatus);
router.delete("/resumable/:uploadId", cancelResumableUpload);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { limit = 20, page = 1, sort = "-createdAt", status } = req.query;

    const filter = { userId: req.user.id, isDeleted: false };

    if (status) {
      filter.processingStatus = status;
    }

    const [videos, total] = await Promise.all([
      Video.find(filter)
        .sort(sort)
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit))
        .lean(),
      Video.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        videos,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  }),
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const video = await Video.findOne({
      _id: req.params.id,
      userId: req.user.id,
      isDeleted: false,
    }).lean();

    if (!video) {
      throw createError("Video not found", 404);
    }

    res.json({
      success: true,
      data: { video },
    });
  }),
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const video = await Video.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!video) {
      throw createError("Video not found", 404);
    }

    video.isDeleted = true;
    await video.save();

    res.json({
      success: true,
      message: "Video deleted",
    });
  }),
);

export default router;
