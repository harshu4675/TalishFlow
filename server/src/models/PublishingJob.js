import mongoose from "mongoose";

const publishingJobSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    clipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clip",
      required: true,
    },

    platform: {
      type: String,
      enum: ["youtube", "instagram"],
      required: true,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "queued",
        "publishing",
        "published",
        "failed",
        "cancelled",
      ],
      default: "pending",
    },

    scheduledAt: {
      type: Date,
    },

    publishedAt: Date,

    title: String,
    description: String,
    hashtags: [String],
    tags: [String],

    youtubeConfig: {
      visibility: {
        type: String,
        enum: ["public", "unlisted", "private"],
        default: "public",
      },
      categoryId: String,
      playlistId: String,
      madeForKids: { type: Boolean, default: false },
      thumbnailPath: String,
    },

    instagramConfig: {
      coverImagePath: String,
      shareToFeed: { type: Boolean, default: true },
    },

    platformVideoId: String,
    platformVideoUrl: String,

    errorMessage: String,
    retryCount: { type: Number, default: 0 },
    maxRetries: { type: Number, default: 3 },
  },
  {
    timestamps: true,
  },
);

publishingJobSchema.index({ userId: 1, createdAt: -1 });
publishingJobSchema.index({ userId: 1, status: 1 });
publishingJobSchema.index({ scheduledAt: 1, status: 1 });

const PublishingJob = mongoose.model("PublishingJob", publishingJobSchema);

export default PublishingJob;
