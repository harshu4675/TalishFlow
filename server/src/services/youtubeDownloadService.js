import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import fsp from "fs/promises";
import { env } from "../config/env.js";
import { ensureDirectory, getUserUploadDirectory } from "./storageService.js";
import logger from "../utils/logger.js";
import { createError } from "../middleware/errorHandler.js";

const DOWNLOAD_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes hard cap

function getYtDlpPath() {
  const candidates = [
    env.YT_DLP_PATH,
    "yt-dlp",
    "/usr/local/bin/yt-dlp",
    "/usr/bin/yt-dlp",
    path.join(process.env.HOME || "/home/user", ".local", "bin", "yt-dlp"),
  ];

  for (const candidate of candidates) {
    if (!candidate || !candidate.trim()) continue;
    try {
      // Absolute paths must exist; bare names are resolved via PATH at spawn
      if (path.isAbsolute(candidate)) {
        fs.accessSync(candidate, fs.constants.X_OK);
      } else {
        // Quick check that the command name is non-empty; spawn reports
        // ENOENT with a clear message if it is missing.
        return candidate;
      }
      return candidate;
    } catch {
      continue;
    }
  }

  return "yt-dlp";
}

function formatTriedPaths() {
  return [
    env.YT_DLP_PATH,
    "yt-dlp (PATH)",
    "/usr/local/bin/yt-dlp",
    "/usr/bin/yt-dlp",
    path.join(process.env.HOME || "/home/user", ".local", "bin", "yt-dlp"),
  ]
    .filter(Boolean)
    .join(", ");
}

/**
 * Download a YouTube video with yt-dlp into the user's upload directory.
 *
 * @returns {Promise<string>} absolute path of the downloaded .mp4 file
 */
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
      "--merge-output-format",
      "mp4",
      "--output",
      outputTemplate,
      "--no-playlist",
      "--no-warnings",
      "--progress",
      "--newline",
      "--restrict-filenames",
      "--retries",
      "3",
      "--socket-timeout",
      "30",
    ];

    logger.info("Starting YouTube download", {
      videoId,
      ytDlpPath,
      outputTemplate,
    });

    let child;
    try {
      child = spawn(ytDlpPath, args, {
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch (error) {
      logger.error("yt-dlp spawn error", { videoId, error: error.message });
      return reject(
        createError(
          "Failed to start the YouTube downloader.",
          500,
          {
            code: "YTDLP_NOT_INSTALLED",
            details: `Could not start yt-dlp (${error.message}). Tried paths: ${formatTriedPaths()}. Install it with: pip install yt-dlp (or set YT_DLP_PATH).`,
          },
        ),
      );
    }

    let settled = false;
    let timeoutHandle = null;

    const finish = (fn) => {
      if (settled) return;
      settled = true;
      if (timeoutHandle) clearTimeout(timeoutHandle);
      fn();
    };

    timeoutHandle = setTimeout(() => {
      logger.error("YouTube download timed out", {
        videoId,
        timeoutMs: DOWNLOAD_TIMEOUT_MS,
      });
      try {
        child.kill("SIGKILL");
      } catch {
        /* ignore */
      }
      finish(() =>
        reject(
          createError(
            "YouTube download timed out after 30 minutes. Please try again.",
            504,
            { code: "YOUTUBE_DOWNLOAD_TIMEOUT" },
          ),
        ),
      );
    }, DOWNLOAD_TIMEOUT_MS);

    let stderr = "";
    let stdout = "";

    child.stdout.on("data", (data) => {
      const line = data.toString();
      stdout += line;

      const progressMatch = line.match(/(\d+\.?\d*)%/);
      if (progressMatch && onProgress) {
        onProgress(Math.min(Math.round(parseFloat(progressMatch[1])), 99));
      }
      // "Destination:" / "Merging formats into" lines are informational;
      // the final file location is verified against the output template
      // after the process exits (more reliable across yt-dlp versions).
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("error", (error) => {
      if (error.code === "ENOENT") {
        logger.error("yt-dlp binary not found", {
          videoId,
          ytDlpPath,
          error: error.message,
        });
        return finish(() =>
          reject(
            createError(
              "The YouTube downloader (yt-dlp) is not installed on this server. Contact your administrator.",
              503,
              {
                code: "YTDLP_NOT_INSTALLED",
                details: `yt-dlp binary not found. Tried paths: ${formatTriedPaths()}. Install it with: pip install yt-dlp (or set YT_DLP_PATH to its location).`,
              },
            ),
          ),
        );
      }

      logger.error("yt-dlp spawn error", {
        videoId,
        error: error.message,
        ytDlpPath,
      });
      finish(() =>
        reject(
          createError(
            "Failed to run the YouTube downloader on this server.",
            500,
            { code: "YTDLP_NOT_INSTALLED", details: error.message },
          ),
        ),
      );
    });

    child.on("close", async (code) => {
      if (code !== 0) {
        logger.error("yt-dlp download failed", {
          code,
          videoId,
          stderr: stderr.slice(0, 1500),
          stdout: stdout.slice(-1500),
          ytDlpPath,
        });
        return finish(() =>
          reject(
            createError(
              "YouTube download failed. The video may be unavailable, age-restricted, or region-locked. Please try another video.",
              502,
              {
                code: "YOUTUBE_DOWNLOAD_FAILED",
                details: stderr.trim().slice(0, 500) || `yt-dlp exited with code ${code}`,
              },
            ),
          ),
        );
      }

      // Verify the merged file actually landed where we told yt-dlp to put it
      const finalPath = await verifyDownloadedFile(outputTemplate, userDirectory, videoId);
      if (!finalPath) {
        logger.error("yt-dlp exited 0 but produced no readable file", {
          videoId,
          outputTemplate,
          stdout: stdout.slice(-1000),
          stderr: stderr.slice(-1000),
        });
        return finish(() =>
          reject(
            createError(
              "YouTube download finished but no video file was produced. Please try again.",
              502,
              {
                code: "YOUTUBE_DOWNLOAD_INVALID",
                details: `Expected file at ${outputTemplate}`,
              },
            ),
          ),
        );
      }

      logger.info("YouTube download completed", { videoId, finalPath });
      finish(() => resolve(finalPath));
    });
  });
}

/**
 * After a successful yt-dlp run, locate the final .mp4. The template path
 * is authoritative; if it is missing we scan the user directory for a
 * recently written file belonging to this download.
 */
async function verifyDownloadedFile(outputTemplate, userDirectory, videoId) {
  try {
    const stats = await fsp.stat(outputTemplate);
    if (stats.size > 0) return outputTemplate;
  } catch {
    // fall through to directory scan
  }

  // yt-dlp may leave intermediate ".fNNNNNN" parts behind on edge cases
  try {
    const entries = await fsp.readdir(userDirectory);
    const candidates = entries
      .filter(
        (name) =>
          name.includes(`yt-${videoId}-`) &&
          (name.endsWith(".mp4") || name.endsWith(".fwebm") === false),
      )
      .map((name) => path.join(userDirectory, name))
      .filter((name) => !name.endsWith(".part"));

    let best = null;
    let bestSize = 0;
    for (const candidate of candidates) {
      try {
        const stats = await fsp.stat(candidate);
        if (stats.size > bestSize && candidate !== outputTemplate) {
          best = candidate;
          bestSize = stats.size;
        }
      } catch {
        /* skip unreadable */
      }
    }
    return best;
  } catch {
    return null;
  }
}
