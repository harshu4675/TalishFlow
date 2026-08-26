import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import {
  authLimiter,
  oauthLimiter,
  passwordResetLimiter,
} from "../middleware/rateLimit.js";
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
  changePassword,
} from "../controllers/authController.js";
import {
  googleLogin,
  googleCallbackHandler,
  initiatePlatformConnect,
  instagramCallbackHandler,
} from "../controllers/oauthController.js";

const router = Router();

// ── Credentials ──────────────────────────────────────────────

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

// ── OAuth — Google (login) ──────────────────────────────────
//
// GET /auth/google               → redirect the user to Google (login)
// GET /auth/google/callback      → handles login AND YouTube-connect
//                                  (mode is inside signed state)

router.get("/google", oauthLimiter, googleLogin);
router.get("/google/callback", oauthLimiter, googleCallbackHandler);

// ── OAuth — platform connect (authenticated) ────────────────
//
// POST /auth/oauth/:provider/initiate  → { url } for window redirect
// GET  /auth/instagram/callback        → Meta redirects here

router.post(
  "/oauth/:platform/initiate",
  oauthLimiter,
  authenticate,
  initiatePlatformConnect,
);

router.get("/instagram/callback", oauthLimiter, instagramCallbackHandler);

// ── Session ─────────────────────────────────────────────────

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
