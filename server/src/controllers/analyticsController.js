import { asyncHandler } from "../middleware/errorHandler.js";
import User from "../models/User.js";
import Video from "../models/Video.js";
import Clip from "../models/Clip.js";
import PublishingJob from "../models/PublishingJob.js";
import AnalyticsSnapshot from "../models/AnalyticsSnapshot.js";
import {
  aggregateDashboardMetrics,
  getTopPerformingContent,
} from "../services/analyticsAggregationService.js";

export const getDashboardStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  const [
    totalVideos,
    totalClips,
    totalPublished,
    videosThisMonth,
    videosLastMonth,
    clipsThisMonth,
    clipsLastMonth,
    publishedThisMonth,
    publishedLastMonth,
    user,
  ] = await Promise.all([
    Video.countDocuments({ userId, isDeleted: false }),
    Clip.countDocuments({ userId, isDeleted: false }),
    PublishingJob.countDocuments({ userId, status: "published" }),
    Video.countDocuments({ userId, createdAt: { $gte: thisMonthStart } }),
    Video.countDocuments({
      userId,
      createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
    }),
    Clip.countDocuments({ userId, createdAt: { $gte: thisMonthStart } }),
    Clip.countDocuments({
      userId,
      createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
    }),
    PublishingJob.countDocuments({
      userId,
      status: "published",
      publishedAt: { $gte: thisMonthStart },
    }),
    PublishingJob.countDocuments({
      userId,
      status: "published",
      publishedAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
    }),
    User.findById(userId).lean(),
  ]);

  const calcChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const totalViews = user?.stats?.totalViews || 0;

  const snapshotsThisMonth = await AnalyticsSnapshot.aggregate([
    { $match: { userId: req.user.id, date: { $gte: thisMonthStart } } },
    { $group: { _id: null, views: { $sum: "$metrics.views" } } },
  ]);

  const snapshotsLastMonth = await AnalyticsSnapshot.aggregate([
    {
      $match: {
        userId: req.user.id,
        date: { $gte: lastMonthStart, $lte: lastMonthEnd },
      },
    },
    { $group: { _id: null, views: { $sum: "$metrics.views" } } },
  ]);

  const viewsThisMonth = snapshotsThisMonth[0]?.views || 0;
  const viewsLastMonth = snapshotsLastMonth[0]?.views || 0;

  res.json({
    success: true,
    data: {
      totalVideos,
      totalClips,
      totalPublished,
      totalViews,
      changes: {
        totalVideos: calcChange(videosThisMonth, videosLastMonth),
        totalClips: calcChange(clipsThisMonth, clipsLastMonth),
        totalPublished: calcChange(publishedThisMonth, publishedLastMonth),
        totalViews: calcChange(viewsThisMonth, viewsLastMonth),
      },
    },
  });
});

export const getChartData = asyncHandler(async (req, res) => {
  const { period = "30d" } = req.query;

  const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const [videosByDay, clipsByDay] = await Promise.all([
    Video.aggregate([
      {
        $match: {
          userId: req.user.id,
          createdAt: { $gte: startDate },
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%b %d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Clip.aggregate([
      {
        $match: {
          userId: req.user.id,
          createdAt: { $gte: startDate },
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%b %d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const analyticsSnapshots = await AnalyticsSnapshot.find({
    userId: req.user.id,
    date: { $gte: startDate },
  })
    .sort({ date: 1 })
    .lean();

  const datesMap = {};
  const dateIterator = new Date(startDate);

  while (dateIterator <= new Date()) {
    const key = dateIterator.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    datesMap[key] = { date: key, views: 0, clips: 0, videos: 0, likes: 0 };
    dateIterator.setDate(dateIterator.getDate() + 1);
  }

  clipsByDay.forEach((item) => {
    if (datesMap[item._id]) datesMap[item._id].clips = item.count;
  });

  videosByDay.forEach((item) => {
    if (datesMap[item._id]) datesMap[item._id].videos = item.count;
  });

  analyticsSnapshots.forEach((snapshot) => {
    const key = new Date(snapshot.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    if (datesMap[key]) {
      datesMap[key].views += snapshot.metrics.views || 0;
      datesMap[key].likes += snapshot.metrics.likes || 0;
    }
  });

  res.json({
    success: true,
    data: {
      views: Object.values(datesMap),
    },
  });
});

export const getFullAnalytics = asyncHandler(async (req, res) => {
  const { period = "30d" } = req.query;
  const analytics = await aggregateDashboardMetrics(req.user.id, period);

  res.json({ success: true, data: analytics });
});

export const getTopContent = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  const content = await getTopPerformingContent(req.user.id, Number(limit));

  res.json({ success: true, data: { content } });
});

export const getStorageStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const [videoStorage, clipStorage] = await Promise.all([
    Video.aggregate([
      { $match: { userId: req.user.id, isDeleted: false } },
      { $group: { _id: null, total: { $sum: "$fileSize" } } },
    ]),
    Clip.aggregate([
      { $match: { userId: req.user.id, isDeleted: false } },
      { $group: { _id: null, total: { $sum: "$fileSize" } } },
    ]),
  ]);

  const videosBytes = videoStorage[0]?.total || 0;
  const clipsBytes = clipStorage[0]?.total || 0;
  const totalUsed = videosBytes + clipsBytes;

  res.json({
    success: true,
    data: {
      totalUsed,
      breakdown: {
        videos: videosBytes,
        clips: clipsBytes,
        subtitles: 0,
      },
    },
  });
});

export const getPlatformBreakdown = asyncHandler(async (req, res) => {
  const { period = "30d" } = req.query;
  const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const [youtubeJobs, instagramJobs] = await Promise.all([
    PublishingJob.countDocuments({
      userId: req.user.id,
      platform: "youtube",
      status: "published",
      publishedAt: { $gte: startDate },
    }),
    PublishingJob.countDocuments({
      userId: req.user.id,
      platform: "instagram",
      status: "published",
      publishedAt: { $gte: startDate },
    }),
  ]);

  res.json({
    success: true,
    data: {
      youtube: { published: youtubeJobs },
      instagram: { published: instagramJobs },
    },
  });
});
