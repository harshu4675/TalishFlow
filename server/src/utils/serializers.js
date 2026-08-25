import { buildRelativeThumbnailUrl } from "../services/mediaTokenService.js";

/**
 * Response serializers.
 *
 * The raw Mongoose documents store FILESYSTEM paths (`thumbnailPath`,
 * `filePath`) which browsers cannot display. Serializers convert those into
 * short-lived, signed, same-origin URLs the SPA can render in <img> tags.
 */

export function serializeClip(doc) {
  if (!doc) return doc;
  const clip = typeof doc.toObject === "function" ? doc.toObject() : { ...doc };

  clip.thumbnailUrl = clip.thumbnailPath
    ? buildRelativeThumbnailUrl("clips", clip._id)
    : null;

  return clip;
}

export function serializeClips(docs) {
  if (!Array.isArray(docs)) return docs;
  return docs.map(serializeClip);
}

export function serializeVideo(doc) {
  if (!doc) return doc;
  const video = typeof doc.toObject === "function" ? doc.toObject() : { ...doc };

  // YouTube-imported videos carry a remote thumbnail URL already.
  if (!video.thumbnailUrl && video.thumbnailPath) {
    video.thumbnailUrl = buildRelativeThumbnailUrl("videos", video._id);
  }

  return video;
}

export function serializeVideos(docs) {
  if (!Array.isArray(docs)) return docs;
  return docs.map(serializeVideo);
}
