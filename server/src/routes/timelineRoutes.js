import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { z } from "zod";
import {
  getClipWaveform,
  trimClipHandler,
  splitClipHandler,
  getReframingOptions,
  applyReframing,
  getReframingPreview,
} from "../controllers/timelineController.js";

const router = Router();

router.use(authenticate);

const trimSchema = z.object({
  startTime: z.number().min(0),
  endTime: z.number().positive(),
});

const splitSchema = z.object({
  splitTime: z.number().positive(),
});

const reframingSchema = z.object({
  cropData: z.object({
    x: z.number().int().min(0),
    y: z.number().int().min(0),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  }),
});

router.get("/clips/:id/waveform", getClipWaveform);
router.post("/clips/:id/trim", validate(trimSchema), trimClipHandler);
router.post("/clips/:id/split", validate(splitSchema), splitClipHandler);
router.get("/clips/:id/reframing/options", getReframingOptions);
router.get("/clips/:id/reframing/preview", getReframingPreview);
router.post(
  "/clips/:id/reframing/apply",
  validate(reframingSchema),
  applyReframing,
);

export default router;
