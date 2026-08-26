import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { env } from "./env.js";
import { createError } from "../middleware/errorHandler.js";

const uploadRoot = path.resolve(env.UPLOAD_DIR);

if (!fs.existsSync(uploadRoot)) {
  fs.mkdirSync(uploadRoot, { recursive: true });
}

/**
 * Multer disk storage. Writes to a per-user directory with a generated
 * storage name — raw user filenames are NEVER used to build paths
 * (prevents path traversal / collisions).
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userDirectory = path.join(uploadRoot, req.user.id);

    if (!fs.existsSync(userDirectory)) {
      fs.mkdirSync(userDirectory, { recursive: true });
    }

    cb(null, userDirectory);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname || "").toLowerCase();
    const safeExtension = /^\.[a-z0-9]{1,10}$/.test(extension) ? extension : "";
    cb(
      null,
      `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${safeExtension}`,
    );
  },
});

const allowedMimeTypes = [
  "video/mp4",
  "video/quicktime",
  "video/x-matroska",
  "video/x-msvideo",
  "video/webm",
];

const allowedExtensions = [".mp4", ".mov", ".mkv", ".avi", ".webm"];

function videoFileFilter(req, file, cb) {
  const extension = path.extname(file.originalname || "").toLowerCase();
  const validMime = allowedMimeTypes.includes(file.mimetype);
  const validExtension = allowedExtensions.includes(extension);

  if (!validMime || !validExtension) {
    return cb(
      createError(
        "Unsupported file type. Use MP4, MOV, MKV, AVI, or WebM.",
        415,
        { code: "UNSUPPORTED_FILE_TYPE" },
      ),
    );
  }

  cb(null, true);
}

/**
 * Direct single-request video upload (used for smaller files / fallback).
 */
export const uploadVideo = multer({
  storage,
  fileFilter: videoFileFilter,
  limits: {
    fileSize: Number(env.MAX_FILE_SIZE),
    files: 1,
  },
});

// ── Resumable (chunked) uploads ──────────────────────────────

export const RESUMABLE_CHUNK_SIZE = 5 * 1024 * 1024; // must match client
const MAX_CHUNK_SIZE = 16 * 1024 * 1024; // chunk + transport margin

/**
 * Chunks are opaque binary blobs (application/octet-stream) — the MIME
 * type of the assembled file is validated at session init by extension +
 * size, and again after merge by content sniffing. Rejecting non-video
 * MIME types HERE is what used to break every resumable upload.
 */
export const uploadChunk = multer({
  storage,
  limits: {
    fileSize: MAX_CHUNK_SIZE,
    files: 1,
  },
});

export default uploadVideo;
