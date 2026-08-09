import { z } from "zod";

export const youtubeUrlSchema = z.object({
  url: z
    .string()
    .url("Please provide a valid URL")
    .refine(
      (url) => {
        try {
          const hostname = new URL(url).hostname.toLowerCase();

          return [
            "youtube.com",
            "www.youtube.com",
            "m.youtube.com",
            "youtu.be",
            "www.youtu.be",
          ].includes(hostname);
        } catch {
          return false;
        }
      },
      { message: "Please provide a valid YouTube video URL" },
    ),

  clipCount: z.coerce.number().int().min(5).max(20).default(10),
});

export const uploadSettingsSchema = z.object({
  clipCount: z.coerce.number().int().min(5).max(20).default(10),
});

export const resumableInitSchema = z.object({
  filename: z.string().min(1).max(255),
  mimeType: z.string().min(1),
  fileSize: z.coerce
    .number()
    .positive()
    .max(5 * 1024 * 1024 * 1024),
  totalChunks: z.coerce.number().int().positive().max(2000),
  clipCount: z.coerce.number().int().min(5).max(20).default(10),
});

export const resumableChunkSchema = z.object({
  uploadId: z.string().min(1),
  chunkIndex: z.coerce.number().int().min(0),
  totalChunks: z.coerce.number().int().positive(),
});

export const resumableCompleteSchema = z.object({
  uploadId: z.string().min(1),
  clipCount: z.coerce.number().int().min(5).max(20).default(10),
});
