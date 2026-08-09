import mongoose from "mongoose";

const analyticsSnapshotSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    platform: {
      type: String,
      enum: ["youtube", "instagram", "aggregate"],
      required: true,
    },

    date: {
      type: Date,
      required: true,
      index: true,
    },

    metrics: {
      views: { type: Number, default: 0 },
      likes: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
      shares: { type: Number, default: 0 },
      saves: { type: Number, default: 0 },
      reach: { type: Number, default: 0 },
      impressions: { type: Number, default: 0 },
      watchTimeMinutes: { type: Number, default: 0 },
      subscribersGained: { type: Number, default: 0 },
      followersGained: { type: Number, default: 0 },
      engagementRate: { type: Number, default: 0 },
      clickThroughRate: { type: Number, default: 0 },
    },

    topContent: [
      {
        platformVideoId: String,
        title: String,
        views: Number,
        likes: Number,
        url: String,
        thumbnailUrl: String,
      },
    ],
  },
  {
    timestamps: true,
  },
);

analyticsSnapshotSchema.index({ userId: 1, platform: 1, date: -1 });
analyticsSnapshotSchema.index({ userId: 1, date: -1 });

const AnalyticsSnapshot = mongoose.model(
  "AnalyticsSnapshot",
  analyticsSnapshotSchema,
);

export default AnalyticsSnapshot;
