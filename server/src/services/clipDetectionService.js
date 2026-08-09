import { probeVideo } from "./ffmpegService.js";
import logger from "../utils/logger.js";

const MIN_CLIP_DURATION = 15;
const MAX_CLIP_DURATION = 90;
const TARGET_CLIP_DURATION = 45;

export async function detectEngagingMoments({
  videoPath,
  transcript,
  sceneChanges = [],
  faceData = {},
  motionSegments = [],
  silentSegments = [],
  clipCount = 10,
}) {
  const metadata = await probeVideo(videoPath);
  const totalDuration = parseFloat(metadata.format.duration) || 0;

  if (totalDuration < MIN_CLIP_DURATION) {
    return buildSingleClipResult(totalDuration);
  }

  const scoredMoments = buildScoredMoments({
    totalDuration,
    transcript,
    sceneChanges,
    faceData,
    motionSegments,
    silentSegments,
  });

  const candidates = selectBestCandidates(
    scoredMoments,
    clipCount,
    totalDuration,
  );

  return candidates;
}

function buildScoredMoments({
  totalDuration,
  transcript,
  sceneChanges,
  faceData,
  motionSegments,
  silentSegments,
}) {
  const resolution = 1;
  const bucketCount = Math.floor(totalDuration / resolution);
  const scores = new Float32Array(bucketCount).fill(0);

  applyTranscriptScores(scores, transcript, resolution, bucketCount);
  applySceneChangeScores(scores, sceneChanges, resolution, bucketCount);
  applyFaceScores(scores, faceData, resolution, bucketCount);
  applyMotionScores(scores, motionSegments, resolution, bucketCount);
  applySilenceDeduction(scores, silentSegments, resolution, bucketCount);

  return scores;
}

function applyTranscriptScores(scores, transcript, resolution, bucketCount) {
  if (!transcript?.segments?.length) return;

  const energyWords = new Set([
    "amazing",
    "incredible",
    "unbelievable",
    "mind-blowing",
    "shocking",
    "never",
    "always",
    "secret",
    "truth",
    "real",
    "actually",
    "literally",
    "best",
    "worst",
    "most",
    "first",
    "only",
    "every",
    "all",
    "wait",
    "look",
    "watch",
    "listen",
    "remember",
    "imagine",
    "money",
    "success",
    "fail",
    "win",
    "lose",
    "love",
    "hate",
    "easy",
    "hard",
    "simple",
    "impossible",
    "perfect",
    "terrible",
    "huge",
    "tiny",
    "massive",
    "tiny",
    "crazy",
    "insane",
    "genius",
  ]);

  const questionWords = new Set([
    "how",
    "why",
    "what",
    "when",
    "who",
    "where",
    "which",
  ]);

  for (const segment of transcript.segments) {
    const bucketIndex = Math.floor(segment.start / resolution);

    if (bucketIndex < 0 || bucketIndex >= bucketCount) continue;

    const words = segment.text.toLowerCase().split(/\s+/);

    let segmentScore = 1.0;

    for (const word of words) {
      const clean = word.replace(/[^a-z]/g, "");

      if (energyWords.has(clean)) segmentScore += 1.5;
      if (questionWords.has(clean)) segmentScore += 0.8;
    }

    const duration = segment.end - segment.start;
    const speechRate = words.length / Math.max(duration, 0.1);

    if (speechRate > 3.5) segmentScore += 1.0;

    const start = Math.floor(segment.start / resolution);
    const end = Math.min(Math.ceil(segment.end / resolution), bucketCount);

    for (let i = start; i < end; i++) {
      scores[i] += segmentScore;
    }
  }
}

function applySceneChangeScores(scores, sceneChanges, resolution, bucketCount) {
  for (const change of sceneChanges) {
    const bucket = Math.floor(change.timestamp / resolution);

    if (bucket < 0 || bucket >= bucketCount) continue;

    const score = 2.0 + (change.score || 0) * 3.0;
    const spread = 5;

    for (
      let i = Math.max(0, bucket - spread);
      i < Math.min(bucketCount, bucket + spread);
      i++
    ) {
      const distance = Math.abs(i - bucket);
      scores[i] += score * Math.exp(-distance * 0.4);
    }
  }
}

function applyFaceScores(scores, faceData, resolution, bucketCount) {
  if (!faceData?.faces?.length) return;

  for (const frame of faceData.faces) {
    const bucket = Math.floor(frame.timestamp / resolution);

    if (bucket < 0 || bucket >= bucketCount) continue;

    const faceCount = frame.faces?.length || 0;
    scores[bucket] += 1.5 + faceCount * 0.8;
  }
}

function applyMotionScores(scores, motionSegments, resolution, bucketCount) {
  for (const segment of motionSegments) {
    const start = Math.floor(segment.start / resolution);
    const end = Math.min(Math.ceil(segment.end / resolution), bucketCount);

    for (let i = start; i < end; i++) {
      scores[i] += 1.2;
    }
  }
}

function applySilenceDeduction(
  scores,
  silentSegments,
  resolution,
  bucketCount,
) {
  for (const segment of silentSegments) {
    if (segment.duration < 1.5) continue;

    const start = Math.floor(segment.start / resolution);
    const end = Math.min(Math.ceil(segment.end / resolution), bucketCount);

    for (let i = start; i < end; i++) {
      scores[i] *= 0.3;
    }
  }
}

function selectBestCandidates(scores, clipCount, totalDuration) {
  const windowSize = Math.round(TARGET_CLIP_DURATION);
  const minGap = 30;
  const candidates = [];

  const windowedScores = computeWindowedScores(scores, windowSize);

  const sortedIndices = Array.from(windowedScores.keys()).sort(
    (a, b) => windowedScores[b] - windowedScores[a],
  );

  const usedRanges = [];

  for (const startBucket of sortedIndices) {
    if (candidates.length >= clipCount) break;

    const startTime = startBucket;
    const endTime = Math.min(
      startTime +
        Math.max(MIN_CLIP_DURATION, Math.min(MAX_CLIP_DURATION, windowSize)),
      totalDuration,
    );

    if (endTime - startTime < MIN_CLIP_DURATION) continue;

    const overlaps = usedRanges.some(
      (range) =>
        startTime < range.end + minGap && endTime > range.start - minGap,
    );

    if (overlaps) continue;

    usedRanges.push({ start: startTime, end: endTime });

    const reasons = buildDetectionReasons(
      scores,
      startBucket,
      Math.ceil(endTime),
    );

    candidates.push({
      startTime: Math.max(0, startTime),
      endTime: Math.min(endTime, totalDuration),
      duration: endTime - startTime,
      score: windowedScores[startBucket],
      normalizedScore: 0,
      detectionReasons: reasons,
      rank: candidates.length + 1,
    });
  }

  const maxScore = Math.max(...candidates.map((c) => c.score), 1);

  return candidates
    .map((c) => ({
      ...c,
      normalizedScore: Math.round((c.score / maxScore) * 100),
    }))
    .sort((a, b) => a.startTime - b.startTime);
}

function computeWindowedScores(scores, windowSize) {
  const windowedScores = new Float32Array(scores.length);
  let windowSum = 0;

  for (let i = 0; i < Math.min(windowSize, scores.length); i++) {
    windowSum += scores[i];
  }

  for (let i = 0; i < scores.length; i++) {
    windowedScores[i] = windowSum;

    if (i + windowSize < scores.length) {
      windowSum += scores[i + windowSize];
    }

    if (i > 0) {
      windowSum -= scores[i - 1];
    }
  }

  return windowedScores;
}

function buildDetectionReasons(scores, start, end) {
  const reasons = [];
  const segmentScores = Array.from(scores.slice(start, end));
  const avgScore =
    segmentScores.reduce((a, b) => a + b, 0) /
    Math.max(segmentScores.length, 1);

  if (avgScore > 4) reasons.push("High engagement");
  if (avgScore > 6) reasons.push("Viral potential");

  const hasHighPeak = segmentScores.some((s) => s > avgScore * 2);

  if (hasHighPeak) reasons.push("Speech energy peak");

  const hasVariance =
    Math.max(...segmentScores) - Math.min(...segmentScores) > avgScore * 1.5;

  if (hasVariance) reasons.push("Scene dynamics");

  if (reasons.length === 0) reasons.push("Balanced content");

  return reasons;
}

function buildSingleClipResult(totalDuration) {
  return [
    {
      startTime: 0,
      endTime: totalDuration,
      duration: totalDuration,
      score: 50,
      normalizedScore: 100,
      detectionReasons: ["Full video"],
      rank: 1,
    },
  ];
}
