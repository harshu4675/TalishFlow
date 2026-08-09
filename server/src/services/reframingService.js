import path from "path";
import fs from "fs/promises";
import {
  probeVideo,
  convertToVertical,
  extractThumbnail,
} from "./ffmpegService.js";
import { ensureDirectory } from "./storageService.js";
import logger from "../utils/logger.js";

export async function computeReframingOptions(videoPath) {
  const metadata = await probeVideo(videoPath);
  const videoStream = metadata.streams.find((s) => s.codec_type === "video");

  if (!videoStream) {
    throw new Error("No video stream found");
  }

  const sourceWidth = videoStream.width;
  const sourceHeight = videoStream.height;
  const sourceAspect = sourceWidth / sourceHeight;
  const targetAspect = 9 / 16;

  const options = [];

  if (sourceAspect > targetAspect) {
    const cropWidth = Math.round(sourceHeight * targetAspect);

    options.push({
      id: "center",
      label: "Center Crop",
      description: "Crops to the center of the frame",
      cropData: {
        x: Math.round((sourceWidth - cropWidth) / 2),
        y: 0,
        width: cropWidth,
        height: sourceHeight,
      },
    });

    options.push({
      id: "left",
      label: "Left Focus",
      description: "Keeps left portion of the frame",
      cropData: {
        x: 0,
        y: 0,
        width: cropWidth,
        height: sourceHeight,
      },
    });

    options.push({
      id: "right",
      label: "Right Focus",
      description: "Keeps right portion of the frame",
      cropData: {
        x: sourceWidth - cropWidth,
        y: 0,
        width: cropWidth,
        height: sourceHeight,
      },
    });
  } else {
    const cropHeight = Math.round(sourceWidth / targetAspect);

    options.push({
      id: "upper",
      label: "Upper Crop",
      description: "Focuses on the upper portion",
      cropData: {
        x: 0,
        y: 0,
        width: sourceWidth,
        height: cropHeight,
      },
    });

    options.push({
      id: "center",
      label: "Center Crop",
      description: "Crops to the center of the frame",
      cropData: {
        x: 0,
        y: Math.round((sourceHeight - cropHeight) / 2),
        width: sourceWidth,
        height: cropHeight,
      },
    });

    options.push({
      id: "lower",
      label: "Lower Crop",
      description: "Focuses on the lower portion",
      cropData: {
        x: 0,
        y: sourceHeight - cropHeight,
        width: sourceWidth,
        height: cropHeight,
      },
    });
  }

  return {
    sourceWidth,
    sourceHeight,
    sourceAspect,
    targetWidth: 1080,
    targetHeight: 1920,
    options,
  };
}

export async function applyCustomReframing({
  clipId,
  inputPath,
  outputDirectory,
  cropData,
  userId,
}) {
  await ensureDirectory(outputDirectory);

  const outputFilename = `reframed-${clipId}-${Date.now()}.mp4`;
  const outputPath = path.join(outputDirectory, outputFilename);
  const thumbnailPath = path.join(
    outputDirectory,
    `reframed-${clipId}-thumb.jpg`,
  );

  logger.info("Applying custom reframing", { clipId, cropData });

  await convertToVertical({
    inputPath,
    outputPath,
    width: 1080,
    height: 1920,
    cropData,
  });

  await extractThumbnail(outputPath, thumbnailPath, 1);

  const stat = await fs.stat(outputPath);

  return {
    filePath: outputPath,
    thumbnailPath,
    fileSize: stat.size,
    width: 1080,
    height: 1920,
  };
}

export async function generateReframingPreview({
  inputPath,
  outputDirectory,
  cropData,
  previewTime = 1,
}) {
  await ensureDirectory(outputDirectory);

  const previewPath = path.join(outputDirectory, `preview-${Date.now()}.jpg`);

  const { spawn } = await import("child_process");

  const args = [
    "-ss",
    String(previewTime),
    "-i",
    inputPath,
    "-vf",
    `crop=${cropData.width}:${cropData.height}:${cropData.x}:${cropData.y},scale=1080:1920:flags=lanczos`,
    "-frames:v",
    "1",
    "-q:v",
    "3",
    "-y",
    previewPath,
  ];

  return new Promise((resolve, reject) => {
    const proc = spawn("ffmpeg", args, { stdio: ["ignore", "pipe", "pipe"] });

    proc.on("close", (code) => {
      if (code !== 0)
        return reject(new Error(`FFmpeg preview failed with code ${code}`));
      resolve(previewPath);
    });

    proc.on("error", reject);
  });
}
