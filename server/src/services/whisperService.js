import { spawn } from "child_process";
import path from "path";
import fs from "fs/promises";
import { env } from "../config/env.js";
import logger from "../utils/logger.js";
import { ensureDirectory } from "./storageService.js";

export async function transcribeAudio({
  audioPath,
  outputDirectory,
  language = null,
  model = null,
  onProgress,
}) {
  await ensureDirectory(outputDirectory);

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
      if (code !== 0) {
        logger.error("Whisper transcription failed", {
          code,
          stderr: stderr.slice(0, 500),
        });
        return reject(
          new Error(
            `Whisper exited with code ${code}: ${stderr.slice(0, 300)}`,
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

  return `
import whisper
import json
import sys
import os

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

def format_time(seconds):
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    ms = int((seconds % 1) * 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"

print("TRANSCRIPTION_COMPLETE")
`;
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
