import { spawn } from "child_process";
import path from "path";
import { env } from "../config/env.js";
import { ensureDirectory, getUserUploadDirectory } from "./storageService.js";
import logger from "../utils/logger.js";

export async function downloadYouTubeVideo({
  videoId,
  userId,
  outputFilename,
  onProgress,
}) {
  const userDirectory = await ensureDirectory(getUserUploadDirectory(userId));
  const outputTemplate = path.join(userDirectory, outputFilename);

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
    ];

    const process = spawn("yt-dlp", args, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let downloadedPath = null;
    let stderr = "";

    process.stdout.on("data", (data) => {
      const line = data.toString();

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
          stderr: stderr.slice(0, 500),
        });
        return reject(
          new Error(
            `YouTube download failed (code ${code}). The video may be unavailable or restricted.`,
          ),
        );
      }

      const finalPath = downloadedPath || outputTemplate;

      resolve(finalPath);
    });

    process.on("error", (error) => {
      if (error.code === "ENOENT") {
        return reject(
          new Error(
            "yt-dlp is not installed. Install it with: pip install yt-dlp",
          ),
        );
      }

      reject(error);
    });
  });
}
