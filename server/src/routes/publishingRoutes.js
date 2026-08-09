import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import {
  createJob,
  listJobs,
  getJob,
  cancelJob,
  retryJob,
  getScheduledPosts,
  getYouTubeData,
  getInstagramData,
} from "../controllers/publishingController.js";

const router = Router();

router.use(authenticate);

router.post("/jobs", createJob);
router.get("/jobs", listJobs);
router.get("/jobs/:id", getJob);
router.post("/jobs/:id/cancel", cancelJob);
router.post("/jobs/:id/retry", retryJob);

router.get("/scheduled", getScheduledPosts);

router.get("/youtube/data", getYouTubeData);
router.get("/instagram/data", getInstagramData);

export default router;
