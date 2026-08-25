import mongoose from "mongoose";

// ============================================================
// OAuthToken Schema
// Stores encrypted OAuth access/refresh tokens for connected platforms
// ============================================================

const oAuthTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    platform: {
      type: String,
      enum: ["youtube", "instagram"],
      required: true,
    },

    // Encrypted token data (never store plain tokens)
    encryptedAccessToken: {
      type: String,
      required: true,
    },

    encryptedRefreshToken: {
      type: String,
      default: null,
    },

    // Token metadata
    scope: {
      type: String,
      default: "",
    },

    expiresAt: {
      type: Date,
      default: null,
    },

    tokenType: {
      type: String,
      default: "Bearer",
    },

    // Platform-specific data
    platformUserId: String,
    platformUsername: String,
    platformData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    isValid: {
      type: Boolean,
      default: true,
    },

    connectedAt: {
      type: Date,
      default: Date.now,
    },

    lastRefreshedAt: Date,
  },
  {
    timestamps: true,
  },
);

// ============================================================
// Compound Index — one token set per user per platform
// ============================================================

oAuthTokenSchema.index({ userId: 1, platform: 1 }, { unique: true });

// ============================================================
// Instance Methods
// ============================================================

oAuthTokenSchema.methods.isExpired = function () {
  if (!this.expiresAt) return false;
  return Date.now() >= this.expiresAt.getTime();
};

oAuthTokenSchema.methods.isExpiringSoon = function (bufferMinutes = 5) {
  if (!this.expiresAt) return false;
  const buffer = bufferMinutes * 60 * 1000;
  return Date.now() >= this.expiresAt.getTime() - buffer;
};

const OAuthToken = mongoose.model("OAuthToken", oAuthTokenSchema);

export default OAuthToken;
