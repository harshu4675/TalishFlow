import { z } from "zod";

export const createPublishingJobSchema = z
  .object({
    clipId: z.string().min(1, "clipId is required"),
    platform: z.enum(["youtube", "instagram"]),
    title: z.string().max(100).optional(),
    description: z.string().max(5000).optional(),
    hashtags: z.array(z.string().max(60)).max(30).optional(),
    tags: z.array(z.string().max(50)).max(30).optional(),
    scheduledAt: z.string().datetime({ offset: true }).optional().nullable(),
    youtubeConfig: z
      .object({
        visibility: z.enum(["public", "unlisted", "private"]).optional(),
        categoryId: z.string().optional(),
        playlistId: z.string().optional(),
        madeForKids: z.boolean().optional(),
      })
      .optional(),
    instagramConfig: z
      .object({
        shareToFeed: z.boolean().optional(),
      })
      .optional(),
  })
  .passthrough(false);

export const listPublishingJobsSchema = z.object({
  platform: z.enum(["youtube", "instagram"]).optional(),
  status: z
    .enum([
      "pending",
      "queued",
      "publishing",
      "published",
      "failed",
      "cancelled",
    ])
    .optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  page: z.coerce.number().int().min(1).default(1),
  sort: z.string().default("-createdAt"),
});
