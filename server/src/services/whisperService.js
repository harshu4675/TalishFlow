import { spawn } from "child_process";
import path from "path";
import fs from "fs/promises";
import { env } from "../config/env.js";
import logger from "../utils/logger.js";
import { ensureDirectory } from "./storageService.js";

/**
 * Audio transcription.
 *
 * Strategy:
 *   1. If OPENAI_API_KEY is configured, use the OpenAI Whisper API
 *      (whisper-1) — no local Python dependency.
 *   2. Otherwise, use a local Whisper installation via Python.
 *
 * A transcription failure surfaces as a thrown error; callers (processing
 * worker) treat it as non-fatal and proceed with visual analysis only.
 */
export async function transcribeAudio({
  audioPath,
  outputDirectory,
  language = null,
  model = null,
  onProgress,
}) {
  await ensureDirectory(outputDirectory);

  if (env.OPENAI_API_KEY) {
    try {
      return await transcribeWithOpenAI({ audioPath, outputDirectory, onProgress });
    } catch (error) {
      logger.warn("OpenAI transcription failed, trying local Whisper", {
        error: error.message,
      });
    }
  }

  const whisperModel = model || env.WHISPER_MODEL || "base";
  const pythonPath = env.PYTHON_PATH || "python3";

  const args = [
    "-c",
    buildWhisperScript({
      audioPath,
      outputDirectory,
      model: whisperModel,
      language,
    }),
  ];

  return new Promise((resolve, reject) => {
    const process = spawn(pythonPath, args, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    // Hard kill switch — never let a transcription run forever.
    const killTimer = setTimeout(() => {
      process.kill("SIGKILL");
      reject(new Error("Transcription timed out after 30 minutes"));
    }, 30 * 60 * 1000);
    killTimer.unref?.();

    let stdout = "";
    let stderr = "";

    process.stdout.on("data", (data) => {
      stdout += data.toString();
      const line = data.toString().trim();

      if (line.includes("%") && onProgress) {
        const match = line.match(/(\d+)%/);
        if (match) onProgress(parseInt(match[1]));
      }
    });

    process.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    process.on("close", async (code) => {
      clearTimeout(killTimer);

      if (code !== 0) {
        const missingModule = stderr.includes("No module named 'whisper'");
        logger.error("Whisper transcription failed", {
          code,
          stderr: stderr.slice(0, 500),
        });

        return reject(
          new Error(
            missingModule
              ? "Local Whisper is not installed. Install it with: pip install -U openai-whisper (or configure OPENAI_API_KEY)."
              : `Whisper exited with code ${code}: ${stderr.slice(0, 300)}`,
          ),
        );
      }

      try {
        const result = await parseWhisperOutput(outputDirectory, audioPath);
        resolve(result);
      } catch (parseError) {
        reject(parseError);
      }
    });

    process.on("error", (error) => {
      clearTimeout(killTimer);

      if (error.code === "ENOENT") {
        return reject(
          new Error(
            `Python not found at "${pythonPath}". Set PYTHON_PATH or configure OPENAI_API_KEY.`,
          ),
        );
      }

      reject(new Error(`Failed to start Whisper process: ${error.message}`));
    });
  });
}

function buildWhisperScript({ audioPath, outputDirectory, model, language }) {
  const safePath = audioPath.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  const safeOutput = outputDirectory
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'");

  const languageArg =
    language && language !== "auto" ? `language='${language}'` : "";

  // NOTE: helper functions must be defined BEFORE they are used —
  // an earlier version called format_time() before its definition,
  // which made every local transcription crash with a NameError.
  return `
import whisper
import json
import sys
import os

def format_time(seconds):
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    ms = int((seconds % 1) * 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"

model = whisper.load_model('${model}')

result = model.transcribe(
    '${safePath}',
    ${languageArg ? `${languageArg},` : ""}
    word_timestamps=True,
    verbose=False
)

output_path = os.path.join('${safeOutput}', 'transcript.json')
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(result, f, ensure_ascii=False, indent=2)

srt_path = os.path.join('${safeOutput}', 'subtitles.srt')
with open(srt_path, 'w', encoding='utf-8') as f:
    for i, segment in enumerate(result['segments']):
        start = segment['start']
        end = segment['end']
        text = segment['text'].strip()
        f.write(f"{i + 1}\\n")
        f.write(f"{format_time(start)} --> {format_time(end)}\\n")
        f.write(f"{text}\\n\\n")

print("TRANSCRIPTION_COMPLETE")
`;
}

// ============================================================
// OpenAI Whisper API path
// ============================================================

async function transcribeWithOpenAI({ audioPath, outputDirectory, onProgress }) {
  onProgress?.(10);

  const fileBuffer = await fs.readFile(audioPath);

  const formData = new FormData();
  formData.append("model", "whisper-1");
  formData.append("response_format", "verbose_json");
  formData.append("timestamp_granularities[]", "segment");
  formData.append(
    "file",
    new Blob([fileBuffer], { type: "audio/wav" }),
    path.basename(audioPath),
  );

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}` },
    body: formData,
    signal: AbortSignal.timeout(180_000),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(
      `OpenAI transcription failed (${response.status}): ${
        body?.error?.message || "unknown error"
      }`,
    );
  }

  onProgress?.(85);

  const data = await response.json();

  const transcriptPath = path.join(outputDirectory, "transcript.json");
  await fs.writeFile(transcriptPath, JSON.stringify(data, null, 2), "utf-8");

  // Normalize to the shape produced by local Whisper so downstream code
  // (parseWhisperOutput) is source-agnostic.
  const segments = (data.segments || []).map((segment) => ({
    start: segment.start,
    end: segment.end,
    text: segment.text,
    avg_logprob: segment.avg_logprob,
    words: [],
  }));

  const srtContent = segments
    .map(
      (segment, index) =>
        `${index + 1}\n${formatSrtTime(segment.start)} --> ${formatSrtTime(
          segment.end,
        )}\n${(segment.text || "").trim()}`,
    )
    .join("\n\n");

  const srtPath = path.join(outputDirectory, "subtitles.srt");
  await fs.writeFile(srtPath, srtContent, "utf-8");

  onProgress?.(100);

  return {
    text: (data.text || "").trim(),
    language: data.language || "en",
    segments: segments.map((segment) => ({
      start: segment.start,
      end: segment.end,
      text: (segment.text || "").trim(),
      confidence: segment.avg_logprob ? Math.exp(segment.avg_logprob) : null,
      words: [],
    })),
    srtPath,
  };
}

function formatSrtTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)},${String(ms).padStart(3, "0")}`;
}

async function parseWhisperOutput(outputDirectory, audioPath) {
  const transcriptPath = path.join(outputDirectory, "transcript.json");
  const srtPath = path.join(outputDirectory, "subtitles.srt");

  let transcriptData;

  try {
    const raw = await fs.readFile(transcriptPath, "utf-8");
    transcriptData = JSON.parse(raw);
  } catch (error) {
    throw new Error("Failed to read Whisper transcript output file");
  }

  const segments = (transcriptData.segments || []).map((segment) => ({
    start: segment.start,
    end: segment.end,
    text: segment.text?.trim() || "",
    confidence: segment.avg_logprob ? Math.exp(segment.avg_logprob) : null,
    words: (segment.words || []).map((word) => ({
      word: word.word,
      start: word.start,
      end: word.end,
      confidence: word.probability || null,
    })),
  }));

  const srtExists = await fs
    .access(srtPath)
    .then(() => true)
    .catch(() => false);

  return {
    text: transcriptData.text?.trim() || "",
    language: transcriptData.language || "en",
    segments,
    srtPath: srtExists ? srtPath : null,
  };
}

export function parseSRT(srtContent) {
  const blocks = srtContent.trim().split(/\n\n+/);
  const subtitles = [];

  for (const block of blocks) {
    const lines = block.trim().split("\n");

    if (lines.length < 3) continue;

    const timeMatch = lines[1].match(
      /(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/,
    );

    if (!timeMatch) continue;

    const start = parseSRTTime(timeMatch[1]);
    const end = parseSRTTime(timeMatch[2]);
    const text = lines.slice(2).join("\n").trim();

    subtitles.push({ index: parseInt(lines[0]), start, end, text });
  }

  return subtitles;
}

export function trimSRTToClip(subtitles, clipStart, clipEnd) {
  return subtitles
    .filter((sub) => sub.end > clipStart && sub.start < clipEnd)
    .map((sub, index) => ({
      index: index + 1,
      start: Math.max(0, sub.start - clipStart),
      end: Math.min(clipEnd - clipStart, sub.end - clipStart),
      text: sub.text,
    }));
}

export function generateSRTString(subtitles) {
  return subtitles
    .map((sub) => {
      return `${sub.index}\n${formatSRTTime(sub.start)} --> ${formatSRTTime(sub.end)}\n${sub.text}`;
    })
    .join("\n\n");
}

function parseSRTTime(timeString) {
  const [hms, ms] = timeString.split(",");
  const [h, m, s] = hms.split(":").map(Number);
  return h * 3600 + m * 60 + s + parseInt(ms) / 1000;
}

function formatSRTTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)},${ms.toString().padStart(3, "0")}`;
}

function pad(n) {
  return String(n).padStart(2, "0");
}
