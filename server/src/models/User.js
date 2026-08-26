import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// ============================================================
// User Schema
// ============================================================

const userSchema = new mongoose.Schema(
  {
    // ── Identity ─────────────────────────────────────────
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [60, "Name cannot exceed 60 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },

    password: {
      type: String,
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // Never returned by default
    },

    avatar: {
      type: String,
      default: null,
    },

    // ── OAuth ─────────────────────────────────────────────
    googleId: {
      type: String,
      sparse: true,
    },

    // ── Account Status ────────────────────────────────────
    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    emailVerificationToken: {
      type: String,
      select: false,
    },

    emailVerificationExpires: {
      type: Date,
      select: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    // ── Password Reset ────────────────────────────────────
    passwordResetToken: {
      type: String,
      select: false,
    },

    passwordResetExpires: {
      type: Date,
      select: false,
    },

    // ── Refresh Tokens ────────────────────────────────────
    refreshTokens: {
      type: [
        {
          token: { type: String, required: true },
          createdAt: { type: Date, default: Date.now },
          expiresAt: { type: Date, required: true },
          userAgent: String,
          ip: String,
        },
      ],
      select: false,
      default: [],
    },

    // ── Connected Platforms ───────────────────────────────
    connectedAccounts: {
      youtube: {
        connected: { type: Boolean, default: false },
        channelId: String,
        channelName: String,
        channelAvatar: String,
        connectedAt: Date,
      },
      instagram: {
        connected: { type: Boolean, default: false },
        accountId: String,
        username: String,
        accountType: String,
        connectedAt: Date,
      },
    },

    // ── Preferences ───────────────────────────────────────
    preferences: {
      theme: {
        type: String,
        enum: ["light", "dark", "system"],
        default: "system",
      },
      notifications: {
        email: { type: Boolean, default: true },
        processing: { type: Boolean, default: true },
        publishing: { type: Boolean, default: true },
        marketing: { type: Boolean, default: false },
      },
      defaultLanguage: {
        type: String,
        default: "en",
      },
      defaultCaptionStyle: {
        type: String,
        default: "professional",
      },
    },

    // ── Usage Stats ───────────────────────────────────────
    stats: {
      totalVideos: { type: Number, default: 0 },
      totalClips: { type: Number, default: 0 },
      totalPublished: { type: Number, default: 0 },
      storageUsed: { type: Number, default: 0 }, // bytes
    },

    // ── Security ──────────────────────────────────────────
    loginAttempts: {
      type: Number,
      default: 0,
      select: false,
    },

    lockUntil: {
      type: Date,
      select: false,
    },

    lastLoginAt: Date,
    lastLoginIp: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ============================================================
// Indexes
// ============================================================

userSchema.index({ createdAt: -1 });

// ============================================================
// Virtuals
// ============================================================

userSchema.virtual("isLocked").get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

userSchema.virtual("initials").get(function () {
  return this.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");
});

// ============================================================
// Pre-save Hooks
// ============================================================

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();

  const saltRounds = 12;
  this.password = await bcrypt.hash(this.password, saltRounds);
  next();
});

// ============================================================
// Instance Methods
// ============================================================

/**
 * Compare plain-text password with stored hash
 */
userSchema.methods.comparePassword = async function (plainPassword) {
  if (!this.password) return false;
  return bcrypt.compare(plainPassword, this.password);
};

/**
 * Increment login attempts (account lockout)
 */
userSchema.methods.incrementLoginAttempts = async function () {
  const MAX_ATTEMPTS = 5;
  const LOCK_TIME = 2 * 60 * 60 * 1000; // 2 hours

  // Reset if lock has expired
  if (this.lockUntil && this.lockUntil < Date.now()) {
    await this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 },
    });
    return;
  }

  const updates = { $inc: { loginAttempts: 1 } };

  if (this.loginAttempts + 1 >= MAX_ATTEMPTS && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + LOCK_TIME };
  }

  await this.updateOne(updates);
};

/**
 * Reset login attempts on successful login
 */
userSchema.methods.resetLoginAttempts = async function () {
  await this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 },
  });
};

/**
 * Add refresh token
 */
userSchema.methods.addRefreshToken = async function (
  token,
  expiresAt,
  meta = {},
) {
  // Limit stored refresh tokens per user
  const MAX_TOKENS = 10;

  await this.updateOne({
    $push: {
      refreshTokens: {
        $each: [{ token, expiresAt, ...meta }],
        $slice: -MAX_TOKENS,
      },
    },
  });
};

/**
 * Remove a specific refresh token
 */
userSchema.methods.removeRefreshToken = async function (token) {
  await this.updateOne({
    $pull: { refreshTokens: { token } },
  });
};

/**
 * Remove all refresh tokens (logout all devices)
 */
userSchema.methods.removeAllRefreshTokens = async function () {
  await this.updateOne({ $set: { refreshTokens: [] } });
};

/**
 * Get safe public profile (no sensitive fields)
 */
userSchema.methods.toPublicProfile = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    avatar: this.avatar,
    role: this.role,
    isEmailVerified: this.isEmailVerified,
    isActive: this.isActive,
    connectedAccounts: this.connectedAccounts,
    preferences: this.preferences,
    stats: this.stats,
    lastLoginAt: this.lastLoginAt,
    createdAt: this.createdAt,
  };
};

// ============================================================
// Static Methods
// ============================================================

userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase().trim() });
};

const User = mongoose.model("User", userSchema);

export default User;
