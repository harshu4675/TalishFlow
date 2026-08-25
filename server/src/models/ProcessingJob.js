import mongoose from "mongoose";

const processingJobSchema = new mongoose.Schema(
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

    bullJobId: String,

    videoTitle: String,

    status: {
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

    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    currentStep: String,

    clipCountRequested: {
      type: Number,
      default: 10,
    },

    clipsGenerated: {
      type: Number,
      default: 0,
    },

    errorMessage: String,
    errorStack: String,

    startedAt: Date,
    completedAt: Date,

    processingTimeMs: Number,
  },
  {
    timestamps: true,
  },
);

processingJobSchema.index({ userId: 1, createdAt: -1 });
processingJobSchema.index({ status: 1 });

const ProcessingJob = mongoose.model("ProcessingJob", processingJobSchema);

export default ProcessingJob;
