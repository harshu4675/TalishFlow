import { Router } from "express";
import {
  getDashboardStats,
  getChartData,
  getFullAnalytics,
  getTopContent,
  getStorageStats,
  getPlatformBreakdown,
} from "../controllers/analyticsController.js";
import { authenticate } from "../middleware/authenticate.js";

const router = Router();

router.use(authenticate);

router.get("/dashboard-stats", getDashboardStats);
router.get("/charts", getChartData);
router.get("/overview", getFullAnalytics);
router.get("/top-content", getTopContent);
router.get("/storage", getStorageStats);
router.get("/platforms", getPlatformBreakdown);

export default router;
