import { asyncHandler, createError } from "../middleware/errorHandler.js";
import {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  logoutAllDevices,
  initiatePasswordReset,
  resetPassword,
  verifyEmail,
  REFRESH_COOKIE_NAME,
  getRefreshCookieOptions,
  getClearCookieOptions,
} from "../services/authService.js";
import User from "../models/User.js";

// ============================================================
// Register
// ============================================================

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const { user, accessToken, refreshToken } = await registerUser({
    name,
    email,
    password,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });

  // Set refresh token as httpOnly cookie
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshCookieOptions());

  res.status(201).json({
    success: true,
    message: "Account created successfully. Please verify your email.",
    user,
    accessToken,
  });
});

// ============================================================
// Login
// ============================================================

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const { user, accessToken, refreshToken } = await loginUser({
    email,
    password,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshCookieOptions());

  res.json({
    success: true,
    message: "Logged in successfully",
    user,
    accessToken,
  });
});

// ============================================================
// Refresh Token
// ============================================================

export const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies[REFRESH_COOKIE_NAME];

  if (!refreshToken) {
    throw createError("Refresh token not provided", 401);
  }

  const {
    user,
    accessToken,
    refreshToken: newRefreshToken,
  } = await refreshAccessToken(refreshToken, req.ip, req.get("User-Agent"));

  // Rotate refresh token cookie
  res.cookie(REFRESH_COOKIE_NAME, newRefreshToken, getRefreshCookieOptions());

  res.json({
    success: true,
    user,
    accessToken,
  });
});

// ============================================================
// Get Current User
// ============================================================

export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).lean();

  if (!user) {
    throw createError("User not found", 404);
  }

  const userModel = new User(user);

  res.json({
    success: true,
    user: userModel.toPublicProfile(),
  });
});

// ============================================================
// Logout
// ============================================================

export const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies[REFRESH_COOKIE_NAME];

  await logoutUser(req.user.id, refreshToken);

  res.clearCookie(REFRESH_COOKIE_NAME, getClearCookieOptions());

  res.json({
    success: true,
    message: "Logged out successfully",
  });
});

// ============================================================
// Logout All Devices
// ============================================================

export const logoutAll = asyncHandler(async (req, res) => {
  await logoutAllDevices(req.user.id);

  res.clearCookie(REFRESH_COOKIE_NAME, getClearCookieOptions());

  res.json({
    success: true,
    message: "Logged out from all devices",
  });
});

// ============================================================
// Forgot Password
// ============================================================

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  await initiatePasswordReset(email);

  // Always return success (prevents email enumeration)
  res.json({
    success: true,
    message:
      "If an account exists with that email, you will receive a password reset link shortly.",
  });
});

// ============================================================
// Reset Password
// ============================================================

export const resetPasswordHandler = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  await resetPassword(token, password);

  res.json({
    success: true,
    message:
      "Password reset successfully. Please log in with your new password.",
  });
});

// ============================================================
// Verify Email
// ============================================================

export const verifyEmailHandler = asyncHandler(async (req, res) => {
  const { token } = req.query;

  if (!token) {
    throw createError("Verification token is required", 400);
  }

  const user = await verifyEmail(token);

  res.json({
    success: true,
    message: "Email verified successfully",
    user,
  });
});

// ============================================================
// Change Password (authenticated)
// ============================================================

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.id).select(
    "+password +refreshTokens",
  );

  if (!user) {
    throw createError("User not found", 404);
  }

  const isValid = await user.comparePassword(currentPassword);

  if (!isValid) {
    throw createError("Current password is incorrect", 400);
  }

  user.password = newPassword;
  await user.save();

  // Invalidate all refresh tokens (security)
  await user.removeAllRefreshTokens();

  res.clearCookie(REFRESH_COOKIE_NAME, getClearCookieOptions());

  res.json({
    success: true,
    message: "Password changed successfully. Please log in again.",
  });
});
