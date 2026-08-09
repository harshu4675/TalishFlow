import { Router } from "express";
import authRoutes from "./authRoutes.js";
import videoRoutes from "./videoRoutes.js";
import clipRoutes from "./clipRoutes.js";
import processingRoutes from "./processingRoutes.js";
import publishingRoutes from "./publishingRoutes.js";
import analyticsRoutes from "./analyticsRoutes.js";
import settingsRoutes from "./settingsRoutes.js";
import timelineRoutes from "./timelineRoutes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/videos", videoRoutes);
router.use("/clips", clipRoutes);
router.use("/processing", processingRoutes);
router.use("/publishing", publishingRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/settings", settingsRoutes);
router.use("/timeline", timelineRoutes);

export default router;
