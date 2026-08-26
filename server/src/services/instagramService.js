import axios from "axios";
import { getPlatformToken, storePlatformTokens } from "./authService.js";
import { createError } from "../middleware/errorHandler.js";
import { env } from "../config/env.js";
import logger from "../utils/logger.js";

/**
 * Instagram Graph API (Facebook Login flow for Professional accounts).
 *
 * Token model:
 *   - At connect time we store a LONG-LIVED (~60 day) user access token.
 *   - Long-lived tokens can be refreshed while still valid via
 *     fb_exchange_token; we do this lazily when the token is within 7
 *     days of expiry and persist the replacement.
 */

const GRAPH_API_VERSION = "v21.0";
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

const REFRESH_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

function mapGraphError(error, fallbackMessage) {
  const graphError = error.response?.data?.error;
  const message = graphError?.message || error.message;
  const code = graphError?.code;
  const subcode = graphError?.error_subcode;

  logger.error("Instagram Graph API error", {
    code,
    subcode,
    message: message?.slice(0, 300),
  });

  if (code === 190) {
    return createError(
      "Your Instagram session has expired. Reconnect your Instagram account in Settings.",
      401,
      { code: "INSTAGRAM_TOKEN_EXPIRED" },
    );
  }

  if (code === 10 || code === 200 || subcode === 33) {
    return createError(
      "This Meta app does not have the required Instagram permissions. " +
        "Check instagram_basic and instagram_content_publish permissions in the Meta app.",
      502,
      { code: "INSTAGRAM_PERMISSION_DENIED" },
    );
  }

  if (code === 4 || code === 17 || code === 32 || code === 613) {
    return createError(
      "Instagram rate limit reached. Please try again later.",
      429,
      { code: "INSTAGRAM_RATE_LIMITED" },
    );
  }

  if (code === 9007 || code === 2207052) {
    return createError(
      "Instagram could not fetch the video. Make sure it is a valid MP4 reachable over HTTPS.",
      502,
      { code: "INSTAGRAM_MEDIA_FETCH_FAILED" },
    );
  }

  return createError(fallbackMessage || "Instagram request failed.", 502, {
    code: "INSTAGRAM_API_ERROR",
  });
}

/**
 * Get a valid access token, refreshing the long-lived token when it is
 * close to expiry. Persists refreshed tokens so subsequent calls reuse it.
 */
async function getValidToken(userId) {
  const tokenData = await getPlatformToken(userId, "instagram");

  if (tokenData.isExpired) {
    throw createError(
      "Your Instagram connection has expired. Please reconnect Instagram in Settings.",
      401,
      { code: "INSTAGRAM_TOKEN_EXPIRED" },
    );
  }

  const expiresInMs = tokenData.expiresAt
    ? new Date(tokenData.expiresAt).getTime() - Date.now()
    : Infinity;

  if (expiresInMs < REFRESH_WINDOW_MS) {
    try {
      const response = await axios.get(`${GRAPH_API_BASE}/oauth/access_token`, {
        params: {
          grant_type: "fb_exchange_token",
          client_id: env.META_APP_ID,
          client_secret: env.META_APP_SECRET,
          fb_exchange_token: tokenData.accessToken,
        },
        timeout: 15000,
      });

      await storePlatformTokens(userId, "instagram", {
        accessToken: response.data.access_token,
        expiresIn: response.data.expires_in || 60 * 24 * 60 * 60,
        scope: tokenData.scope,
        platformUserId: tokenData.platformUserId,
        platformUsername: tokenData.platformUsername,
        platformData: tokenData.platformData,
      });

      logger.info("Instagram long-lived token refreshed", { userId });
      return response.data.access_token;
    } catch (error) {
      logger.warn("Instagram token refresh failed — using current token", {
        userId,
        message: error.response?.data?.error?.message || error.message,
      });
    }
  }

  return tokenData.accessToken;
}

/**
 * Resolve the Instagram Professional account id for the user.
 * Prefers the id captured during connect; falls back to live discovery.
 */
export async function getInstagramBusinessAccountId(userId, accessToken) {
  const tokenData = await getPlatformToken(userId, "instagram");

  if (tokenData.platformUserId) {
    return tokenData.platformUserId;
  }

  let pages;
  try {
    const response = await axios.get(`${GRAPH_API_BASE}/me/accounts`, {
      params: {
        fields: "instagram_business_account",
        access_token: accessToken,
      },
      timeout: 15000,
    });
    pages = response.data?.data || [];
  } catch (error) {
    throw mapGraphError(
      error,
      "Could not look up your Facebook Pages for Instagram.",
    );
  }

  const linked = pages.find((page) => page.instagram_business_account?.id);

  if (!linked) {
    throw createError(
      "No Instagram Professional account is linked to your Facebook Pages. " +
        "Reconnect Instagram after linking a Professional account.",
      400,
      { code: "INSTAGRAM_NOT_PROFESSIONAL" },
    );
  }

  return linked.instagram_business_account.id;
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
  let accessToken;
  let igAccountId;

  try {
    accessToken = await getValidToken(userId);
    igAccountId = await getInstagramBusinessAccountId(userId, accessToken);
  } catch (error) {
    if (error.statusCode) throw error;
    throw mapGraphError(error);
  }

  logger.info("Starting Instagram Reel upload", { userId, igAccountId });

  onProgress?.(5);

  let container;

  const containerPayload = {
    media_type: "REELS",
    video_url: videoUrl,
    caption: (caption || "").slice(0, 2200),
    share_to_feed: shareToFeed !== false,
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
        { code: "INSTAGRAM_SCHEDULE_TOO_SOON" },
      );
    }

    const maxScheduleTime = Date.now() + 75 * 24 * 60 * 60 * 1000;
    if (new Date(scheduledPublishTime).getTime() > maxScheduleTime) {
      throw createError(
        "Instagram scheduled posts cannot be more than 75 days in the future.",
        400,
        { code: "INSTAGRAM_SCHEDULE_TOO_FAR" },
      );
    }
  }

  try {
    const containerResponse = await axios.post(
      `${GRAPH_API_BASE}/${igAccountId}/media`,
      null,
      { params: { ...containerPayload, access_token: accessToken }, timeout: 30000 },
    );
    container = containerResponse.data;
  } catch (error) {
    throw mapGraphError(
      error,
      "Instagram could not create a media container for this Reel.",
    );
  }

  const containerId = container?.id;

  if (!containerId) {
    throw new Error("Instagram did not return a media container ID");
  }

  logger.info("Instagram media container created", { userId, containerId });

  onProgress?.(20);

  await pollContainerStatus(containerId, accessToken, onProgress);

  onProgress?.(90);

  if (scheduledPublishTime) {
    logger.info("Instagram Reel scheduled", {
      userId,
      containerId,
      scheduledPublishTime,
    });

    return {
      containerId,
      mediaId: containerId,
      mediaUrl: null,
      isScheduled: true,
      scheduledPublishTime,
    };
  }

  let publishResponseData;

  try {
    const publishResponse = await axios.post(
      `${GRAPH_API_BASE}/${igAccountId}/media_publish`,
      null,
      { params: { creation_id: containerId, access_token: accessToken }, timeout: 30000 },
    );
    publishResponseData = publishResponse.data;
  } catch (error) {
    throw mapGraphError(error, "Instagram failed to publish the Reel.");
  }

  const mediaId = publishResponseData?.id;

  if (!mediaId) {
    throw new Error("Instagram did not return a media ID after publishing");
  }

  logger.info("Instagram Reel published", { userId, mediaId });

  onProgress?.(100);

  let mediaUrl = null;

  try {
    const mediaResponse = await axios.get(`${GRAPH_API_BASE}/${mediaId}`, {
      params: { fields: "permalink", access_token: accessToken },
      timeout: 15000,
    });

    // The Graph API permalink is already a full URL — use it as-is.
    mediaUrl = mediaResponse.data?.permalink || null;
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

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    await sleep(pollIntervalMs);

    let statusData;
    try {
      const statusResponse = await axios.get(
        `${GRAPH_API_BASE}/${containerId}`,
        {
          params: { fields: "status,status_code", access_token: accessToken },
          timeout: 15000,
        },
      );
      statusData = statusResponse.data;
    } catch (error) {
      throw mapGraphError(error, "Could not check Instagram media status.");
    }

    const statusCode = statusData?.status_code;
    const status = statusData?.status;

    if (statusCode === "FINISHED") return;

    if (statusCode === "ERROR" || statusCode === "EXPIRED") {
      throw new Error(
        `Instagram media processing failed (${statusCode}). ${
          status || "The video could not be processed by Instagram."
        }`,
      );
    }

    const progressEstimate = 20 + Math.round((attempt / maxAttempts) * 65);
    onProgress?.(Math.min(progressEstimate, 85));
  }

  throw new Error(
    "Instagram video processing timed out. The video may be too large or Instagram is slow — try again.",
  );
}

export async function getInstagramAccountInfo(userId) {
  const accessToken = await getValidToken(userId);
  const igAccountId = await getInstagramBusinessAccountId(userId, accessToken);

  try {
    const response = await axios.get(`${GRAPH_API_BASE}/${igAccountId}`, {
      params: {
        fields:
          "id,name,username,profile_picture_url,followers_count,media_count,account_type",
        access_token: accessToken,
      },
      timeout: 15000,
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
  } catch (error) {
    throw mapGraphError(error, "Could not fetch Instagram account info.");
  }
}

export async function getInstagramPublishingLimit(userId) {
  const accessToken = await getValidToken(userId);
  const igAccountId = await getInstagramBusinessAccountId(userId, accessToken);

  try {
    const response = await axios.get(
      `${GRAPH_API_BASE}/${igAccountId}/content_publishing_limit`,
      {
        params: { fields: "config,quota_usage", access_token: accessToken },
        timeout: 15000,
      },
    );

    const limit = response.data?.data?.[0];

    return {
      quotaTotal: limit?.config?.quota_total || 50,
      quotaUsed: limit?.quota_usage || 0,
      quotaRemaining:
        (limit?.config?.quota_total || 50) - (limit?.quota_usage || 0),
    };
  } catch (error) {
    throw mapGraphError(error, "Could not fetch Instagram publishing limits.");
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
