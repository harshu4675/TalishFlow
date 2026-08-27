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

const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

const MAX_TITLE_LENGTH = 200; // must match Video.title maxlength

/**
 * Extract the 11-character YouTube video ID from any supported URL format:
 *   https://youtu.be/VIDEO_ID
 *   https://(www.|m.)youtube.com/watch?v=VIDEO_ID
 *   https://(www.|m.)youtube.com/shorts/VIDEO_ID
 *   https://(www.|m.)youtube.com/embed/VIDEO_ID
 *   https://(www.|m.)youtube.com/live/VIDEO_ID
 *   http(s)://youtube.com/VIDEO_ID  (no scheme handled by caller via new URL)
 */
export function extractYouTubeVideoId(url) {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");

    if (hostname === "youtu.be") {
      const parts = parsed.pathname.split("/").filter(Boolean);
      return normalizeCandidateId(parts[0]);
    }

    if (["youtube.com", "m.youtube.com"].includes(hostname)) {
      // /watch?v=ID (also covers /live with ?v=)
      const vParam = parsed.searchParams.get("v");
      if (vParam) return normalizeCandidateId(vParam);

      const parts = parsed.pathname.split("/").filter(Boolean);

      if (
        parts[0] &&
        ["shorts", "embed", "watch", "live", "v"].includes(parts[0])
      ) {
        return normalizeCandidateId(parts[1]);
      }

      // Bare path: youtube.com/VIDEO_ID
      if (parts.length > 0) {
        return normalizeCandidateId(parts[0]);
      }
    }

    return null;
  } catch (error) {
    logger.warn("Failed to extract YouTube video ID", {
      url,
      error: error.message,
    });
    return null;
  }
}

function normalizeCandidateId(candidate) {
  if (!candidate) return null;
  const id = String(candidate).trim();
  return VIDEO_ID_PATTERN.test(id) ? id : null;
}

/**
 * Parse an ISO-8601 duration (e.g. "PT1H2M3S", "PT12M34S", "PT45S")
 * into whole seconds. Returns null when the value is not a duration.
 */
export function parseIso8601Duration(value) {
  if (typeof value !== "string") {
    return typeof value === "number" && Number.isFinite(value)
      ? Math.floor(value)
      : null;
  }

  const match = value
    .toUpperCase()
    .match(/^(?:PT)?(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?$/);

  if (!match || (match[1] === undefined && match[2] === undefined && match[3] === undefined)) {
    return null;
  }

  const hours = Number(match[1] || 0);
  const minutes = Number(match[2] || 0);
  const seconds = Number(match[3] || 0);

  return Math.floor(hours * 3600 + minutes * 60 + seconds);
}

/**
 * Placeholder keys (shipped in .env.example etc.) are not real credentials.
 * Treating them as "configured" makes every import fail against Google.
 */
export function isUsableApiKey(key) {
  if (!key || typeof key !== "string") return false;
  const trimmed = key.trim();
  if (!trimmed) return false;
  if (
    /^(your[_-]|my[_-]|change[_-]|placeholder|xxx+|<)/i.test(trimmed) ||
    trimmed.includes("your_youtube_api_key")
  ) {
    return false;
  }
  return true;
}

function truncateTitle(title) {
  if (typeof title !== "string") return null;
  const cleaned = title.replace(/\s+/g, " ").trim();
  if (!cleaned) return null;
  return cleaned.length > MAX_TITLE_LENGTH
    ? cleaned.slice(0, MAX_TITLE_LENGTH).trim()
    : cleaned;
}

function fallbackMetadata(videoId) {
  return {
    videoId,
    title: "YouTube Video",
    thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    duration: null,
  };
}

/**
 * Fetch metadata via the official YouTube Data API v3.
 * Normalizes the result to { videoId, title, thumbnailUrl, duration (seconds) }.
 * Throws createError with notFound=true when the video does not exist.
 */
async function fetchMetadataViaDataApi(videoId, apiKey) {
  const response = await axios.get(
    "https://www.googleapis.com/youtube/v3/videos",
    {
      params: {
        part: "snippet,contentDetails",
        id: videoId,
        key: apiKey,
      },
      timeout: 10000,
    },
  );

  const item = response.data?.items?.[0];

  if (!item) {
    const error = createError(
      "YouTube video was not found or is unavailable. The video may be private or deleted.",
      404,
      { code: "YOUTUBE_NOT_FOUND" },
    );
    error.notFound = true;
    throw error;
  }

  const title = truncateTitle(item.snippet?.title);
  const thumbnails = item.snippet?.thumbnails || {};
  const thumbnailUrl =
    thumbnails.maxres?.url ||
    thumbnails.high?.url ||
    thumbnails.medium?.url ||
    thumbnails.standard?.url ||
    thumbnails.default?.url ||
    `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  const duration = parseIso8601Duration(item.contentDetails?.duration);

  logger.info("Retrieved YouTube metadata via Data API", {
    videoId,
    title,
    duration,
  });

  return { videoId, title, thumbnailUrl, duration };
}

/**
 * Fetch metadata via the keyless official YouTube oEmbed endpoint.
 * Used as a dependency-free fallback when no Data API key is configured.
 * Throws createError with notFound=true when the video is unavailable.
 */
async function fetchMetadataViaOEmbed(videoId) {
  const response = await axios.get("https://www.youtube.com/oembed", {
    params: {
      url: `https://www.youtube.com/watch?v=${videoId}`,
      format: "json",
    },
    timeout: 10000,
  });

  const data = response.data;

  const title = truncateTitle(data?.title);
  const thumbnailUrl =
    data?.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  logger.info("Retrieved YouTube metadata via oEmbed", { videoId, title });

  return { videoId, title, thumbnailUrl, duration: null };
}

/**
 * Resolve metadata for a YouTube video ID.
 *
 * Strategy (most to least authoritative):
 *   1. YouTube Data API v3 (when a real API key is configured)
 *   2. YouTube oEmbed (official, keyless)
 *   3. ID-derived fallback (generic title + standard thumbnail)
 *
 * A missing/broken API key must not break imports; only a video that is
 * genuinely unavailable is a hard 404.
 */
export async function getYouTubeMetadata(url) {
  const videoId = extractYouTubeVideoId(url);

  if (!videoId) {
    throw createError(
      "Invalid YouTube URL. Please provide a valid YouTube video URL (e.g., https://www.youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID)",
      400,
      { code: "YOUTUBE_INVALID_URL" },
    );
  }

  const apiKey = isUsableApiKey(env.YOUTUBE_API_KEY) ? env.YOUTUBE_API_KEY.trim() : null;

  if (!apiKey) {
    logger.info("YouTube API key not configured, using keyless metadata", { videoId });
  }

  if (apiKey) {
    try {
      return await fetchMetadataViaDataApi(videoId, apiKey);
    } catch (error) {
      if (error.notFound) throw error;

      if (error.response?.status === 404) {
        const notFound = createError(
          "YouTube video was not found or is unavailable. The video may be private or deleted.",
          404,
          { code: "YOUTUBE_NOT_FOUND" },
        );
        notFound.notFound = true;
        throw notFound;
      }

      // Invalid key / quota / transient API failure → degrade to keyless lookup
      logger.warn("YouTube Data API failed, falling back to oEmbed", {
        videoId,
        status: error.response?.status,
        error: error.response?.data?.error?.message || error.message,
      });
    }
  }

  try {
    return await fetchMetadataViaOEmbed(videoId);
  } catch (error) {
    if (error.notFound) throw error;

    if (error.response && [400, 401, 404].includes(error.response.status)) {
      logger.warn("oEmbed reports video unavailable", {
        videoId,
        status: error.response.status,
      });
      const notFound = createError(
        "YouTube video was not found or is unavailable. The video may be private, deleted, or embeds-disabled.",
        404,
        { code: "YOUTUBE_NOT_FOUND" },
      );
      notFound.notFound = true;
      throw notFound;
    }

    // Network-level failure — keep the import working with basic metadata
    logger.warn("Falling back to basic YouTube metadata", {
      videoId,
      error: error.message,
    });
    return fallbackMetadata(videoId);
  }
}
