import axios from "axios";
import { createError } from "../middleware/errorHandler.js";
import { env } from "../config/env.js";

export function extractYouTubeVideoId(url) {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace("www.", "");

    if (hostname === "youtu.be") {
      return parsed.pathname.split("/").filter(Boolean)[0] || null;
    }

    if (hostname === "youtube.com" || hostname === "m.youtube.com") {
      if (parsed.pathname === "/watch") return parsed.searchParams.get("v");

      const parts = parsed.pathname.split("/").filter(Boolean);

      if (parts[0] === "shorts" || parts[0] === "embed") {
        return parts[1] || null;
      }
    }

    return null;
  } catch {
    return null;
  }
}

export async function getYouTubeMetadata(url) {
  const videoId = extractYouTubeVideoId(url);

  if (!videoId) {
    throw createError(
      "Unable to extract a YouTube video ID from this URL",
      400,
    );
  }

  if (!env.YOUTUBE_API_KEY) {
    return {
      videoId,
      title: "YouTube Video",
      thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      duration: null,
    };
  }

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
    throw createError("YouTube video was not found or is unavailable", 404);
  }

  return {
    videoId,
    title: item.snippet?.title || "YouTube Video",
    thumbnailUrl:
      item.snippet?.thumbnails?.maxres?.url ||
      item.snippet?.thumbnails?.high?.url ||
      item.snippet?.thumbnails?.medium?.url ||
      `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    duration: item.contentDetails?.duration || null,
  };
}
