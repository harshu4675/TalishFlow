import { google } from "googleapis";
import fs from "fs";
import path from "path";
import { getPlatformToken, storePlatformTokens } from "./authService.js";
import { createError } from "../middleware/errorHandler.js";
import { env } from "../config/env.js";
import logger from "../utils/logger.js";

function buildOAuthClient() {
  return new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_CALLBACK_URL,
  );
}

async function getAuthorizedClient(userId) {
  const tokenData = await getPlatformToken(userId, "youtube");

  if (tokenData.isExpired && !tokenData.refreshToken) {
    throw createError(
      "YouTube access token has expired. Please reconnect your YouTube account.",
      401,
    );
  }

  const oauth2Client = buildOAuthClient();

  oauth2Client.setCredentials({
    access_token: tokenData.accessToken,
    refresh_token: tokenData.refreshToken,
  });

  if (tokenData.isExpiringSoon && tokenData.refreshToken) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();

      await storePlatformTokens(userId, "youtube", {
        accessToken: credentials.access_token,
        refreshToken: credentials.refresh_token || tokenData.refreshToken,
        expiresIn: credentials.expiry_date
          ? Math.floor((credentials.expiry_date - Date.now()) / 1000)
          : 3600,
        scope: tokenData.scope,
        platformUserId: tokenData.platformUserId,
        platformUsername: tokenData.platformUsername,
      });

      oauth2Client.setCredentials(credentials);
    } catch (refreshError) {
      logger.error("Failed to refresh YouTube token", {
        userId,
        error: refreshError.message,
      });
      throw createError(
        "Failed to refresh YouTube credentials. Please reconnect your account.",
        401,
      );
    }
  }

  return oauth2Client;
}

export async function uploadVideoToYouTube({
  userId,
  filePath,
  title,
  description,
  tags,
  categoryId,
  privacyStatus,
  playlistId,
  madeForKids,
  thumbnailPath,
  scheduledPublishTime,
  onProgress,
}) {
  const oauth2Client = await getAuthorizedClient(userId);
  const youtube = google.youtube({ version: "v3", auth: oauth2Client });

  if (!fs.existsSync(filePath)) {
    throw createError("Video file not found on disk", 404);
  }

  const fileSize = fs.statSync(filePath).size;

  const isShort = await determineIfShort(filePath);

  const videoMetadata = {
    snippet: {
      title: title.slice(0, 100),
      description: (description || "").slice(0, 5000),
      tags: tags?.slice(0, 500) || [],
      categoryId: categoryId || "22",
    },
    status: {
      privacyStatus: scheduledPublishTime
        ? "private"
        : privacyStatus || "public",
      madeForKids: madeForKids || false,
      selfDeclaredMadeForKids: madeForKids || false,
    },
  };

  if (scheduledPublishTime) {
    videoMetadata.status.publishAt = new Date(
      scheduledPublishTime,
    ).toISOString();
    videoMetadata.status.privacyStatus = "private";
  }

  let uploadedBytes = 0;

  const response = await youtube.videos.insert(
    {
      part: ["snippet", "status"],
      requestBody: videoMetadata,
      media: {
        mimeType: "video/mp4",
        body: fs.createReadStream(filePath),
      },
    },
    {
      onUploadProgress: (event) => {
        uploadedBytes = event.bytesRead || 0;
        if (onProgress && fileSize > 0) {
          const percent = Math.min(
            Math.round((uploadedBytes / fileSize) * 100),
            99,
          );
          onProgress(percent);
        }
      },
    },
  );

  const videoId = response.data.id;

  if (!videoId) {
    throw new Error("YouTube upload succeeded but no video ID was returned");
  }

  logger.info("YouTube video uploaded", { userId, videoId, title });

  if (thumbnailPath && fs.existsSync(thumbnailPath)) {
    try {
      await youtube.thumbnails.set({
        videoId,
        media: {
          mimeType: "image/jpeg",
          body: fs.createReadStream(thumbnailPath),
        },
      });

      logger.info("YouTube thumbnail uploaded", { videoId });
    } catch (thumbError) {
      logger.warn("Failed to upload YouTube thumbnail", {
        videoId,
        error: thumbError.message,
      });
    }
  }

  if (playlistId) {
    try {
      await youtube.playlistItems.insert({
        part: ["snippet"],
        requestBody: {
          snippet: {
            playlistId,
            resourceId: {
              kind: "youtube#video",
              videoId,
            },
          },
        },
      });

      logger.info("Video added to YouTube playlist", { videoId, playlistId });
    } catch (playlistError) {
      logger.warn("Failed to add video to playlist", {
        videoId,
        playlistId,
        error: playlistError.message,
      });
    }
  }

  const videoUrl = isShort
    ? `https://www.youtube.com/shorts/${videoId}`
    : `https://www.youtube.com/watch?v=${videoId}`;

  return {
    videoId,
    videoUrl,
    isShort,
    title: response.data.snippet?.title,
    privacyStatus: response.data.status?.privacyStatus,
  };
}

export async function getYouTubeChannelInfo(userId) {
  const oauth2Client = await getAuthorizedClient(userId);
  const youtube = google.youtube({ version: "v3", auth: oauth2Client });

  const response = await youtube.channels.list({
    part: ["snippet", "statistics", "contentDetails"],
    mine: true,
  });

  const channel = response.data.items?.[0];

  if (!channel) {
    throw createError("No YouTube channel found for this account", 404);
  }

  return {
    channelId: channel.id,
    title: channel.snippet?.title,
    description: channel.snippet?.description,
    thumbnail: channel.snippet?.thumbnails?.default?.url,
    subscriberCount: channel.statistics?.subscriberCount,
    videoCount: channel.statistics?.videoCount,
    viewCount: channel.statistics?.viewCount,
    customUrl: channel.snippet?.customUrl,
  };
}

export async function getYouTubePlaylists(userId) {
  const oauth2Client = await getAuthorizedClient(userId);
  const youtube = google.youtube({ version: "v3", auth: oauth2Client });

  const response = await youtube.playlists.list({
    part: ["snippet"],
    mine: true,
    maxResults: 50,
  });

  return (response.data.items || []).map((playlist) => ({
    id: playlist.id,
    title: playlist.snippet?.title,
    description: playlist.snippet?.description,
    thumbnail: playlist.snippet?.thumbnails?.default?.url,
  }));
}

export async function getYouTubeVideoCategories(userId) {
  const oauth2Client = await getAuthorizedClient(userId);
  const youtube = google.youtube({ version: "v3", auth: oauth2Client });

  const response = await youtube.videoCategories.list({
    part: ["snippet"],
    regionCode: "US",
    hl: "en",
  });

  return (response.data.items || [])
    .filter((cat) => cat.snippet?.assignable)
    .map((cat) => ({
      id: cat.id,
      title: cat.snippet?.title,
    }));
}

async function determineIfShort(filePath) {
  try {
    const { probeVideo } = await import("./ffmpegService.js");
    const metadata = await probeVideo(filePath);
    const duration = parseFloat(metadata.format?.duration) || 0;
    const videoStream = metadata.streams?.find((s) => s.codec_type === "video");
    const width = videoStream?.width || 0;
    const height = videoStream?.height || 0;
    const isVertical = height > width;
    return isVertical && duration <= 60;
  } catch {
    return false;
  }
}

export async function deleteYouTubeVideo(userId, videoId) {
  const oauth2Client = await getAuthorizedClient(userId);
  const youtube = google.youtube({ version: "v3", auth: oauth2Client });

  await youtube.videos.delete({ id: videoId });

  logger.info("YouTube video deleted", { userId, videoId });
}

export async function updateYouTubeVideo(userId, videoId, updates) {
  const oauth2Client = await getAuthorizedClient(userId);
  const youtube = google.youtube({ version: "v3", auth: oauth2Client });

  const response = await youtube.videos.update({
    part: ["snippet", "status"],
    requestBody: {
      id: videoId,
      snippet: {
        title: updates.title,
        description: updates.description,
        tags: updates.tags,
        categoryId: updates.categoryId,
      },
      status: {
        privacyStatus: updates.privacyStatus,
      },
    },
  });

  return response.data;
}
