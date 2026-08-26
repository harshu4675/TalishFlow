import mongoose from "mongoose";

const clipSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    videoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
      required: true,
    },

    title: {
      type: String,
      trim: true,
      maxlength: 200,
    },

    description: String,

    startTime: {
      type: Number,
      required: true,
    },

    endTime: {
      type: Number,
      required: true,
    },

    duration: Number,

    filePath: String,
    fileSize: Number,
    thumbnailPath: String,
    thumbnailUrl: String,

    width: {
      type: Number,
      default: 1080,
    },

    height: {
      type: Number,
      default: 1920,
    },

    detectionScore: {
      type: Number,
      default: 0,
    },

    detectionReasons: [String],

    transcript: String,

    subtitles: {
      srtPath: String,
      vttPath: String,
      burnedIn: { type: Boolean, default: false },
      style: String,
      fontFamily: String,
      fontSize: Number,
      position: {
        type: String,
        enum: ["top", "center", "bottom"],
        default: "bottom",
      },
    },

    generatedCaptions: [
      {
        language: String,
        style: String,
        text: String,
        generatedAt: Date,
      },
    ],

    generatedHashtags: [String],

    generatedTitles: [
      {
        platform: String,
        title: String,
        generatedAt: Date,
      },
    ],

    exportedVersions: [
      {
        quality: String,
        codec: String,
        filePath: String,
        fileSize: Number,
        exportedAt: Date,
        downloadUrl: String,
        expiresAt: Date,
      },
    ],

    status: {
      type: String,
      enum: ["processing", "ready", "exported", "published", "failed"],
      default: "processing",
    },

    scheduledDeletion: {
      type: Date,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

clipSchema.index({ userId: 1, createdAt: -1 });
clipSchema.index({ videoId: 1 });
clipSchema.index({ scheduledDeletion: 1 }, { expireAfterSeconds: 0 });

const Clip = mongoose.model("Clip", clipSchema);

export default Clip;
