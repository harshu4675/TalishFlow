import fs from "fs";
import path from "path";
import { createRequire } from "module";
import { env } from "./env.js";
import logger from "../utils/logger.js";

const require = createRequire(import.meta.url);

function isExecutable(filePath) {
  if (!filePath) return false;
  try {
    if (path.isAbsolute(filePath)) {
      fs.accessSync(filePath, fs.constants.X_OK);
      return true;
    }
    return false; // bare command name — resolved at spawn time
  } catch {
    return false;
  }
}

function findOnPath(command) {
  const dirs = (process.env.PATH || "").split(path.delimiter);
  for (const dir of dirs) {
    if (!dir) continue;
    const candidate = path.join(dir, command);
    try {
      fs.accessSync(candidate, fs.constants.X_OK);
      return candidate;
    } catch {
      /* keep looking */
    }
  }
  return null;
}

/**
 * Verify the external binaries the video pipeline depends on.
 * Logs actionable warnings/errors at startup so operators notice a broken
 * environment instead of discovering it mid-upload with a cryptic failure.
 */
export function runDependencyDiagnostics() {
  let issues = 0;

  // ── FFmpeg / FFprobe ──────────────────────────────────────
  let ffmpegPath = env.FFMPEG_PATH || null;
  if (!ffmpegPath) {
    try {
      ffmpegPath = require("ffmpeg-static") || null;
    } catch {
      ffmpegPath = null;
    }
  }

  let ffprobePath = env.FFPROBE_PATH || null;
  if (!ffprobePath) {
    try {
      const staticProbe = require("ffprobe-static");
      ffprobePath = staticProbe?.path || null;
    } catch {
      ffprobePath = null;
    }
  }

  if (ffmpegPath && isExecutable(ffmpegPath)) {
    logger.info("Diagnostics: ffmpeg available", { ffmpegPath });
  } else {
    issues += 1;
    logger.error(
      "Diagnostics: FFmpeg binary NOT available — video processing will fail at the analysis step. " +
        "Install ffmpeg on the host, or set FFMPEG_PATH to a valid binary. " +
        "(The bundled ffmpeg-static download may have been blocked.)",
    );
  }

  if (ffprobePath && isExecutable(ffprobePath)) {
    logger.info("Diagnostics: ffprobe available", { ffprobePath });
  } else {
    issues += 1;
    logger.error(
      "Diagnostics: FFprobe binary NOT available — video metadata extraction will fail. " +
        "Install ffprobe on the host, or set FFPROBE_PATH to a valid binary.",
    );
  }

  // ── yt-dlp (YouTube import) ───────────────────────────────
  const ytDlpCandidates = [
    env.YT_DLP_PATH,
    "/usr/local/bin/yt-dlp",
    "/usr/bin/yt-dlp",
    path.join(process.env.HOME || "/home/user", ".local", "bin", "yt-dlp"),
  ];
  const ytDlpPath =
    ytDlpCandidates.find((p) => p && isExecutable(p)) || findOnPath("yt-dlp");

  if (ytDlpPath) {
    logger.info("Diagnostics: yt-dlp available", { ytDlpPath });
  } else {
    logger.warn(
      "Diagnostics: yt-dlp NOT found — YouTube imports will fail at the download step. " +
        "Install it with: pip install yt-dlp (or set YT_DLP_PATH).",
    );
  }

  // ── Python / Whisper (transcription) ──────────────────────
  const pythonPath = findOnPath(env.PYTHON_PATH || "python3");
  if (!pythonPath) {
    logger.warn(
      "Diagnostics: python3 NOT found — audio transcription (Whisper) will fail. " +
        "Install Python 3 and 'pip install openai-whisper opencv-python-headless numpy'.",
    );
  } else if (!env.OPENAI_API_KEY) {
    logger.info("Diagnostics: using local Whisper model", {
      model: env.WHISPER_MODEL,
      pythonPath,
    });
  } else {
    logger.info("Diagnostics: OpenAI Whisper API key configured");
  }

  if (issues > 0) {
    logger.error(
      `Diagnostics: ${issues} required video-processing dependency(s) missing — see errors above. ` +
        "Uploads will still be accepted, but processing jobs will fail until these are installed.",
    );
  }
}
