import { asyncHandler } from "../middleware/errorHandler.js";
import ProcessingJob from "../models/ProcessingJob.js";

export const getQueue = asyncHandler(async (req, res) => {
  const jobs = await ProcessingJob.find({
    userId: req.user.id,
    status: {
      $nin: ["completed"],
    },
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  res.json({
    success: true,
    data: { jobs },
  });
});

export const getJobStatus = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  const job = await ProcessingJob.findOne({
    _id: jobId,
    userId: req.user.id,
  }).lean();

  if (!job) {
    return res.status(404).json({
      success: false,
      message: "Processing job not found",
    });
  }

  res.json({
    success: true,
    data: { job },
  });
});
