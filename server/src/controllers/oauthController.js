import { asyncHandler, createError } from "../middleware/errorHandler.js";
import {
  buildGoogleAuthorizationUrl,
  exchangeGoogleCode,
  fetchGoogleUserProfile,
  fetchYouTubeChannel,
  buildMetaAuthorizationUrl,
  exchangeMetaCode,
  fetchInstagramProfessionalAccount,
  consumeOAuthState,
  buildFrontendRedirect,
} from "../services/oauth/oauthProviderService.js";
import {
  handleGoogleOAuth,
  storePlatformTokens,
  REFRESH_COOKIE_NAME,
  getRefreshCookieOptions,
} from "../services/authService.js";
import { env } from "../config/env.js";
import logger from "../utils/logger.js";

// ============================================================
// Google — login initiation (unchanged entry point for the UI)
// ============================================================

export const googleLogin = asyncHandler(async (req, res) => {
  const url = await buildGoogleAuthorizationUrl({ mode: "login" });
  res.redirect(url);
});

// ============================================================
// Google — callback (handles BOTH login and YouTube-connect)
// ============================================================

export const googleCallbackHandler = asyncHandler(async (req, res) => {
  const { code, state, error, error_description: errorDescription } = req.query;

  // Provider reported an error (e.g. user pressed "Cancel").
  if (error) {
    const cancelled = error === "access_denied";
    logger.info("Google OAuth cancelled/denied", { error });

    return res.redirect(
      buildFrontendRedirect("/auth/callback", {
        error: cancelled ? "oauth_cancelled" : "oauth_denied",
        details: cancelled
          ? "You cancelled the Google authorization."
          : errorDescription || "Google denied the authorization request.",
      }),
    );
  }

  if (!code || !state) {
    return res.redirect(
      buildFrontendRedirect("/auth/callback", {
        error: "oauth_missing_code",
        details: "The authorization response was incomplete.",
      }),
    );
  }

  let statePayload;
  try {
    statePayload = await consumeOAuthState(state);
  } catch (stateError) {
    logger.warn("OAuth state validation failed", { code: stateError.code });
    return res.redirect(
      buildFrontendRedirect("/auth/callback", {
        error: "oauth_invalid_state",
        details:
          "The authorization session expired or was invalid. Please start again.",
      }),
    );
  }

  try {
    if (statePayload.mode === "login") {
      return await completeGoogleLogin(req, res, code);
    }

    if (statePayload.mode === "connect" && statePayload.platform === "youtube") {
      return await completeYouTubeConnect(req, res, code, statePayload.userId);
    }

    throw createError("Unknown OAuth flow", 400);
  } catch (flowError) {
    const destination =
      statePayload.mode === "connect" ? "/settings/accounts" : "/auth/callback";

    logger.error("OAuth flow failed", {
      mode: statePayload.mode,
      error: flowError.message,
    });

    return res.redirect(
      buildFrontendRedirect(destination, {
        error: flowError.code || "oauth_failed",
        details: flowError.statusCode
          ? flowError.message
          : "The connection could not be completed.",
      }),
    );
  }
});

async function completeGoogleLogin(req, res, code) {
  const tokens = await exchangeGoogleCode(code);
  const profile = await fetchGoogleUserProfile(tokens.accessToken);

  const { accessToken, refreshToken } = await handleGoogleOAuth(
    { ...profile, scope: tokens.scope },
    req.ip,
    req.get("User-Agent"),
  );

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshCookieOptions());

  logger.info("auth.login", { provider: "google" });

  const isSecureCallback =
    env.PUBLIC_API_URL.startsWith("https://") || env.CLIENT_URL.startsWith("https://");

  // The access token is single-purpose: the client exchanges/validates it
  // once on the callback page and holds it in memory only.
  return res.redirect(
    buildFrontendRedirect("/auth/callback", {
      token: accessToken,
      status: "success",
      ts: isSecureCallback ? undefined : Date.now(),
    }),
  );
}

async function completeYouTubeConnect(req, res, code, userId) {
  const tokens = await exchangeGoogleCode(code);
  const channel = await fetchYouTubeChannel(tokens.accessToken);

  await storePlatformTokens(userId, "youtube", {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresIn: tokens.expiresIn,
    scope: tokens.scope,
    platformUserId: channel.channelId || userId,
    platformUsername: channel.customUrl || channel.title || null,
    platformData: {
      channelId: channel.channelId,
      title: channel.title,
      customUrl: channel.customUrl,
      avatar: channel.thumbnail,
      hasChannel: Boolean(channel.channelId),
      grantedScopes: tokens.scope,
    },
  });

  logger.info("oauth.connected", { platform: "youtube", userId });

  return res.redirect(
    buildFrontendRedirect("/settings/accounts", { connected: "youtube" }),
  );
}

// ============================================================
// Platform connect — initiation (authenticated)
// ============================================================

export const initiatePlatformConnect = asyncHandler(async (req, res) => {
  const { platform } = req.params;

  if (platform === "youtube") {
    if (!env.GOOGLE_OAUTH_CONFIGURED) {
      throw createError(
        "YouTube connection is not configured on this server.",
        503,
        { code: "OAUTH_NOT_CONFIGURED" },
      );
    }

    const url = await buildGoogleAuthorizationUrl({
      mode: "connect",
      userId: req.user.id,
    });

    logger.info("oauth.initiated", { platform: "youtube", userId: req.user.id });

    return res.json({ success: true, data: { url } });
  }

  if (platform === "instagram") {
    if (!env.META_OAUTH_CONFIGURED) {
      throw createError(
        "Instagram connection is not configured on this server. Contact the site administrator.",
        503,
        { code: "OAUTH_NOT_CONFIGURED" },
      );
    }

    const url = await buildMetaAuthorizationUrl({ userId: req.user.id });

    logger.info("oauth.initiated", { platform: "instagram", userId: req.user.id });

    return res.json({ success: true, data: { url } });
  }

  throw createError(`Unsupported platform: ${platform}`, 400, {
    code: "PLATFORM_UNSUPPORTED",
  });
});

// ============================================================
// Meta / Instagram — callback
// ============================================================

export const instagramCallbackHandler = asyncHandler(async (req, res) => {
  const {
    code,
    state,
    error,
    error_reason: errorReason,
    error_description: errorDescription,
  } = req.query;

  if (error) {
    const cancelled = error === "access_denied";
    logger.info("Instagram OAuth cancelled/denied", { error, errorReason });

    return res.redirect(
      buildFrontendRedirect("/settings/accounts", {
        error: cancelled ? "instagram_cancelled" : "instagram_denied",
        details:
          errorDescription ||
          (cancelled
            ? "You cancelled the authorization."
            : "Meta denied the authorization request."),
      }),
    );
  }

  if (!code || !state) {
    return res.redirect(
      buildFrontendRedirect("/settings/accounts", {
        error: "instagram_missing_code",
        details: "The authorization response from Meta was incomplete.",
      }),
    );
  }

  let statePayload;
  try {
    statePayload = await consumeOAuthState(state);
  } catch (stateError) {
    logger.warn("Instagram state validation failed", { code: stateError.code });
    return res.redirect(
      buildFrontendRedirect("/settings/accounts", {
        error: "instagram_invalid_state",
        details:
          "The authorization session expired or was invalid. Please try connecting again.",
      }),
    );
  }

  if (statePayload.platform !== "instagram" || !statePayload.userId) {
    return res.redirect(
      buildFrontendRedirect("/settings/accounts", {
        error: "instagram_invalid_state",
        details: "The authorization session was invalid. Please try again.",
      }),
    );
  }

  try {
    const tokens = await exchangeMetaCode(code);
    const account = await fetchInstagramProfessionalAccount(tokens.accessToken);

    await storePlatformTokens(statePayload.userId, "instagram", {
      accessToken: tokens.accessToken,
      refreshToken: null, // Meta uses long-lived tokens refreshed via Graph API
      expiresIn: tokens.expiresIn,
      scope: "instagram_basic instagram_content_publish pages_show_list pages_read_engagement",
      platformUserId: account.igUserId,
      platformUsername: account.username,
      platformData: {
        igUserId: account.igUserId,
        username: account.username,
        name: account.name,
        avatar: account.profilePictureUrl,
        accountType: account.accountType,
        followersCount: account.followersCount,
        facebookPageId: account.pageId,
        facebookPageName: account.pageName,
      },
    });

    logger.info("oauth.connected", {
      platform: "instagram",
      userId: statePayload.userId,
    });

    return res.redirect(
      buildFrontendRedirect("/settings/accounts", { connected: "instagram" }),
    );
  } catch (flowError) {
    logger.error("Instagram connect failed", {
      code: flowError.code,
      error: flowError.message,
      userId: statePayload.userId,
    });

    return res.redirect(
      buildFrontendRedirect("/settings/accounts", {
        error: flowError.code || "instagram_failed",
        details: flowError.statusCode
          ? flowError.message
          : "The Instagram connection could not be completed.",
      }),
    );
  }
});
