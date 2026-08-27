import multer from "multer";
import path from "path";
import fs from "fs";
import { env } from "./env.js";
import { createError } from "../middleware/errorHandler.js";

const uploadRoot = path.resolve(env.UPLOAD_DIR);

if (!fs.existsSync(uploadRoot)) {
  fs.mkdirSync(uploadRoot, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userDirectory = path.join(uploadRoot, req.user.id);

    if (!fs.existsSync(userDirectory)) {
      fs.mkdirSync(userDirectory, { recursive: true });
    }

    cb(null, userDirectory);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 10);

    cb(null, `${timestamp}-${random}${extension}`);
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

function fileFilter(req, file, cb) {
  const extension = path.extname(file.originalname).toLowerCase();
  const validMime = allowedMimeTypes.includes(file.mimetype);
  const validExtension = allowedExtensions.includes(extension);

  if (!validMime || !validExtension) {
    return cb(
      createError(
        "Unsupported file type. Use MP4, MOV, MKV, AVI, or WebM.",
        415,
      ),
    );
  }

  cb(null, true);
}

function chunkFileFilter(req, file, cb) {
  const extension = path.extname(file.originalname).toLowerCase();
  const validMime = allowedMimeTypes.includes(file.mimetype);
  const isPartFile = extension === ".part";

  if (isPartFile) {
    return cb(null, true);
  }

  if (!validMime) {
    return cb(
      createError(
        "Unsupported file type. Use MP4, MOV, MKV, AVI, or WebM.",
        415,
      ),
    );
  }

  cb(null, true);
}

export const uploadVideo = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: Number(env.MAX_FILE_SIZE),
    files: 1,
  },
});

export const uploadChunk = multer({
  storage,
  fileFilter: chunkFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 + 1024, // 5MB + 1KB buffer for chunk
    files: 1,
  },
});

export default uploadVideo;
