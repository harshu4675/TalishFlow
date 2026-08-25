import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/authenticate.js";
import { asyncHandler, createError } from "../middleware/errorHandler.js";
import { validate } from "../middleware/validate.js";
import User from "../models/User.js";
import OAuthToken from "../models/OAuthToken.js";
import { env } from "../config/env.js";
import { decrypt } from "../utils/crypto.js";
import logger from "../utils/logger.js";

const router = Router();

router.use(authenticate);

// ── Profile ──────────────────────────────────────────────────

router.get(
  "/profile",
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id).lean();
    if (!user) throw createError("User not found", 404);

    res.json({
      success: true,
      data: { user: new User(user).toPublicProfile() },
    });
  }),
);

const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  avatar: z.string().url().max(500).optional(),
});

router.patch(
  "/profile",
  validate(updateProfileSchema),
  asyncHandler(async (req, res) => {
    const { name, avatar } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { ...(name && { name }), ...(avatar && { avatar }) },
      { new: true, runValidators: true },
    );

    if (!user) throw createError("User not found", 404);

    res.json({ success: true, data: { user: user.toPublicProfile() } });
  }),
);

// ── Connection DTO ───────────────────────────────────────────
//
// NEVER expose token material (encrypted tokens included), scopes only.
function toAccountDTO(tokenDoc) {
  if (!tokenDoc) return null;

  const data = tokenDoc.platformData || {};
  const isExpired = tokenDoc.expiresAt
    ? Date.now() >= new Date(tokenDoc.expiresAt).getTime()
    : false;

  return {
    platform: tokenDoc.platform,
    status: !tokenDoc.isValid ? "invalid" : isExpired ? "expired" : "connected",
    username: tokenDoc.platformUsername || data.username || null,
    displayName: data.title || data.name || null,
    avatar: data.avatar || data.profilePictureUrl || null,
    accountType: data.accountType || null,
    profileUrl:
      tokenDoc.platform === "youtube" && data.channelId
        ? `https://www.youtube.com/channel/${data.channelId}`
        : tokenDoc.platform === "instagram" && tokenDoc.platformUsername
          ? `https://www.instagram.com/${tokenDoc.platformUsername}`
          : null,
    scope: tokenDoc.scope || "",
    connectedAt: tokenDoc.connectedAt || null,
    expiresAt: tokenDoc.expiresAt || null,
    lastRefreshedAt: tokenDoc.lastRefreshedAt || null,
  };
}

router.get(
  "/connected-accounts",
  asyncHandler(async (req, res) => {
    const tokens = await OAuthToken.find({ userId: req.user.id }).lean();

    res.json({
      success: true,
      data: {
        accounts: {
          youtube: toAccountDTO(tokens.find((t) => t.platform === "youtube")),
          instagram: toAccountDTO(
            tokens.find((t) => t.platform === "instagram"),
          ),
        },
      },
    });
  }),
);

/**
 * Disconnect a platform:
 *   1. Revoke the grant at the provider (best effort — Google/Meta).
 *   2. Delete stored token material.
 * The client invalidates its query cache afterwards so the UI never
 * shows a "connected" state that the backend no longer believes.
 */
router.delete(
  "/connected-accounts/:platform",
  asyncHandler(async (req, res) => {
    const { platform } = req.params;

    if (!["youtube", "instagram"].includes(platform)) {
      throw createError("Invalid platform", 400, {
        code: "PLATFORM_UNSUPPORTED",
      });
    }

    const tokenDoc = await OAuthToken.findOne({
      userId: req.user.id,
      platform,
    });

    if (!tokenDoc) {
      // Already disconnected — keep the call idempotent.
      return res.json({ success: true, message: "Account already disconnected" });
    }

    const accessToken = tokenDoc.encryptedAccessToken
      ? decrypt(tokenDoc.encryptedAccessToken)
      : null;

    // Best-effort provider-side revocation.
    try {
      if (platform === "youtube" && accessToken) {
        const { revokeGoogleToken } = await import(
          "../services/oauth/oauthProviderService.js"
        );
        await revokeGoogleToken(accessToken);
      } else if (platform === "instagram" && accessToken) {
        const { revokeMetaPermissions } = await import(
          "../services/oauth/oauthProviderService.js"
        );
        await revokeMetaPermissions(accessToken);
      }
    } catch (error) {
      logger.warn("Provider revocation failed during disconnect", {
        platform,
        error: error.message,
      });
    }

    await OAuthToken.deleteOne({ _id: tokenDoc._id });

    logger.info("oauth.disconnected", { userId: req.user.id, platform });

    res.json({ success: true, message: `${platform} account disconnected` });
  }),
);

/**
 * Integration availability — tells the client which providers are
 * configured server-side so it can render honest UI instead of buttons
 * that can only fail.
 */
router.get(
  "/integrations",
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      data: {
        youtube: {
          configured: env.GOOGLE_OAUTH_CONFIGURED,
        },
        instagram: {
          configured: env.META_OAUTH_CONFIGURED,
        },
        publicApiUrl: env.PUBLIC_API_URL,
        publicApiIsHttps: env.PUBLIC_API_URL.startsWith("https://"),
      },
    });
  }),
);

export default router;
