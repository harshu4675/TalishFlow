import axios from "axios";
import { createError } from "../middleware/errorHandler.js";
import { env } from "../config/env.js";
import logger from "../utils/logger.js";

const YOUTUBE_HOSTNAMES = [
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
  "www.youtu.be",
];

export function extractYouTubeVideoId(url) {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase().replace("www.", "");

    if (hostname === "youtu.be") {
      const parts = parsed.pathname.split("/").filter(Boolean);
      return parts[0] || null;
    }

    if (YOUTUBE_HOSTNAMES.includes(hostname)) {
      if (parsed.pathname === "/watch" || parsed.pathname === "/shorts") {
        return parsed.searchParams.get("v") || null;
      }

      const parts = parsed.pathname.split("/").filter(Boolean);

      if (parts[0] === "shorts" || parts[0] === "embed" || parts[0] === "watch") {
        return parts[1] || parsed.searchParams.get("v") || null;
      }

      if (parts.length > 0) {
        return parts[0] || null;
      }
    }

    return null;
  } catch (error) {
    logger.warn("Failed to extract YouTube video ID", { url, error: error.message });
    return null;
  }
}

export async function getYouTubeMetadata(url) {
  const videoId = extractYouTubeVideoId(url);

  if (!videoId) {
    throw createError(
      "Unable to extract a YouTube video ID from this URL. Please provide a valid YouTube video URL.",
      400,
    );
  }

  if (!env.YOUTUBE_API_KEY) {
    logger.info("YouTube API key not configured, using fallback metadata", { videoId });
    return {
      videoId,
      title: "YouTube Video",
      thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      duration: null,
    };
  }

  try {
    const response = await axios.get(
      "https://www.googleapis.com/youtube/v3/videos",
      {
        params: {
          part: "snippet,contentDetails",
          id: videoId,
          key: env.YOUTUBE_API_KEY,
        },
        timeout: 10000,
      },
    );

    const item = response.data?.items?.[0];

    if (!item) {
      throw createError(
        "YouTube video was not found or is unavailable. The video may be private or deleted.",
        404,
      );
    }

    const title = item.snippet?.title || "YouTube Video";
    const thumbnailUrl =
      item.snippet?.thumbnails?.maxres?.url ||
      item.snippet?.thumbnails?.high?.url ||
      item.snippet?.thumbnails?.medium?.url ||
      item.snippet?.thumbnails?.standard?.url ||
      item.snippet?.thumbnails?.default?.url ||
      `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

    const duration = item.contentDetails?.duration || null;

    logger.info("Retrieved YouTube metadata", { videoId, title, duration });

    return {
      videoId,
      title,
      thumbnailUrl,
      duration,
    };
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      if (status === 404) {
        throw createError(
          "YouTube video was not found or is unavailable. The video may be private or deleted.",
          404,
        );
      }

      if (status === 403) {
        throw createError(
          "YouTube API access denied. Please check your YouTube API key.",
          403,
        );
      }

      logger.error("YouTube API error", {
        videoId,
        status: error.response?.status,
        error: data?.error?.message || error.message,
      });

      throw createError(
        `Failed to retrieve YouTube metadata: ${data?.error?.message || error.message}`,
        status || 500,
      );
    }

    logger.error("YouTube metadata fetch failed", {
      videoId,
      error: error.message,
    });

    logger.warn("Falling back to basic YouTube metadata", { videoId });

    return {
      videoId,
      title: "YouTube Video",
      thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      duration: null,
    };
  }
}
