import { google } from "googleapis";
import axios from "axios";
import AnalyticsSnapshot from "../models/AnalyticsSnapshot.js";
import PublishingJob from "../models/PublishingJob.js";
import { getPlatformToken } from "./authService.js";
import logger from "../utils/logger.js";

export async function fetchYouTubeAnalytics(userId, startDate, endDate) {
  try {
    const tokenData = await getPlatformToken(userId, "youtube");

    if (!tokenData.accessToken) return null;

    const { google: googleapis } = await import("googleapis");
    const { env } = await import("../config/env.js");

    const oauth2Client = new googleapis.auth.OAuth2(
      env.GOOGLE_CLIENT_ID,
      env.GOOGLE_CLIENT_SECRET,
      env.GOOGLE_CALLBACK_URL,
    );

    oauth2Client.setCredentials({
      access_token: tokenData.accessToken,
      refresh_token: tokenData.refreshToken,
    });

    const youtubeAnalytics = googleapis.youtubeAnalytics({
      version: "v2",
      auth: oauth2Client,
    });

    const start = startDate.toISOString().split("T")[0];
    const end = endDate.toISOString().split("T")[0];

    const response = await youtubeAnalytics.reports.query({
      ids: "channel==MINE",
      startDate: start,
      endDate: end,
      metrics:
        "views,estimatedMinutesWatched,likes,comments,shares,subscribersGained",
      dimensions: "day",
      sort: "day",
    });

    const rows = response.data?.rows || [];

    return rows.map((row) => ({
      date: new Date(row[0]),
      views: row[1] || 0,
      watchTimeMinutes: row[2] || 0,
      likes: row[3] || 0,
      comments: row[4] || 0,
      shares: row[5] || 0,
      subscribersGained: row[6] || 0,
    }));
  } catch (error) {
    logger.warn("Failed to fetch YouTube Analytics", {
      userId,
      error: error.message,
    });
    return null;
  }
}

export async function fetchInstagramInsights(userId, since, until) {
  try {
    const tokenData = await getPlatformToken(userId, "instagram");

    if (!tokenData.accessToken) return null;

    const GRAPH_API_VERSION = "v21.0";
    const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

    const accountsResponse = await axios.get(`${GRAPH_API_BASE}/me/accounts`, {
      params: {
        fields: "instagram_business_account",
        access_token: tokenData.accessToken,
      },
    });

    const pages = accountsResponse.data?.data || [];
    let igAccountId = null;

    for (const page of pages) {
      if (page.instagram_business_account?.id) {
        igAccountId = page.instagram_business_account.id;
        break;
      }
    }

    if (!igAccountId) return null;

    const insightsResponse = await axios.get(
      `${GRAPH_API_BASE}/${igAccountId}/insights`,
      {
        params: {
          metric: "reach,impressions,profile_views",
          period: "day",
          since: Math.floor(since.getTime() / 1000),
          until: Math.floor(until.getTime() / 1000),
          access_token: tokenData.accessToken,
        },
      },
    );

    return insightsResponse.data?.data || [];
  } catch (error) {
    logger.warn("Failed to fetch Instagram Insights", {
      userId,
      error: error.message,
    });
    return null;
  }
}

export async function aggregateDashboardMetrics(userId, period = "30d") {
  const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const snapshots = await AnalyticsSnapshot.find({
    userId,
    date: { $gte: startDate, $lte: endDate },
  }).lean();

  const totals = {
    views: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    reach: 0,
    watchTimeMinutes: 0,
    engagementRate: 0,
  };

  for (const snapshot of snapshots) {
    totals.views += snapshot.metrics.views || 0;
    totals.likes += snapshot.metrics.likes || 0;
    totals.comments += snapshot.metrics.comments || 0;
    totals.shares += snapshot.metrics.shares || 0;
    totals.reach += snapshot.metrics.reach || 0;
    totals.watchTimeMinutes += snapshot.metrics.watchTimeMinutes || 0;
  }

  if (totals.reach > 0) {
    totals.engagementRate = parseFloat(
      (
        ((totals.likes + totals.comments + totals.shares) / totals.reach) *
        100
      ).toFixed(2),
    );
  }

  const publishedJobs = await PublishingJob.find({
    userId,
    status: "published",
    publishedAt: { $gte: startDate, $lte: endDate },
  }).lean();

  const chartData = buildChartData(snapshots, startDate, endDate, days);

  const platformBreakdown = buildPlatformBreakdown(snapshots);

  return {
    totals,
    publishedCount: publishedJobs.length,
    chartData,
    platformBreakdown,
    period,
    startDate,
    endDate,
  };
}

function buildChartData(snapshots, startDate, endDate, days) {
  const dateMap = {};
  const current = new Date(startDate);

  while (current <= endDate) {
    const key = current.toISOString().split("T")[0];
    dateMap[key] = {
      date: current.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      views: 0,
      likes: 0,
      reach: 0,
      engagement: 0,
    };
    current.setDate(current.getDate() + 1);
  }

  for (const snapshot of snapshots) {
    const key = new Date(snapshot.date).toISOString().split("T")[0];

    if (dateMap[key]) {
      dateMap[key].views += snapshot.metrics.views || 0;
      dateMap[key].likes += snapshot.metrics.likes || 0;
      dateMap[key].reach += snapshot.metrics.reach || 0;
    }
  }

  return Object.values(dateMap);
}

function buildPlatformBreakdown(snapshots) {
  const breakdown = {
    youtube: { views: 0, likes: 0, comments: 0, shares: 0 },
    instagram: { views: 0, likes: 0, comments: 0, shares: 0 },
  };

  for (const snapshot of snapshots) {
    if (snapshot.platform === "youtube" || snapshot.platform === "instagram") {
      breakdown[snapshot.platform].views += snapshot.metrics.views || 0;
      breakdown[snapshot.platform].likes += snapshot.metrics.likes || 0;
      breakdown[snapshot.platform].comments += snapshot.metrics.comments || 0;
      breakdown[snapshot.platform].shares += snapshot.metrics.shares || 0;
    }
  }

  return breakdown;
}

export async function getTopPerformingContent(userId, limit = 10) {
  const publishedJobs = await PublishingJob.find({
    userId,
    status: "published",
    platformVideoUrl: { $exists: true, $ne: null },
  })
    .populate("clipId", "title thumbnailPath duration")
    .sort({ publishedAt: -1 })
    .limit(limit)
    .lean();

  return publishedJobs.map((job) => ({
    jobId: job._id,
    platform: job.platform,
    title: job.title || job.clipId?.title || "Untitled",
    platformVideoId: job.platformVideoId,
    platformVideoUrl: job.platformVideoUrl,
    publishedAt: job.publishedAt,
    clip: job.clipId,
  }));
}
