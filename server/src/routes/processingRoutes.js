import { Router } from "express";
import { getQueue, getJobStatus } from "../controllers/processingController.js";
import { authenticate } from "../middleware/authenticate.js";

const router = Router();

router.use(authenticate);

router.get("/queue", getQueue);
router.get("/jobs/:jobId", getJobStatus);

export default router;
