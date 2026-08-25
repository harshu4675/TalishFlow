import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs/promises";
import fsSync from "fs";
import { createRequire } from "module";
import { env } from "../config/env.js";
import logger from "../utils/logger.js";
import { ensureDirectory } from "./storageService.js";

const require = createRequire(import.meta.url);

/**
 * Resolve an ffmpeg/ffprobe binary path, in priority order:
 *   1. Explicit env override (FFMPEG_PATH / FFPROBE_PATH)
 *   2. ffmpeg-static / ffprobe-static package binaries
 *   3. @ffmpeg-installer / @ffprobe-installer platform packages
 *   4. System PATH (return null → fluent-ffmpeg uses PATH default)
 */
function resolveBinary(envOverride, resolver) {
  if (envOverride && fsSync.existsSync(envOverride)) return envOverride;

  try {
    const candidate = resolver();
    if (candidate && fsSync.existsSync(candidate)) return candidate;
  } catch {
    /* resolver threw — try next */
  }

  return null;
}

function fromFfmpegStatic() {
  return require("ffmpeg-static");
}

function fromFfprobeStatic() {
  return require("ffprobe-static").path;
}

function fromFfmpegInstaller() {
  return require("@ffmpeg-installer/ffmpeg").path;
}

function fromFfprobeInstaller() {
  return require("@ffprobe-installer/ffprobe").path;
}

const resolvedFfmpegPath =
  resolveBinary(env.FFMPEG_PATH, fromFfmpegStatic) ||
  resolveBinary(null, fromFfmpegInstaller) ||
  resolveBinary(env.FFMPEG_PATH, () => env.FFMPEG_PATH);

const resolvedFfprobePath =
  resolveBinary(env.FFPROBE_PATH, fromFfprobeStatic) ||
  resolveBinary(null, fromFfprobeInstaller) ||
  resolveBinary(env.FFPROBE_PATH, () => env.FFPROBE_PATH);

if (resolvedFfmpegPath) {
  ffmpeg.setFfmpegPath(resolvedFfmpegPath);
  logger.info(`FFmpeg binary: ${resolvedFfmpegPath}`);
} else {
  logger.warn("FFmpeg: no bundled binary found — falling back to system PATH");
}

if (resolvedFfprobePath) {
  ffmpeg.setFfprobePath(resolvedFfprobePath);
  logger.info(`FFprobe binary: ${resolvedFfprobePath}`);
} else {
  logger.warn("FFprobe: no bundled binary found — falling back to system PATH");
}

/**
 * Safely parse an ffprobe frame rate like "30000/1001" without eval().
 */
function parseFrameRate(value) {
  if (!value || typeof value !== "string") return 30;
  const [numerator, denominator] = value.split("/").map(Number);
  if (!Number.isFinite(numerator)) return 30;
  return denominator ? numerator / denominator : numerator;
}

export function probeVideo(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (error, metadata) => {
      if (error) return reject(error);
      resolve(metadata);
    });
  });
}

export async function extractVideoMetadata(filePath) {
  const metadata = await probeVideo(filePath);
  const videoStream = metadata.streams.find((s) => s.codec_type === "video");
  const audioStream = metadata.streams.find((s) => s.codec_type === "audio");

  if (!videoStream) {
    throw new Error("No video stream found in the uploaded file");
  }

  const duration = parseFloat(metadata.format.duration) || 0;
  const fps = parseFrameRate(videoStream.r_frame_rate || videoStream.avg_frame_rate);
  const bitrate = parseInt(metadata.format.bit_rate) || 0;

  return {
    duration,
    width: videoStream.width,
    height: videoStream.height,
    fps: Math.round(fps * 100) / 100,
    bitrate,
    codec: videoStream.codec_name,
    audioCodec: audioStream?.codec_name || null,
    sampleRate: audioStream?.sample_rate || null,
    channels: audioStream?.channels || null,
    fileSize: parseInt(metadata.format.size) || 0,
    format: metadata.format.format_name,
  };
}

export async function extractAudioTrack(videoPath, outputPath) {
  await ensureDirectory(path.dirname(outputPath));

  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .noVideo()
      .audioCodec("pcm_s16le")
      .audioFrequency(16000)
      .audioChannels(1)
      .output(outputPath)
      .on("end", () => resolve(outputPath))
      .on("error", reject)
      .run();
  });
}

export async function extractThumbnail(videoPath, outputPath, timeSeconds = 1) {
  await ensureDirectory(path.dirname(outputPath));
  const directory = path.dirname(outputPath);
  const filename = path.basename(outputPath);

  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .screenshots({
        timestamps: [timeSeconds],
        filename,
        folder: directory,
        size: "1280x720",
      })
      .on("end", () => resolve(outputPath))
      .on("error", reject);
  });
}

export async function extractClipSegment({
  inputPath,
  outputPath,
  startTime,
  endTime,
  onProgress,
}) {
  await ensureDirectory(path.dirname(outputPath));
  const duration = endTime - startTime;

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .seekInput(startTime)
      .duration(duration)
      .videoCodec("libx264")
      .audioCodec("aac")
      .outputOptions([
        "-preset fast",
        "-crf 18",
        "-movflags +faststart",
        "-pix_fmt yuv420p",
      ])
      .output(outputPath)
      .on("progress", (progress) => {
        if (onProgress && duration > 0) {
          const percent = Math.min(
            Math.round(
              (progress.timemark
                ? parseTimemark(progress.timemark) / duration
                : 0) * 100,
            ),
            99,
          );
          onProgress(percent);
        }
      })
      .on("end", () => resolve(outputPath))
      .on("error", reject)
      .run();
  });
}

export async function convertToVertical({
  inputPath,
  outputPath,
  width = 1080,
  height = 1920,
  cropData,
  onProgress,
}) {
  await ensureDirectory(path.dirname(outputPath));

  const metadata = await probeVideo(inputPath);
  const videoStream = metadata.streams.find((s) => s.codec_type === "video");
  const sourceWidth = videoStream?.width || 1920;
  const sourceHeight = videoStream?.height || 1080;
  const sourceDuration = parseFloat(metadata.format.duration) || 0;

  const targetAspect = width / height;
  const sourceAspect = sourceWidth / sourceHeight;

  let cropWidth, cropHeight, cropX, cropY;

  if (cropData) {
    cropWidth = cropData.width;
    cropHeight = cropData.height;
    cropX = cropData.x;
    cropY = cropData.y;
  } else {
    if (sourceAspect > targetAspect) {
      cropHeight = sourceHeight;
      cropWidth = Math.round(sourceHeight * targetAspect);
      cropX = Math.round((sourceWidth - cropWidth) / 2);
      cropY = 0;
    } else {
      cropWidth = sourceWidth;
      cropHeight = Math.round(sourceWidth / targetAspect);
      cropX = 0;
      cropY = Math.round((sourceHeight - cropHeight) / 3);
    }
  }

  const cropFilter = `crop=${cropWidth}:${cropHeight}:${cropX}:${cropY}`;
  const scaleFilter = `scale=${width}:${height}:flags=lanczos`;
  const videoFilter = `${cropFilter},${scaleFilter}`;

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoFilter(videoFilter)
      .videoCodec("libx264")
      .audioCodec("aac")
      .outputOptions([
        "-preset slow",
        "-crf 18",
        "-movflags +faststart",
        "-pix_fmt yuv420p",
        "-profile:v high",
        "-level:v 4.0",
      ])
      .output(outputPath)
      .on("progress", (progress) => {
        if (onProgress && sourceDuration > 0) {
          const current = progress.timemark
            ? parseTimemark(progress.timemark)
            : 0;
          const percent = Math.min(
            Math.round((current / sourceDuration) * 100),
            99,
          );
          onProgress(percent);
        }
      })
      .on("end", () => resolve(outputPath))
      .on("error", reject)
      .run();
  });
}

export async function burnSubtitles({
  inputPath,
  outputPath,
  subtitlePath,
  style = {},
  onProgress,
}) {
  await ensureDirectory(path.dirname(outputPath));

  const metadata = await probeVideo(inputPath);
  const duration = parseFloat(metadata.format.duration) || 0;

  const fontName = style.fontFamily || "Manrope";
  const fontSize = style.fontSize || 28;
  const primaryColour = style.color ? hexToAssColor(style.color) : "&H00FFFFFF";
  const outlineColour = "&H00000000";
  const shadowColour = "&H80000000";
  const bold = style.bold ? "1" : "0";
  const alignment =
    style.position === "top" ? 8 : style.position === "center" ? 5 : 2;
  const marginV = style.position === "top" ? 50 : 80;

  const assStyle = `FontName=${fontName},FontSize=${fontSize},PrimaryColour=${primaryColour},OutlineColour=${outlineColour},ShadowColour=${shadowColour},Bold=${bold},Alignment=${alignment},MarginV=${marginV},Outline=2,Shadow=1`;

  const subtitleFilter = `subtitles=${subtitlePath.replace(/\\/g, "/")}:force_style='${assStyle}'`;

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoFilter(subtitleFilter)
      .videoCodec("libx264")
      .audioCodec("copy")
      .outputOptions(["-preset fast", "-crf 18", "-movflags +faststart"])
      .output(outputPath)
      .on("progress", (progress) => {
        if (onProgress && duration > 0) {
          const current = progress.timemark
            ? parseTimemark(progress.timemark)
            : 0;
          const percent = Math.min(Math.round((current / duration) * 100), 99);
          onProgress(percent);
        }
      })
      .on("end", () => resolve(outputPath))
      .on("error", reject)
      .run();
  });
}

export async function exportWithQuality({
  inputPath,
  outputPath,
  quality,
  codec = "h264",
  onProgress,
}) {
  await ensureDirectory(path.dirname(outputPath));

  const metadata = await probeVideo(inputPath);
  const duration = parseFloat(metadata.format.duration) || 0;

  const qualitySettings = {
    "1080p": { width: 1080, height: 1920, crf: 18, preset: "slow" },
    "2k": { width: 1440, height: 2560, crf: 16, preset: "slow" },
    "4k": { width: 2160, height: 3840, crf: 14, preset: "slow" },
  };

  const settings = qualitySettings[quality] || qualitySettings["1080p"];

  const videoCodecMap = {
    h264: "libx264",
    h265: "libx265",
    av1: "libaom-av1",
  };

  const videoCodec = videoCodecMap[codec] || "libx264";

  const outputOptions = [
    `-preset ${settings.preset}`,
    `-crf ${settings.crf}`,
    "-movflags +faststart",
    "-pix_fmt yuv420p",
  ];

  if (codec === "h265") {
    outputOptions.push("-tag:v hvc1");
  }

  if (codec === "av1") {
    outputOptions.push("-cpu-used 4", "-row-mt 1");
  }

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoFilter(`scale=${settings.width}:${settings.height}:flags=lanczos`)
      .videoCodec(videoCodec)
      .audioCodec("aac")
      .audioBitrate("192k")
      .outputOptions(outputOptions)
      .output(outputPath)
      .on("progress", (progress) => {
        if (onProgress && duration > 0) {
          const current = progress.timemark
            ? parseTimemark(progress.timemark)
            : 0;
          const percent = Math.min(Math.round((current / duration) * 100), 99);
          onProgress(percent);
        }
      })
      .on("end", () => resolve(outputPath))
      .on("error", reject)
      .run();
  });
}

export async function detectSilentSegments(
  audioPath,
  noiseThreshold = -40,
  minDuration = 0.5,
) {
  return new Promise((resolve, reject) => {
    const silentSegments = [];
    let output = "";

    ffmpeg(audioPath)
      .audioFilter(`silencedetect=n=${noiseThreshold}dB:d=${minDuration}`)
      .format("null")
      .output("/dev/null")
      .on("stderr", (line) => {
        output += line + "\n";
      })
      .on("end", () => {
        const startMatches = output.matchAll(/silence_start: ([\d.]+)/g);
        const endMatches = output.matchAll(/silence_end: ([\d.]+)/g);

        const starts = Array.from(startMatches).map((m) => parseFloat(m[1]));
        const ends = Array.from(endMatches).map((m) => parseFloat(m[1]));

        for (let i = 0; i < Math.min(starts.length, ends.length); i++) {
          silentSegments.push({
            start: starts[i],
            end: ends[i],
            duration: ends[i] - starts[i],
          });
        }

        resolve(silentSegments);
      })
      .on("error", reject)
      .run();
  });
}

export async function generateWaveformData(audioPath, samples = 500) {
  return new Promise((resolve, reject) => {
    let rawOutput = "";

    ffmpeg(audioPath)
      .audioFilter(
        `aresample=8000,asetnsamples=${samples},astats=metadata=1:reset=1`,
      )
      .format("null")
      .output("/dev/null")
      .on("stderr", (line) => {
        rawOutput += line + "\n";
      })
      .on("end", () => {
        const rmsMatches = rawOutput.matchAll(/RMS level dB: ([-\d.]+)/g);
        const levels = Array.from(rmsMatches).map((m) => {
          const db = parseFloat(m[1]);
          return isFinite(db) ? Math.max(0, Math.min(1, (db + 60) / 60)) : 0;
        });
        resolve(levels);
      })
      .on("error", reject)
      .run();
  });
}

function parseTimemark(timemark) {
  const parts = timemark.split(":");
  return (
    parseFloat(parts[0]) * 3600 +
    parseFloat(parts[1]) * 60 +
    parseFloat(parts[2])
  );
}

function hexToAssColor(hex) {
  const clean = hex.replace("#", "");
  const r = clean.slice(0, 2);
  const g = clean.slice(2, 4);
  const b = clean.slice(4, 6);
  return `&H00${b}${g}${r}`;
}
