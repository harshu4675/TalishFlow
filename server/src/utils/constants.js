/**
 * Shared server-side constants (single source of truth).
 */

// Clip counts a user may request when generating clips.
// Must stay in sync with the client (client/src/utils/constants.js).
export const VALID_CLIP_COUNTS = [3, 5, 10, 15, 20];
export const DEFAULT_CLIP_COUNT = 10;

export function normalizeClipCount(value) {
  const count = Number(value);
  return VALID_CLIP_COUNTS.includes(count) ? count : DEFAULT_CLIP_COUNT;
}

export const SUPPORTED_PLATFORMS = ["youtube", "instagram"];

export const VIDEO_CONTENT_SIGNATURES = [
  // MP4/M4V/MOV: "ftyp" box at offset 4
  { bytes: [0x66, 0x74, 0x79, 0x70], offset: 4, label: "mp4/mov container" },
  // MKV/WebM: EBML magic
  { bytes: [0x1a, 0x45, 0xdf, 0xa3], offset: 0, label: "mkv/webm container" },
  // AVI: "RIFF"
  { bytes: [0x52, 0x49, 0x46, 0x46], offset: 0, label: "avi container" },
];
