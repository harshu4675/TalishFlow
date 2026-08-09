import { formatDistanceToNow, format, parseISO } from "date-fns";

// ============================================================
// Number Formatters
// ============================================================

/**
 * Format large numbers into human-readable format (1.2K, 4.5M)
 */
export function formatNumber(num) {
  if (num === null || num === undefined) return "0";

  const n = Number(num);

  if (n >= 1_000_000_000) {
    return `${(n / 1_000_000_000).toFixed(1)}B`;
  }
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(1)}M`;
  }
  if (n >= 1_000) {
    return `${(n / 1_000).toFixed(1)}K`;
  }

  return n.toLocaleString();
}

/**
 * Format bytes into human-readable file size
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${units[i]}`;
}

/**
 * Format percentage
 */
export function formatPercent(value, decimals = 1) {
  return `${Number(value).toFixed(decimals)}%`;
}

// ============================================================
// Time Formatters
// ============================================================

/**
 * Format seconds into HH:MM:SS or MM:SS
 */
export function formatDuration(seconds) {
  if (!seconds || seconds < 0) return "0:00";

  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  const pad = (n) => String(n).padStart(2, "0");

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(secs)}`;
  }

  return `${minutes}:${pad(secs)}`;
}

/**
 * Format seconds into milliseconds timestamp (for FFmpeg)
 */
export function formatTimestamp(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);

  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(ms).padStart(3, "0")}`;
}

/**
 * Format date to relative time (2 hours ago)
 */
export function formatRelativeTime(date) {
  if (!date) return "";

  const parsed = typeof date === "string" ? parseISO(date) : date;

  return formatDistanceToNow(parsed, { addSuffix: true });
}

/**
 * Format date to readable string
 */
export function formatDate(date, fmt = "MMM d, yyyy") {
  if (!date) return "";

  const parsed = typeof date === "string" ? parseISO(date) : date;

  return format(parsed, fmt);
}

/**
 * Format date with time
 */
export function formatDateTime(date) {
  return formatDate(date, "MMM d, yyyy · h:mm a");
}

// ============================================================
// String Formatters
// ============================================================

/**
 * Truncate string with ellipsis
 */
export function truncate(str, length = 50) {
  if (!str) return "";
  if (str.length <= length) return str;

  return `${str.slice(0, length)}...`;
}

/**
 * Capitalize first letter
 */
export function capitalize(str) {
  if (!str) return "";

  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Convert snake_case to Title Case
 */
export function snakeToTitle(str) {
  return str
    .split("_")
    .map((word) => capitalize(word))
    .join(" ");
}

/**
 * Generate initials from name
 */
export function getInitials(name) {
  if (!name) return "??";

  return name
    .split(" ")
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

/**
 * Format YouTube URL to extract video ID
 */
export function extractYouTubeId(url) {
  if (!url) return null;

  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&\s]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([^?\s]+)/,
    /(?:https?:\/\/)?youtu\.be\/([^?\s]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^?\s]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

/**
 * Validate YouTube URL
 */
export function isValidYouTubeUrl(url) {
  return extractYouTubeId(url) !== null;
}
