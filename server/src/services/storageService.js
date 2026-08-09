import fs from "fs/promises";
import path from "path";
import { env } from "../config/env.js";
import { createError } from "../middleware/errorHandler.js";

const uploadRoot = path.resolve(env.UPLOAD_DIR);

export function getUserUploadDirectory(userId) {
  return path.join(uploadRoot, userId.toString());
}

export function getTemporaryUploadDirectory(userId, uploadId) {
  return path.join(getUserUploadDirectory(userId), ".chunks", uploadId);
}

export async function ensureDirectory(directory) {
  await fs.mkdir(directory, { recursive: true });
  return directory;
}

export async function deleteFile(filePath) {
  if (!filePath) return;

  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

export async function deleteDirectory(directory) {
  if (!directory) return;

  try {
    await fs.rm(directory, { recursive: true, force: true });
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

export async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function getFileSize(filePath) {
  const stats = await fs.stat(filePath);
  return stats.size;
}

export async function assertPathIsInsideUploadRoot(filePath) {
  const resolvedPath = path.resolve(filePath);

  if (!resolvedPath.startsWith(uploadRoot)) {
    throw createError("Invalid file path", 400);
  }

  return resolvedPath;
}

export async function mergeChunks({ userId, uploadId, filename, totalChunks }) {
  const temporaryDirectory = getTemporaryUploadDirectory(userId, uploadId);
  const userDirectory = await ensureDirectory(getUserUploadDirectory(userId));
  const destinationPath = path.join(userDirectory, filename);

  const output = await fs.open(destinationPath, "w");

  try {
    for (let index = 0; index < totalChunks; index += 1) {
      const chunkPath = path.join(temporaryDirectory, `${index}.part`);
      const chunk = await fs.readFile(chunkPath);

      await output.write(chunk);
    }
  } finally {
    await output.close();
  }

  await deleteDirectory(temporaryDirectory);

  return destinationPath;
}
