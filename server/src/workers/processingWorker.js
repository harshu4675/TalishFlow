import path from "path";
import fs from "fs/promises";
import processingQueue from "../queues/processingQueue.js";
import ProcessingJob from "../models/ProcessingJob.js";
import Video from "../models/Video.js";
import Clip from "../models/Clip.js";
import User from "../models/User.js";
import {
  extractVideoMetadata,
  extractAudioTrack,
  extractThumbnail,
  extractClipSegment,
  convertToVertical,
  detectSilentSegments,
} from "../services/ffmpegService.js";
import {
  transcribeAudio,
  parseSRT,
  trimSRTToClip,
  generateSRTString,
} from "../services/whisperService.js";
import {
  detectSceneChanges,
  detectFacesInVideo,
  detectMotionSegments,
} from "../services/opencvService.js";
import { detectEngagingMoments } from "../services/clipDetectionService.js";
import { downloadYouTubeVideo } from "../services/youtubeDownloadService.js";
import {
  ensureDirectory,
  getUserUploadDirectory,
  deleteFile,
} from "../services/storageService.js";
import {
  emitProcessingProgress,
  emitProcessingComplete,
  emitProcessingError,
} from "../websocket/wsServer.js";
import logger from "../utils/logger.js";

const CLIP_TTL_HOURS = 24;

function getClipDeletionDate() {
  return new Date(Date.now() + CLIP_TTL_HOURS * 60 * 60 * 1000);
}

async function updateProgress(
  jobId,
  videoId,
  userId,
  status,
  progress,
  currentStep,
) {
  await Promise.all([
    ProcessingJob.findByIdAndUpdate(jobId, { status, progress, currentStep }),
    Video.findByIdAndUpdate(videoId, {
      processingStatus: status,
      processingProgress: progress,
    }),
  ]);

  emitProcessingProgress(userId, jobId, { status, progress, currentStep });
}

processingQueue.process("process-video", 2, async (queueJob) => {
  const { processingJobId, videoId, userId } = queueJob.data;

  logger.info("Processing job started", { processingJobId, videoId, userId });

  const job = await ProcessingJob.findById(processingJobId);
  const video = await Video.findById(videoId);

  if (!job || !video) {
    throw new Error("Processing job or video record not found in database");
  }

  let videoFilePath = video.filePath;
  const userDirectory = await ensureDirectory(getUserUploadDirectory(userId));
  const workDirectory = path.join(userDirectory, `.work-${processingJobId}`);

  await ensureDirectory(workDirectory);

  try {
    job.startedAt = new Date();
    await job.save();

    if (video.source === "youtube") {
      await updateProgress(
        processingJobId,
        videoId,
        userId,
        "downloading",
        5,
        "Downloading YouTube video",
      );

      const outputFilename = `yt-${video.youtubeVideoId}-${Date.now()}.mp4`;

      videoFilePath = await downloadYouTubeVideo({
        videoId: video.youtubeVideoId,
        userId,
        outputFilename,
        onProgress: async (percent) => {
          const scaled = Math.round(5 + percent * 0.2);
          emitProcessingProgress(userId, processingJobId, {
            status: "downloading",
            progress: scaled,
            currentStep: `Downloading YouTube video ${percent}%`,
          });
        },
      });

      await Video.findByIdAndUpdate(videoId, { filePath: videoFilePath });
    }

    await updateProgress(
      processingJobId,
      videoId,
      userId,
      "analyzing",
      25,
      "Analyzing video properties",
    );

    const metadata = await extractVideoMetadata(videoFilePath);

    await Video.findByIdAndUpdate(videoId, {
      duration: metadata.duration,
      width: metadata.width,
      height: metadata.height,
      fps: metadata.fps,
      bitrate: metadata.bitrate,
      codec: metadata.codec,
    });

    const thumbnailPath = path.join(workDirectory, "thumbnail.jpg");
    await extractThumbnail(
      videoFilePath,
      thumbnailPath,
      Math.min(3, metadata.duration * 0.1),
    );
    await Video.findByIdAndUpdate(videoId, { thumbnailPath });

    await updateProgress(
      processingJobId,
      videoId,
      userId,
      "detecting_scenes",
      35,
      "Detecting scene changes",
    );

    const audioPath = path.join(workDirectory, "audio.wav");
    await extractAudioTrack(videoFilePath, audioPath);

    const [sceneChanges, faceData, motionSegments, silentSegments] =
      await Promise.all([
        detectSceneChanges(videoFilePath, 0.4).catch(() => []),
        detectFacesInVideo(videoFilePath, 30).catch(() => ({
          faces: [],
          hasFaces: false,
          primaryFaceRegion: null,
        })),
        detectMotionSegments(videoFilePath).catch(() => []),
        detectSilentSegments(audioPath).catch(() => []),
      ]);

    await Video.findByIdAndUpdate(videoId, {
      sceneChanges: sceneChanges.slice(0, 500),
    });

    await updateProgress(
      processingJobId,
      videoId,
      userId,
      "transcribing",
      55,
      "Transcribing audio with Whisper",
    );

    const transcriptDirectory = path.join(workDirectory, "transcript");
    await ensureDirectory(transcriptDirectory);

    const transcriptionResult = await transcribeAudio({
      audioPath,
      outputDirectory: transcriptDirectory,
      onProgress: (percent) => {
        const scaled = 55 + Math.round(percent * 0.1);
        emitProcessingProgress(userId, processingJobId, {
          status: "transcribing",
          progress: scaled,
          currentStep: `Transcribing audio ${percent}%`,
        });
      },
    });

    await Video.findByIdAndUpdate(videoId, {
      transcript: {
        text: transcriptionResult.text,
        language: transcriptionResult.language,
        segments: transcriptionResult.segments.slice(0, 2000),
      },
    });

    await updateProgress(
      processingJobId,
      videoId,
      userId,
      "generating_clips",
      65,
      "Detecting engaging moments",
    );

    const clipCount = job.clipCountRequested || 10;

    const detectedMoments = await detectEngagingMoments({
      videoPath: videoFilePath,
      transcript: transcriptionResult,
      sceneChanges,
      faceData,
      motionSegments,
      silentSegments,
      clipCount,
    });

    await updateProgress(
      processingJobId,
      videoId,
      userId,
      "converting",
      70,
      "Generating and converting clips to vertical format",
    );

    const clipsDirectory = path.join(userDirectory, "clips");
    await ensureDirectory(clipsDirectory);

    const createdClips = [];

    for (let index = 0; index < detectedMoments.length; index++) {
      const moment = detectedMoments[index];
      const clipProgress =
        70 + Math.round((index / detectedMoments.length) * 25);

      emitProcessingProgress(userId, processingJobId, {
        status: "converting",
        progress: clipProgress,
        currentStep: `Converting clip ${index + 1} of ${detectedMoments.length} to vertical format`,
      });

      const clipId = `clip-${Date.now()}-${index}`;
      const rawClipPath = path.join(workDirectory, `${clipId}-raw.mp4`);
      const verticalClipPath = path.join(
        clipsDirectory,
        `${clipId}-vertical.mp4`,
      );
      const clipThumbnailPath = path.join(
        clipsDirectory,
        `${clipId}-thumb.jpg`,
      );
      const clipSRTPath = path.join(clipsDirectory, `${clipId}.srt`);

      await extractClipSegment({
        inputPath: videoFilePath,
        outputPath: rawClipPath,
        startTime: moment.startTime,
        endTime: moment.endTime,
      });

      await convertToVertical({
        inputPath: rawClipPath,
        outputPath: verticalClipPath,
        width: 1080,
        height: 1920,
        cropData: faceData.primaryFaceRegion || null,
      });

      await extractThumbnail(verticalClipPath, clipThumbnailPath, 1);

      if (transcriptionResult.srtPath) {
        try {
          const srtContent = await fs.readFile(
            transcriptionResult.srtPath,
            "utf-8",
          );
          const parsedSubtitles = parseSRT(srtContent);
          const clippedSubtitles = trimSRTToClip(
            parsedSubtitles,
            moment.startTime,
            moment.endTime,
          );
          const clipSRTContent = generateSRTString(clippedSubtitles);
          await fs.writeFile(clipSRTPath, clipSRTContent, "utf-8");
        } catch {
          logger.warn("Failed to generate SRT for clip", { clipId });
        }
      }

      await deleteFile(rawClipPath);

      const clipTitle = buildClipTitle(transcriptionResult, moment, index);

      const clipStat = await fs.stat(verticalClipPath).catch(() => null);

      const clip = await Clip.create({
        userId,
        videoId,
        title: clipTitle,
        startTime: moment.startTime,
        endTime: moment.endTime,
        duration: moment.duration,
        filePath: verticalClipPath,
        fileSize: clipStat?.size || 0,
        thumbnailPath: clipThumbnailPath,
        width: 1080,
        height: 1920,
        detectionScore: moment.normalizedScore,
        detectionReasons: moment.detectionReasons,
        subtitles: {
          srtPath: clipSRTPath,
          burnedIn: false,
          position: "bottom",
        },
        status: "ready",
        scheduledDeletion: getClipDeletionDate(),
      });

      createdClips.push(clip);
    }

    await Promise.all([
      ProcessingJob.findByIdAndUpdate(processingJobId, {
        status: "completed",
        progress: 100,
        currentStep: "Processing complete",
        clipsGenerated: createdClips.length,
        completedAt: new Date(),
        processingTimeMs: Date.now() - job.startedAt.getTime(),
      }),
      Video.findByIdAndUpdate(videoId, {
        processingStatus: "completed",
        processingProgress: 100,
        clipCount: createdClips.length,
      }),
      User.findByIdAndUpdate(userId, {
        $inc: {
          "stats.totalVideos": video.source === "upload" ? 1 : 0,
          "stats.totalClips": createdClips.length,
        },
      }),
    ]);

    emitProcessingComplete(userId, processingJobId, {
      clipCount: createdClips.length,
      videoId,
    });

    try {
      await fs.rm(workDirectory, { recursive: true, force: true });
    } catch {
      logger.warn("Failed to clean up work directory", { workDirectory });
    }

    logger.info("Processing job completed", {
      processingJobId,
      videoId,
      clipsCreated: createdClips.length,
    });
  } catch (error) {
    logger.error("Processing job failed", {
      processingJobId,
      videoId,
      error: error.message,
    });

    await Promise.all([
      ProcessingJob.findByIdAndUpdate(processingJobId, {
        status: "failed",
        errorMessage: error.message,
        completedAt: new Date(),
      }),
      Video.findByIdAndUpdate(videoId, {
        processingStatus: "failed",
        processingError: error.message,
      }),
    ]);

    emitProcessingError(userId, processingJobId, error.message);

    try {
      await fs.rm(workDirectory, { recursive: true, force: true });
    } catch {
      logger.warn("Failed to clean up work directory after error", {
        workDirectory,
      });
    }

    throw error;
  }
});

function buildClipTitle(transcriptionResult, moment, index) {
  if (!transcriptionResult?.segments?.length) {
    return `Clip ${index + 1}`;
  }

  const segment = transcriptionResult.segments.find(
    (s) => s.start >= moment.startTime && s.start <= moment.endTime,
  );

  if (segment?.text) {
    const words = segment.text.trim().split(/\s+/).slice(0, 8);
    const raw = words.join(" ");
    return raw.length > 60 ? raw.slice(0, 57) + "..." : raw;
  }

  return `Clip ${index + 1}`;
}

export default processingQueue;
