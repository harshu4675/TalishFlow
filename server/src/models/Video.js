import mongoose from "mongoose";

const videoSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      trim: true,
      maxlength: 200,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 5000,
    },

    source: {
      type: String,
      enum: ["upload", "youtube"],
      required: true,
    },

    youtubeUrl: String,
    youtubeVideoId: String,

    originalFilename: String,
    filePath: String,
    fileSize: Number,
    mimeType: String,

    thumbnailUrl: String,
    thumbnailPath: String,

    duration: Number,
    width: Number,
    height: Number,
    fps: Number,
    bitrate: Number,
    codec: String,

    processingStatus: {
      type: String,
      enum: [
        "pending",
        "queued",
        "downloading",
        "analyzing",
        "detecting_scenes",
        "detecting_speech",
        "detecting_faces",
        "generating_clips",
        "transcribing",
        "converting",
        "completed",
        "failed",
      ],
      default: "pending",
    },

    processingProgress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    processingError: String,

    processingJobId: String,

    transcript: {
      text: String,
      language: String,
      segments: [
        {
          start: Number,
          end: Number,
          text: String,
          confidence: Number,
        },
      ],
    },

    sceneChanges: [
      {
        timestamp: Number,
        confidence: Number,
      },
    ],

    clipCount: {
      type: Number,
      default: 0,
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

videoSchema.index({ userId: 1, createdAt: -1 });
videoSchema.index({ userId: 1, processingStatus: 1 });
videoSchema.index({ scheduledDeletion: 1 }, { expireAfterSeconds: 0 });

const Video = mongoose.model("Video", videoSchema);

export default Video;
