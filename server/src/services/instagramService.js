import axios from "axios";
import fs from "fs";
import { getPlatformToken } from "./authService.js";
import { createError } from "../middleware/errorHandler.js";
import logger from "../utils/logger.js";

const GRAPH_API_VERSION = "v21.0";
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

async function getInstagramBusinessAccountId(accessToken) {
  const response = await axios.get(`${GRAPH_API_BASE}/me/accounts`, {
    params: {
      fields: "instagram_business_account,name",
      access_token: accessToken,
    },
  });

  const pages = response.data?.data || [];

  for (const page of pages) {
    if (page.instagram_business_account?.id) {
      return page.instagram_business_account.id;
    }
  }

  throw createError(
    "No Instagram Professional or Business account found. You need an Instagram Professional account (Business or Creator) connected to a Facebook Page.",
    404,
  );
}

async function getValidToken(userId) {
  const tokenData = await getPlatformToken(userId, "instagram");

  if (tokenData.isExpired) {
    throw createError(
      "Instagram access token has expired. Please reconnect your Instagram account.",
      401,
    );
  }

  return tokenData.accessToken;
}

export async function uploadReelToInstagram({
  userId,
  videoUrl,
  caption,
  coverUrl,
  shareToFeed,
  scheduledPublishTime,
  onProgress,
}) {
  const accessToken = await getValidToken(userId);
  const igAccountId = await getInstagramBusinessAccountId(accessToken);

  logger.info("Starting Instagram Reel upload", { userId, igAccountId });

  onProgress?.(5);

  const containerPayload = {
    media_type: "REELS",
    video_url: videoUrl,
    caption: (caption || "").slice(0, 2200),
    share_to_feed: shareToFeed !== false,
    access_token: accessToken,
  };

  if (coverUrl) {
    containerPayload.cover_url = coverUrl;
  }

  if (scheduledPublishTime) {
    containerPayload.scheduled_publish_time = Math.floor(
      new Date(scheduledPublishTime).getTime() / 1000,
    );
    containerPayload.status = "SCHEDULED";

    const minScheduleTime = Date.now() + 10 * 60 * 1000;
    if (new Date(scheduledPublishTime).getTime() < minScheduleTime) {
      throw createError(
        "Instagram scheduled posts must be at least 10 minutes in the future.",
        400,
      );
    }

    const maxScheduleTime = Date.now() + 75 * 24 * 60 * 60 * 1000;
    if (new Date(scheduledPublishTime).getTime() > maxScheduleTime) {
      throw createError(
        "Instagram scheduled posts cannot be more than 75 days in the future.",
        400,
      );
    }
  }

  const containerResponse = await axios.post(
    `${GRAPH_API_BASE}/${igAccountId}/media`,
    containerPayload,
  );

  const containerId = containerResponse.data?.id;

  if (!containerId) {
    throw new Error("Instagram did not return a media container ID");
  }

  logger.info("Instagram media container created", { containerId });

  onProgress?.(20);

  await pollContainerStatus(containerId, accessToken, onProgress);

  onProgress?.(90);

  if (scheduledPublishTime) {
    logger.info("Instagram Reel scheduled", {
      containerId,
      scheduledPublishTime,
    });

    return {
      containerId,
      mediaId: null,
      mediaUrl: null,
      isScheduled: true,
      scheduledPublishTime,
    };
  }

  const publishResponse = await axios.post(
    `${GRAPH_API_BASE}/${igAccountId}/media_publish`,
    {
      creation_id: containerId,
      access_token: accessToken,
    },
  );

  const mediaId = publishResponse.data?.id;

  if (!mediaId) {
    throw new Error("Instagram did not return a media ID after publishing");
  }

  logger.info("Instagram Reel published", { userId, mediaId });

  onProgress?.(100);

  let mediaUrl = null;

  try {
    const mediaResponse = await axios.get(`${GRAPH_API_BASE}/${mediaId}`, {
      params: {
        fields: "permalink",
        access_token: accessToken,
      },
    });

    mediaUrl = mediaResponse.data?.permalink
      ? `https://www.instagram.com${mediaResponse.data.permalink}`
      : null;
  } catch {
    logger.warn("Could not fetch Instagram media permalink", { mediaId });
  }

  return {
    containerId,
    mediaId,
    mediaUrl,
    isScheduled: false,
  };
}

async function pollContainerStatus(containerId, accessToken, onProgress) {
  const maxAttempts = 40;
  const pollIntervalMs = 5000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await sleep(pollIntervalMs);

    const statusResponse = await axios.get(`${GRAPH_API_BASE}/${containerId}`, {
      params: {
        fields: "status,status_code",
        access_token: accessToken,
      },
    });

    const statusCode = statusResponse.data?.status_code;
    const status = statusResponse.data?.status;

    logger.debug("Instagram container status", {
      containerId,
      statusCode,
      attempt,
    });

    if (statusCode === "FINISHED") {
      return;
    }

    if (statusCode === "ERROR" || statusCode === "EXPIRED") {
      throw new Error(
        `Instagram media processing failed with status: ${statusCode}. ${status || ""}`,
      );
    }

    const progressEstimate = 20 + Math.round((attempt / maxAttempts) * 65);
    onProgress?.(Math.min(progressEstimate, 85));
  }

  throw new Error(
    "Instagram video processing timed out after 200 seconds. The video may be too large or Instagram servers are slow.",
  );
}

export async function getInstagramAccountInfo(userId) {
  const accessToken = await getValidToken(userId);
  const igAccountId = await getInstagramBusinessAccountId(accessToken);

  const response = await axios.get(`${GRAPH_API_BASE}/${igAccountId}`, {
    params: {
      fields:
        "id,name,username,profile_picture_url,followers_count,media_count,account_type",
      access_token: accessToken,
    },
  });

  return {
    accountId: response.data.id,
    name: response.data.name,
    username: response.data.username,
    profilePictureUrl: response.data.profile_picture_url,
    followersCount: response.data.followers_count,
    mediaCount: response.data.media_count,
    accountType: response.data.account_type,
  };
}

export async function getInstagramMediaInsights(userId, mediaId) {
  const accessToken = await getValidToken(userId);

  const response = await axios.get(`${GRAPH_API_BASE}/${mediaId}/insights`, {
    params: {
      metric: "plays,reach,likes,comments,shares,saved,total_interactions",
      access_token: accessToken,
    },
  });

  const metrics = {};

  for (const item of response.data?.data || []) {
    metrics[item.name] = item.values?.[0]?.value || 0;
  }

  return metrics;
}

export async function getInstagramPublishingLimit(userId) {
  const accessToken = await getValidToken(userId);
  const igAccountId = await getInstagramBusinessAccountId(accessToken);

  const response = await axios.get(
    `${GRAPH_API_BASE}/${igAccountId}/content_publishing_limit`,
    {
      params: {
        fields: "config,quota_usage",
        access_token: accessToken,
      },
    },
  );

  const limit = response.data?.data?.[0];

  return {
    quotaTotal: limit?.config?.quota_total || 50,
    quotaUsed: limit?.quota_usage || 0,
    quotaRemaining:
      (limit?.config?.quota_total || 50) - (limit?.quota_usage || 0),
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
