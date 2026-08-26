import axios from "axios";
import { createError } from "../middleware/errorHandler.js";
import { env } from "../config/env.js";
import logger from "../utils/logger.js";

/**
 * Extract a YouTube video id from watch / share / shorts / embed / live URLs.
 */
export function extractYouTubeVideoId(url) {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace(/^(www\.|m\.)/, "");

    if (!/^(youtube\.com|youtu\.be|youtube-nocookie\.com)$/.test(hostname)) {
      return null;
    }

    if (hostname === "youtu.be") {
      return parsed.pathname.split("/").filter(Boolean)[0] || null;
    }

    if (parsed.pathname === "/watch") {
      return parsed.searchParams.get("v") || null;
    }

    const parts = parsed.pathname.split("/").filter(Boolean);

    if (["shorts", "embed", "live", "v"].includes(parts[0])) {
      return parts[1] || null;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Parse ISO 8601 durations like PT1H2M3S → seconds (number).
 */
export function parseIso8601Duration(value) {
  if (typeof value !== "string") return null;
  const match = value.match(
    /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?$/,
  );
  if (!match) return null;

  const hours = Number(match[1] || 0);
  const minutes = Number(match[2] || 0);
  const seconds = Number(match[3] || 0);

  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Fetch video metadata.
 *
 * Strategy:
 *   1. YouTube Data API v3 when YOUTUBE_API_KEY is configured (rich data).
 *   2. oEmbed (no key required) — still returns title/author/thumbnail.
 *
 * Errors are mapped to honest, user-facing codes: not found, private,
 * unavailable.
 */
export async function getYouTubeMetadata(url) {
  const videoId = extractYouTubeVideoId(url);

  if (!videoId) {
    throw createError(
      "Unable to extract a YouTube video ID from this URL",
      400,
      { code: "YOUTUBE_URL_INVALID" },
    );
  }

  if (env.YOUTUBE_API_KEY) {
    try {
      return await fetchFromDataApi(videoId);
    } catch (error) {
      // Fall through to oEmbed for resilience unless it was a 404.
      if (error.statusCode === 404) throw error;
      logger.warn("YouTube Data API failed, falling back to oEmbed", {
        error: error.message,
      });
    }
  }

  return fetchFromOEmbed(videoId);
}

async function fetchFromDataApi(videoId) {
  let response;

  try {
    response = await axios.get("https://www.googleapis.com/youtube/v3/videos", {
      params: {
        part: "snippet,contentDetails,status",
        id: videoId,
        key: env.YOUTUBE_API_KEY,
      },
      timeout: 10000,
    });
  } catch (error) {
    if (error.response?.status === 403) {
      throw createError(
        "The YouTube API key on this server is invalid or restricted. Check server configuration.",
        502,
        { code: "YOUTUBE_API_KEY_INVALID" },
      );
    }
    throw error;
  }

  const item = response.data?.items?.[0];

  if (!item) {
    throw createError(
      "That YouTube video doesn't exist, is private, or is unavailable.",
      404,
      { code: "YOUTUBE_VIDEO_UNAVAILABLE" },
    );
  }

  if (item.status?.privacyStatus === "private") {
    throw createError(
      "This YouTube video is private and cannot be imported.",
      400,
      { code: "YOUTUBE_VIDEO_PRIVATE" },
    );
  }

  return {
    videoId,
    title: item.snippet?.title || "YouTube Video",
    channelTitle: item.snippet?.channelTitle || null,
    thumbnailUrl:
      item.snippet?.thumbnails?.maxres?.url ||
      item.snippet?.thumbnails?.high?.url ||
      item.snippet?.thumbnails?.medium?.url ||
      `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    duration: parseIso8601Duration(item.contentDetails?.duration),
  };
}

async function fetchFromOEmbed(videoId) {
  try {
    const response = await axios.get("https://www.youtube.com/oembed", {
      params: {
        url: `https://www.youtube.com/watch?v=${videoId}`,
        format: "json",
      },
      timeout: 10000,
      // oEmbed returns 401/404 for unavailable videos
      validateStatus: (status) => status < 500,
    });

    if (response.status !== 200) {
      throw createError(
        "That YouTube video doesn't exist, is private, or is unavailable.",
        404,
        { code: "YOUTUBE_VIDEO_UNAVAILABLE" },
      );
    }

    return {
      videoId,
      title: response.data?.title || "YouTube Video",
      channelTitle: response.data?.author_name || null,
      thumbnailUrl:
        response.data?.thumbnail_url ||
        `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      duration: null, // oEmbed doesn't provide duration
    };
  } catch (error) {
    if (error.statusCode) throw error;
    throw createError(
      "Could not reach YouTube to validate this link. Check your connection and try again.",
      502,
      { code: "YOUTUBE_METADATA_UNREACHABLE" },
    );
  }
}
