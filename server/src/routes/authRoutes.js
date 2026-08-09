import { Router } from "express";
import passport from "passport";
import { env } from "../config/env.js";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { authLimiter, passwordResetLimiter } from "../middleware/rateLimit.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from "../validators/authValidators.js";
import {
  register,
  login,
  refresh,
  getMe,
  logout,
  logoutAll,
  forgotPassword,
  resetPasswordHandler,
  verifyEmailHandler,
  googleCallback,
  changePassword,
} from "../controllers/authController.js";
import { storePlatformTokens } from "../services/authService.js";

const router = Router();

router.post("/register", authLimiter, validate(registerSchema), register);

router.post("/login", authLimiter, validate(loginSchema), login);

router.post("/refresh", refresh);

router.get("/verify-email", verifyEmailHandler);

router.post(
  "/forgot-password",
  passwordResetLimiter,
  validate(forgotPasswordSchema),
  forgotPassword,
);

router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  resetPasswordHandler,
);

router.get(
  "/google",
  passport.authenticate("google", {
    scope: [
      "profile",
      "email",
      "https://www.googleapis.com/auth/youtube.upload",
      "https://www.googleapis.com/auth/youtube.readonly",
      "https://www.googleapis.com/auth/youtube.force-ssl",
    ],
    accessType: "offline",
    prompt: "consent",
    session: false,
  }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${env.CLIENT_URL}/login?error=oauth_failed`,
  }),
  (req, res, next) => {
    req.googleAuth = req.user;
    next();
  },
  googleCallback,
);

router.get(
  "/instagram",
  passport.authenticate("instagram", {
    scope: [
      "instagram_basic",
      "instagram_content_publish",
      "pages_show_list",
      "pages_read_engagement",
    ],
    session: false,
  }),
);

router.get(
  "/instagram/callback",
  passport.authenticate("instagram", {
    session: false,
    failureRedirect: `${env.CLIENT_URL}/settings/accounts?error=instagram_failed`,
  }),
  asyncHandler(async (req, res) => {
    const { profile, accessToken } = req.user;

    await storePlatformTokens(req.user.id || profile.id, "instagram", {
      accessToken,
      platformUserId: profile.id,
      platformUsername: profile.displayName,
    });

    res.redirect(`${env.CLIENT_URL}/settings/accounts?connected=instagram`);
  }),
);

router.get("/me", authenticate, getMe);

router.post("/logout", authenticate, logout);

router.post("/logout-all", authenticate, logoutAll);

router.post(
  "/change-password",
  authenticate,
  validate(changePasswordSchema),
  changePassword,
);

export default router;
