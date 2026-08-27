import { spawn } from "child_process";
import path from "path";
import { env } from "../config/env.js";
import { ensureDirectory, getUserUploadDirectory } from "./storageService.js";
import logger from "../utils/logger.js";
import { createError } from "../middleware/errorHandler.js";

function getYtDlpPath() {
  const paths = [
    "yt-dlp",
    "/usr/local/bin/yt-dlp",
    "/usr/bin/yt-dlp",
    process.env.YT_DLP_PATH,
    path.join(process.env.HOME || "/home/user", ".local", "bin", "yt-dlp"),
  ];

  for (const p of paths) {
    if (p && p.trim()) {
      try {
        require("fs").accessSync(p, require("fs").constants.X_OK);
        return p;
      } catch {
        continue;
      }
    }
  }

  return "yt-dlp";
}

export async function downloadYouTubeVideo({
  videoId,
  userId,
  outputFilename,
  onProgress,
}) {
  const userDirectory = await ensureDirectory(getUserUploadDirectory(userId));
  const outputTemplate = path.join(userDirectory, outputFilename);

  const ytDlpPath = getYtDlpPath();

  return new Promise((resolve, reject) => {
    const args = [
      `https://www.youtube.com/watch?v=${videoId}`,
      "--format",
      "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
      "--output",
      outputTemplate,
      "--no-playlist",
      "--no-warnings",
      "--progress",
      "--newline",
      "--merge-output-format",
      "mp4",
      "--retries",
      "3",
      "--timeout",
      "60",
    ];

    logger.info("Starting YouTube download", { videoId, ytDlpPath, outputTemplate });

    const process = spawn(ytDlpPath, args, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let downloadedPath = null;
    let stderr = "";
    let stdout = "";

    process.stdout.on("data", (data) => {
      const line = data.toString();
      stdout += line;

      const progressMatch = line.match(/(\d+\.?\d*)%/);

      if (progressMatch && onProgress) {
        const percent = parseFloat(progressMatch[1]);
        onProgress(Math.min(Math.round(percent), 99));
      }

      const destinationMatch = line.match(/Destination: (.+\.mp4)/);

      if (destinationMatch) {
        downloadedPath = destinationMatch[1].trim();
      }

      const mergeMatch = line.match(/Merging formats into "(.+\.mp4)"/);

      if (mergeMatch) {
        downloadedPath = mergeMatch[1].trim();
      }
    });

    process.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    process.on("close", (code) => {
      if (code !== 0) {
        logger.error("yt-dlp download failed", {
          code,
          videoId,
          stderr: stderr.slice(0, 1000),
          stdout: stdout.slice(0, 1000),
          ytDlpPath,
        });
        return reject(
          createError(
            `YouTube download failed (code ${code}). The video may be unavailable, restricted, or yt-dlp is not properly installed.`,
            500,
          ),
        );
      }

      const finalPath = downloadedPath || outputTemplate;

      logger.info("YouTube download completed", { videoId, finalPath });
      resolve(finalPath);
    });

    process.on("error", (error) => {
      logger.error("yt-dlp spawn error", {
        videoId,
        error: error.message,
        ytDlpPath,
      });

      if (error.code === "ENOENT") {
        return reject(
          createError(
            `yt-dlp is not installed or not found in PATH. Please install it with: pip install yt-dlp. Tried paths: ${paths.join(", ")}`,
            500,
          ),
        );
      }

      reject(error);
    });
  });
}

const paths = [
  "yt-dlp",
  "/usr/local/bin/yt-dlp",
  "/usr/bin/yt-dlp",
  path.join(process.env.HOME || "/home/user", ".local", "bin", "yt-dlp"),
];
