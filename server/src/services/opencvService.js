import { spawn } from "child_process";
import path from "path";
import fs from "fs/promises";
import { env } from "../config/env.js";
import logger from "../utils/logger.js";
import { ensureDirectory } from "./storageService.js";

export async function detectSceneChanges(videoPath, threshold = 0.4) {
  const pythonPath = env.PYTHON_PATH || "python3";

  const script = buildSceneDetectionScript(videoPath, threshold);

  return new Promise((resolve, reject) => {
    const process = spawn(pythonPath, ["-c", script], {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let output = "";
    let stderr = "";

    process.stdout.on("data", (data) => {
      output += data.toString();
    });

    process.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    process.on("close", (code) => {
      if (code !== 0) {
        logger.error("Scene detection failed", {
          code,
          stderr: stderr.slice(0, 500),
        });
        return reject(new Error(`Scene detection exited with code ${code}`));
      }

      try {
        const jsonStart = output.indexOf("[");
        const jsonEnd = output.lastIndexOf("]");

        if (jsonStart === -1 || jsonEnd === -1) {
          return resolve([]);
        }

        const sceneChanges = JSON.parse(output.slice(jsonStart, jsonEnd + 1));
        resolve(sceneChanges);
      } catch {
        resolve([]);
      }
    });

    process.on("error", (error) => {
      reject(new Error(`Failed to start OpenCV process: ${error.message}`));
    });
  });
}

function buildSceneDetectionScript(videoPath, threshold) {
  const safePath = videoPath.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

  return `
import cv2
import json
import sys
import numpy as np

cap = cv2.VideoCapture('${safePath}')

if not cap.isOpened():
    print('[]')
    sys.exit(0)

fps = cap.get(cv2.CAP_PROP_FPS) or 30
scene_changes = []
prev_frame = None
frame_number = 0
threshold = ${threshold}

while True:
    ret, frame = cap.read()
    if not ret:
        break

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    small = cv2.resize(gray, (160, 90))

    if prev_frame is not None:
        diff = cv2.absdiff(small, prev_frame)
        score = float(np.mean(diff)) / 255.0

        if score > threshold:
            timestamp = frame_number / fps
            scene_changes.append({
                'timestamp': round(timestamp, 3),
                'frame': frame_number,
                'score': round(score, 4)
            })

    prev_frame = small
    frame_number += 1

cap.release()
print(json.dumps(scene_changes))
`;
}

export async function detectFacesInVideo(videoPath, sampleRate = 30) {
  const pythonPath = env.PYTHON_PATH || "python3";

  const script = buildFaceDetectionScript(videoPath, sampleRate);

  return new Promise((resolve, reject) => {
    const process = spawn(pythonPath, ["-c", script], {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let output = "";
    let stderr = "";

    process.stdout.on("data", (data) => {
      output += data.toString();
    });

    process.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    process.on("close", (code) => {
      if (code !== 0) {
        logger.warn("Face detection failed, continuing without face data", {
          code,
          stderr: stderr.slice(0, 200),
        });
        return resolve({ faces: [], hasFaces: false, primaryFaceRegion: null });
      }

      try {
        const jsonStart = output.indexOf("{");
        const jsonEnd = output.lastIndexOf("}");

        if (jsonStart === -1 || jsonEnd === -1) {
          return resolve({
            faces: [],
            hasFaces: false,
            primaryFaceRegion: null,
          });
        }

        const result = JSON.parse(output.slice(jsonStart, jsonEnd + 1));
        resolve(result);
      } catch {
        resolve({ faces: [], hasFaces: false, primaryFaceRegion: null });
      }
    });

    process.on("error", () => {
      resolve({ faces: [], hasFaces: false, primaryFaceRegion: null });
    });
  });
}

function buildFaceDetectionScript(videoPath, sampleRate) {
  const safePath = videoPath.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

  return `
import cv2
import json
import numpy as np

cap = cv2.VideoCapture('${safePath}')

if not cap.isOpened():
    print('{"faces": [], "hasFaces": false, "primaryFaceRegion": null}')
    exit()

fps = cap.get(cv2.CAP_PROP_FPS) or 30
total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
profile_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_profileface.xml')

all_face_regions = []
face_timeline = []
sample_rate = ${sampleRate}

frame_number = 0

while True:
    ret, frame = cap.read()
    if not ret:
        break

    if frame_number % sample_rate == 0:
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        timestamp = frame_number / fps

        frontal = face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(60, 60)
        )

        profile = profile_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(60, 60)
        )

        combined = list(frontal) + list(profile)

        if len(combined) > 0:
            timestamp_faces = []
            for (x, y, w, h) in combined:
                all_face_regions.append({'x': int(x), 'y': int(y), 'w': int(w), 'h': int(h)})
                timestamp_faces.append({'x': int(x), 'y': int(y), 'w': int(w), 'h': int(h)})

            face_timeline.append({
                'timestamp': round(timestamp, 3),
                'faces': timestamp_faces
            })

    frame_number += 1

cap.release()

has_faces = len(all_face_regions) > 0
primary_region = None

if has_faces:
    xs = [r['x'] for r in all_face_regions]
    ys = [r['y'] for r in all_face_regions]
    ws = [r['w'] for r in all_face_regions]
    hs = [r['h'] for r in all_face_regions]

    center_x = int(np.median([x + w // 2 for x, w in zip(xs, ws)]))
    center_y = int(np.median([y + h // 2 for y, h in zip(ys, hs)]))

    target_aspect = 9 / 16
    crop_width = min(width, int(height * target_aspect))
    crop_height = min(height, int(width / target_aspect))

    crop_x = max(0, min(center_x - crop_width // 2, width - crop_width))
    crop_y = max(0, min(center_y - crop_height // 3, height - crop_height))

    primary_region = {
        'x': crop_x,
        'y': crop_y,
        'width': crop_width,
        'height': crop_height,
        'center_x': center_x,
        'center_y': center_y
    }

result = {
    'faces': face_timeline[:50],
    'hasFaces': has_faces,
    'primaryFaceRegion': primary_region,
    'frameWidth': width,
    'frameHeight': height
}

print(json.dumps(result))
`;
}

export async function detectMotionSegments(
  videoPath,
  threshold = 2000,
  sampleRate = 15,
) {
  const pythonPath = env.PYTHON_PATH || "python3";

  const script = `
import cv2
import json
import numpy as np

cap = cv2.VideoCapture('${videoPath.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}')

if not cap.isOpened():
    print('[]')
    exit()

fps = cap.get(cv2.CAP_PROP_FPS) or 30
prev_frame = None
motion_segments = []
frame_number = 0
in_motion = False
motion_start = 0

while True:
    ret, frame = cap.read()
    if not ret:
        break

    if frame_number % ${sampleRate} == 0:
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (21, 21), 0)
        timestamp = frame_number / fps

        if prev_frame is not None:
            diff = cv2.absdiff(prev_frame, blurred)
            _, thresh = cv2.threshold(diff, 25, 255, cv2.THRESH_BINARY)
            motion_score = float(np.sum(thresh))

            if motion_score > ${threshold}:
                if not in_motion:
                    motion_start = timestamp
                    in_motion = True
            else:
                if in_motion:
                    motion_segments.append({
                        'start': round(motion_start, 3),
                        'end': round(timestamp, 3),
                        'duration': round(timestamp - motion_start, 3)
                    })
                    in_motion = False

        prev_frame = blurred

    frame_number += 1

cap.release()
print(json.dumps(motion_segments))
`;

  return new Promise((resolve, reject) => {
    const process = spawn(env.PYTHON_PATH || "python3", ["-c", script], {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let output = "";

    process.stdout.on("data", (data) => {
      output += data.toString();
    });

    process.on("close", (code) => {
      if (code !== 0) return resolve([]);

      try {
        const jsonStart = output.indexOf("[");
        const jsonEnd = output.lastIndexOf("]");
        if (jsonStart === -1) return resolve([]);
        resolve(JSON.parse(output.slice(jsonStart, jsonEnd + 1)));
      } catch {
        resolve([]);
      }
    });

    process.on("error", () => resolve([]));
  });
}
