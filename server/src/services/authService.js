import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";
import User from "../models/User.js";
import OAuthToken from "../models/OAuthToken.js";
import { env } from "../config/env.js";
import logger from "../utils/logger.js";
import {
  generateSecureToken,
  hashToken,
  encrypt,
  decrypt,
} from "../utils/crypto.js";
import { createError } from "../middleware/errorHandler.js";

// ============================================================
// JWT Utilities
// ============================================================

/**
 * Generate access token (short-lived, in-memory on client)
 */
export function generateAccessToken(userId, role = "user") {
  return jwt.sign({ userId: userId.toString(), role }, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES,
  });
}

/**
 * Generate refresh token (long-lived, httpOnly cookie)
 */
export function generateRefreshToken(userId) {
  return jwt.sign(
    { userId: userId.toString(), type: "refresh" },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES },
  );
}

/**
 * Verify access token
 */
export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, env.JWT_SECRET);
  } catch (error) {
    throw createError(
      error.name === "TokenExpiredError"
        ? "Access token expired"
        : "Invalid access token",
      401,
    );
  }
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET);
  } catch (error) {
    throw createError(
      error.name === "TokenExpiredError"
        ? "Refresh token expired"
        : "Invalid refresh token",
      401,
    );
  }
}

/**
 * Calculate refresh token expiry date
 */
export function getRefreshTokenExpiry() {
  const days = parseInt(env.JWT_REFRESH_EXPIRES) || 7;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

// ============================================================
// Cookie Configuration
// ============================================================

export const REFRESH_COOKIE_NAME = "tf_refresh_token";
export const CSRF_COOKIE_NAME = "tf_csrf_token";

export function getRefreshCookieOptions() {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: env.NODE_ENV === "production" ? "strict" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    path: "/api/v1/auth",
  };
}

export function getClearCookieOptions() {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: env.NODE_ENV === "production" ? "strict" : "lax",
    path: "/api/v1/auth",
  };
}

// ============================================================
// Auth Operations
// ============================================================

/**
 * Register new user with email/password
 */
export async function registerUser({ name, email, password, ip, userAgent }) {
  // Check if email already exists
  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    throw createError("An account with this email already exists", 409);
  }

  // Create user (password hashed via pre-save hook)
  const user = await User.create({ name, email, password });

  // Generate email verification token
  const verificationToken = generateSecureToken();
  const hashedToken = hashToken(verificationToken);

  await user.updateOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
  });

  // Send verification email (non-blocking)
  sendVerificationEmail(user.email, user.name, verificationToken).catch((err) =>
    logger.error("Failed to send verification email", { error: err.message }),
  );

  // Generate tokens
  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  // Store refresh token
  await user.addRefreshToken(refreshToken, getRefreshTokenExpiry(), {
    userAgent,
    ip,
  });

  logger.info("User registered", { userId: user._id, email: user.email });

  return { user: user.toPublicProfile(), accessToken, refreshToken };
}

/**
 * Login user with email/password
 */
export async function loginUser({ email, password, ip, userAgent }) {
  // Fetch user with password and refresh tokens
  const user = await User.findByEmail(email).select(
    "+password +loginAttempts +lockUntil +refreshTokens",
  );

  if (!user) {
    throw createError("Invalid email or password", 401);
  }

  // Check account lock
  if (user.isLocked) {
    throw createError(
      "Account temporarily locked due to too many failed attempts. Try again in 2 hours.",
      423,
    );
  }

  // Check account active
  if (!user.isActive) {
    throw createError(
      "Account has been deactivated. Please contact support.",
      403,
    );
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    await user.incrementLoginAttempts();
    throw createError("Invalid email or password", 401);
  }

  // Reset login attempts on success
  await user.resetLoginAttempts();

  // Update last login
  await user.updateOne({
    lastLoginAt: new Date(),
    lastLoginIp: ip,
  });

  // Generate tokens
  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  // Store refresh token
  await user.addRefreshToken(refreshToken, getRefreshTokenExpiry(), {
    userAgent,
    ip,
  });

  logger.info("User logged in", { userId: user._id, email: user.email });

  return { user: user.toPublicProfile(), accessToken, refreshToken };
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken, ip, userAgent) {
  if (!refreshToken) {
    throw createError("Refresh token not provided", 401);
  }

  // Verify token signature
  const decoded = verifyRefreshToken(refreshToken);

  // Find user and check if token is stored
  const user = await User.findById(decoded.userId).select("+refreshTokens");

  if (!user) {
    throw createError("User not found", 401);
  }

  const storedToken = user.refreshTokens?.find((t) => t.token === refreshToken);

  if (!storedToken) {
    // Token not found — possible token theft
    logger.warn("Refresh token not found in database — possible reuse attack", {
      userId: user._id,
      ip,
    });
    // Invalidate ALL tokens (security measure)
    await user.removeAllRefreshTokens();
    throw createError("Invalid refresh token", 401);
  }

  // Check if stored token is expired
  if (new Date() > storedToken.expiresAt) {
    await user.removeRefreshToken(refreshToken);
    throw createError("Refresh token expired", 401);
  }

  // Rotate refresh token (token rotation for security)
  await user.removeRefreshToken(refreshToken);

  const newAccessToken = generateAccessToken(user._id, user.role);
  const newRefreshToken = generateRefreshToken(user._id);

  await user.addRefreshToken(newRefreshToken, getRefreshTokenExpiry(), {
    userAgent,
    ip,
  });

  return {
    user: user.toPublicProfile(),
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
}

/**
 * Logout user — invalidate refresh token
 */
export async function logoutUser(userId, refreshToken) {
  const user = await User.findById(userId).select("+refreshTokens");

  if (user && refreshToken) {
    await user.removeRefreshToken(refreshToken);
  }
}

/**
 * Logout from all devices
 */
export async function logoutAllDevices(userId) {
  const user = await User.findById(userId).select("+refreshTokens");
  if (user) {
    await user.removeAllRefreshTokens();
  }
}

/**
 * Initiate password reset — send email
 */
export async function initiatePasswordReset(email) {
  const user = await User.findByEmail(email);

  // Always return success (prevent email enumeration)
  if (!user) {
    logger.info("Password reset requested for non-existent email", { email });
    return true;
  }

  // Generate reset token
  const resetToken = generateSecureToken();
  const hashedToken = hashToken(resetToken);

  await user.updateOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
  });

  // Send email
  await sendPasswordResetEmail(user.email, user.name, resetToken);

  logger.info("Password reset initiated", { userId: user._id });

  return true;
}

/**
 * Complete password reset
 */
export async function resetPassword(token, newPassword) {
  const hashedToken = hashToken(token);

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  }).select("+passwordResetToken +passwordResetExpires +refreshTokens");

  if (!user) {
    throw createError("Password reset token is invalid or has expired", 400);
  }

  // Update password and clear reset fields
  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  // Invalidate all refresh tokens (security)
  await user.removeAllRefreshTokens();

  logger.info("Password reset completed", { userId: user._id });

  return true;
}

/**
 * Verify email address
 */
export async function verifyEmail(token) {
  const hashedToken = hashToken(token);

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: new Date() },
  }).select("+emailVerificationToken +emailVerificationExpires");

  if (!user) {
    throw createError(
      "Email verification token is invalid or has expired",
      400,
    );
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;

  await user.save();

  logger.info("Email verified", { userId: user._id });

  return user.toPublicProfile();
}

// ============================================================
// Google OAuth
// ============================================================

/**
 * Handle Google OAuth profile — find or create user
 */
export async function handleGoogleOAuth(googleProfile, ip, userAgent) {
  const { id: googleId, displayName, emails, photos } = googleProfile;

  const email = emails?.[0]?.value;
  const avatar = photos?.[0]?.value;
  const name = displayName;

  if (!email) {
    throw createError("Google account must have an email address", 400);
  }

  // Find existing user by Google ID or email
  let user = await User.findOne({
    $or: [{ googleId }, { email }],
  }).select("+refreshTokens");

  if (user) {
    // Update Google ID if linked via email
    if (!user.googleId) {
      user.googleId = googleId;
    }

    // Update avatar if not set
    if (!user.avatar && avatar) {
      user.avatar = avatar;
    }

    user.isEmailVerified = true;
    user.lastLoginAt = new Date();
    user.lastLoginIp = ip;

    await user.save();
  } else {
    // Create new user
    user = await User.create({
      name,
      email,
      googleId,
      avatar,
      isEmailVerified: true,
      lastLoginAt: new Date(),
      lastLoginIp: ip,
    });
  }

  // Generate tokens
  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  await user.addRefreshToken(refreshToken, getRefreshTokenExpiry(), {
    userAgent,
    ip,
  });

  logger.info("Google OAuth login", { userId: user._id, email: user.email });

  return { user: user.toPublicProfile(), accessToken, refreshToken };
}

// ============================================================
// OAuth Token Storage (YouTube, Instagram)
// ============================================================

/**
 * Store encrypted OAuth tokens for a platform
 */
export async function storePlatformTokens(userId, platform, tokenData) {
  const {
    accessToken,
    refreshToken,
    expiresIn,
    scope,
    platformUserId,
    platformUsername,
  } = tokenData;

  const encryptedAccessToken = encrypt(accessToken);
  const encryptedRefreshToken = refreshToken ? encrypt(refreshToken) : null;

  const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null;

  await OAuthToken.findOneAndUpdate(
    { userId, platform },
    {
      encryptedAccessToken,
      encryptedRefreshToken,
      expiresAt,
      scope: scope || "",
      platformUserId,
      platformUsername,
      isValid: true,
      lastRefreshedAt: new Date(),
    },
    { upsert: true, new: true },
  );

  logger.info("Platform OAuth tokens stored", { userId, platform });
}

/**
 * Retrieve decrypted platform access token
 */
export async function getPlatformToken(userId, platform) {
  const tokenDoc = await OAuthToken.findOne({ userId, platform });

  if (!tokenDoc) {
    throw createError(`No ${platform} account connected`, 404);
  }

  if (!tokenDoc.isValid) {
    throw createError(
      `${platform} connection is invalid. Please reconnect.`,
      401,
    );
  }

  const accessToken = decrypt(tokenDoc.encryptedAccessToken);
  const refreshToken = tokenDoc.encryptedRefreshToken
    ? decrypt(tokenDoc.encryptedRefreshToken)
    : null;

  return {
    accessToken,
    refreshToken,
    expiresAt: tokenDoc.expiresAt,
    scope: tokenDoc.scope,
    platformUserId: tokenDoc.platformUserId,
    platformUsername: tokenDoc.platformUsername,
    isExpired: tokenDoc.isExpired(),
    isExpiringSoon: tokenDoc.isExpiringSoon(),
  };
}

// ============================================================
// Email Service
// ============================================================

function createEmailTransporter() {
  if (!env.SMTP_HOST) {
    // Use ethereal for development if SMTP not configured
    logger.warn("SMTP not configured — emails will not be sent");
    return null;
  }

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: parseInt(env.SMTP_PORT) || 587,
    secure: parseInt(env.SMTP_PORT) === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
}

async function sendVerificationEmail(email, name, token) {
  const transporter = createEmailTransporter();
  if (!transporter) return;

  const verifyUrl = `${env.CLIENT_URL}/verify-email?token=${token}`;

  await transporter.sendMail({
    from: env.SMTP_FROM || '"TalishFlow" <noreply@talishflow.com>',
    to: email,
    subject: "Verify your TalishFlow account",
    html: generateEmailTemplate({
      title: "Verify Your Email",
      greeting: `Hi ${name},`,
      body: "Welcome to TalishFlow! Please verify your email address to get started.",
      buttonText: "Verify Email Address",
      buttonUrl: verifyUrl,
      footer: "This link expires in 24 hours.",
    }),
  });

  logger.info("Verification email sent", { email });
}

async function sendPasswordResetEmail(email, name, token) {
  const transporter = createEmailTransporter();
  if (!transporter) return;

  const resetUrl = `${env.CLIENT_URL}/reset-password/${token}`;

  await transporter.sendMail({
    from: env.SMTP_FROM || '"TalishFlow" <noreply@talishflow.com>',
    to: email,
    subject: "Reset your TalishFlow password",
    html: generateEmailTemplate({
      title: "Reset Your Password",
      greeting: `Hi ${name},`,
      body: "We received a request to reset your password. Click the button below to create a new password.",
      buttonText: "Reset Password",
      buttonUrl: resetUrl,
      footer:
        "This link expires in 1 hour. If you did not request this, please ignore this email.",
    }),
  });

  logger.info("Password reset email sent", { email });
}

function generateEmailTemplate({
  title,
  greeting,
  body,
  buttonText,
  buttonUrl,
  footer,
}) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="margin:0;padding:0;background:#F8FAFB;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFB;padding:40px 20px;">
        <tr>
          <td align="center">
            <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;border:1px solid #E5ECEF;overflow:hidden;">
              <!-- Header -->
              <tr>
                <td style="background:linear-gradient(135deg,#0F6E7C,#1E8FA0);padding:32px 40px;text-align:center;">
                  <h1 style="margin:0;color:#fff;font-size:24px;font-weight:800;letter-spacing:-0.5px;">TalishFlow</h1>
                  <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Turn Long Videos Into Viral Shorts Automatically</p>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding:40px;">
                  <h2 style="margin:0 0 8px;color:#17232D;font-size:22px;font-weight:700;">${title}</h2>
                  <p style="margin:0 0 16px;color:#68737D;font-size:16px;">${greeting}</p>
                  <p style="margin:0 0 32px;color:#17232D;font-size:16px;line-height:1.6;">${body}</p>
                  <a href="${buttonUrl}"
                    style="display:inline-block;background:#0F6E7C;color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:16px;font-weight:600;">
                    ${buttonText}
                  </a>
                  <p style="margin:32px 0 0;color:#68737D;font-size:13px;line-height:1.5;">${footer}</p>
                  <p style="margin:16px 0 0;color:#68737D;font-size:12px;">
                    Or copy this link: <a href="${buttonUrl}" style="color:#0F6E7C;word-break:break-all;">${buttonUrl}</a>
                  </p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="padding:24px 40px;border-top:1px solid #E5ECEF;text-align:center;">
                  <p style="margin:0;color:#68737D;font-size:12px;">
                    © ${new Date().getFullYear()} TalishFlow. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}
