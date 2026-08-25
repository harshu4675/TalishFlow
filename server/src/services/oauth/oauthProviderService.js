import axios from "axios";
import { env } from "../../config/env.js";
import { createOAuthState, consumeOAuthState } from "./oauthStateService.js";
import { createError } from "../../middleware/errorHandler.js";
import logger from "../../utils/logger.js";

/**
 * Centralized OAuth provider configuration & protocol layer.
 *
 * All OAuth URLs are built here from environment configuration
 * (GOOGLE_CALLBACK_URL / META_CALLBACK_URL). One callback URL per provider
 * handles both "login" and "connect account" flows; the mode travels
 * inside the signed `state` parameter.
 */

export const OAUTH_PROVIDERS = {
  google: "google",
  youtube: "youtube",
  instagram: "instagram",
};

// ── Endpoints ────────────────────────────────────────────────

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

const GRAPH_API_VERSION = "v21.0";
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;
const FACEBOOK_DIALOG_URL = `https://www.facebook.com/${GRAPH_API_VERSION}/dialog/oauth`;

const GOOGLE_LOGIN_SCOPES = ["openid", "email", "profile"];
const YOUTUBE_CONNECT_SCOPES = [
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube.readonly",
];

// Instagram Graph API (Facebook Login flow for Business/Creator accounts)
const INSTAGRAM_CONNECT_SCOPES = [
  "instagram_basic",
  "instagram_content_publish",
  "pages_show_list",
  "pages_read_engagement",
];

const OAUTH_HTTP_TIMEOUT = 15000;

// ── Shared helpers ───────────────────────────────────────────

export function buildFrontendRedirect(path, params = {}) {
  const url = new URL(path, env.CLIENT_URL);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) url.searchParams.set(key, value);
  }
  return url.toString();
}

function mapAxiosError(error, provider) {
  const status = error.response?.status;
  const providerError =
    error.response?.data?.error?.message ||
    error.response?.data?.error_description ||
    error.response?.data?.error ||
    error.message;

  logger.error(`${provider} OAuth API error`, {
    status,
    message: String(providerError).slice(0, 300),
  });

  if (status === 401 || status === 403) {
    return createError(
      `${provider} rejected the request. Please try connecting again.`,
      502,
      { code: "OAUTH_PROVIDER_ERROR" },
    );
  }

  if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
    return createError(
      `${provider} is not responding. Please try again in a moment.`,
      504,
      { code: "OAUTH_PROVIDER_TIMEOUT" },
    );
  }

  return createError(`Could not reach ${provider}. Please try again.`, 502, {
    code: "OAUTH_PROVIDER_UNREACHABLE",
  });
}

// ============================================================
// Google (login) + YouTube (connect)
// ============================================================

function requireGoogleConfigured() {
  if (!env.GOOGLE_OAUTH_CONFIGURED) {
    throw createError(
      "Google sign-in is not configured on this server.",
      503,
      { code: "OAUTH_NOT_CONFIGURED" },
    );
  }
}

/**
 * Build the Google authorization URL.
 * mode "login"  → identity scopes only
 * mode "connect"→ YouTube scopes, always re-consents so a refresh token
 *                 is issued.
 */
export async function buildGoogleAuthorizationUrl({ mode, userId = null }) {
  requireGoogleConfigured();

  if (mode === "connect" && !userId) {
    throw createError("userId is required to connect an account", 400);
  }

  const state = await createOAuthState({
    mode,
    platform: mode === "connect" ? OAUTH_PROVIDERS.youtube : null,
    userId,
  });

  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: env.GOOGLE_CALLBACK_URL,
    response_type: "code",
    scope: (mode === "connect" ? YOUTUBE_CONNECT_SCOPES : GOOGLE_LOGIN_SCOPES).join(" "),
    access_type: "offline",
    include_granted_scopes: "true",
    state,
  });

  // For connect we need a guaranteed refresh token → force consent.
  params.set("prompt", mode === "connect" ? "consent" : "select_account");

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange a Google authorization code for tokens.
 */
export async function exchangeGoogleCode(code) {
  requireGoogleConfigured();

  try {
    const response = await axios.post(
      GOOGLE_TOKEN_URL,
      new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: env.GOOGLE_CALLBACK_URL,
      }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: OAUTH_HTTP_TIMEOUT,
      },
    );

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token || null,
      expiresIn: response.data.expires_in || 3600,
      scope: response.data.scope || "",
      idToken: response.data.id_token || null,
    };
  } catch (error) {
    if (error.response?.data?.error === "invalid_grant") {
      throw createError(
        "The Google authorization code is invalid or expired. Please try again.",
        400,
        { code: "OAUTH_CODE_INVALID" },
      );
    }
    throw mapAxiosError(error, "Google");
  }
}

/**
 * Fetch the authenticated Google user's profile (login flow).
 */
export async function fetchGoogleUserProfile(accessToken) {
  try {
    const response = await axios.get(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
      timeout: OAUTH_HTTP_TIMEOUT,
    });

    if (!response.data?.sub || !response.data?.email) {
      throw createError(
        "Google did not return a usable profile (missing id/email).",
        502,
        { code: "OAUTH_PROFILE_INCOMPLETE" },
      );
    }

    return {
      id: response.data.sub,
      email: response.data.email,
      emailVerified: Boolean(response.data.email_verified),
      name: response.data.name || response.data.email.split("@")[0],
      picture: response.data.picture || null,
    };
  } catch (error) {
    if (error.statusCode) throw error;
    throw mapAxiosError(error, "Google");
  }
}

/**
 * Fetch the YouTube channel for a connected account (connect flow).
 */
export async function fetchYouTubeChannel(accessToken) {
  try {
    const response = await axios.get(
      "https://www.googleapis.com/youtube/v3/channels",
      {
        params: { part: "snippet", mine: "true", maxResults: 1 },
        headers: { Authorization: `Bearer ${accessToken}` },
        timeout: OAUTH_HTTP_TIMEOUT,
      },
    );

    const channel = response.data?.items?.[0] || null;

    return {
      channelId: channel?.id || null,
      title: channel?.snippet?.title || null,
      customUrl: channel?.snippet?.customUrl || null,
      thumbnail:
        channel?.snippet?.thumbnails?.medium?.url ||
        channel?.snippet?.thumbnails?.default?.url ||
        null,
    };
  } catch (error) {
    const reason = error.response?.data?.error?.errors?.[0]?.reason;

    if (reason === "insufficientPermissions" || error.response?.status === 403) {
      throw createError(
        "The Google account did not grant the required YouTube permissions. " +
          "Please reconnect and allow YouTube access.",
        400,
        { code: "YOUTUBE_PERMISSIONS_DENIED" },
      );
    }

    if (error.response?.status === 404) {
      return { channelId: null, title: null, customUrl: null, thumbnail: null };
    }

    // Channel lookup must not break the connection itself — tokens are valid.
    logger.warn("YouTube channel lookup failed", {
      message: error.response?.data?.error?.message || error.message,
    });
    return { channelId: null, title: null, customUrl: null, thumbnail: null };
  }
}

/**
 * Revoke a Google access/refresh token (used on disconnect — best effort).
 */
export async function revokeGoogleToken(token) {
  if (!token) return;
  try {
    await axios.post(
      `https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`,
      null,
      { timeout: OAUTH_HTTP_TIMEOUT },
    );
  } catch (error) {
    logger.warn("Google token revocation failed", { message: error.message });
  }
}

// ============================================================
// Meta / Instagram (connect)
// ============================================================

function requireMetaConfigured() {
  if (!env.META_OAUTH_CONFIGURED) {
    throw createError(
      "Instagram connection is not configured on this server.",
      503,
      { code: "OAUTH_NOT_CONFIGURED" },
    );
  }
}

/**
 * Build the Facebook OAuth dialog URL for Instagram (Graph API) connect.
 */
export async function buildMetaAuthorizationUrl({ userId }) {
  requireMetaConfigured();

  if (!userId) {
    throw createError("userId is required to connect an account", 400);
  }

  const state = await createOAuthState({
    mode: "connect",
    platform: OAUTH_PROVIDERS.instagram,
    userId,
  });

  const params = new URLSearchParams({
    client_id: env.META_APP_ID,
    redirect_uri: env.META_CALLBACK_URL,
    response_type: "code",
    scope: INSTAGRAM_CONNECT_SCOPES.join(","),
    state,
  });

  return `${FACEBOOK_DIALOG_URL}?${params.toString()}`;
}

/**
 * Exchange a Meta authorization code for a short-lived user token,
 * then immediately upgrade to a long-lived (~60 day) token.
 */
export async function exchangeMetaCode(code) {
  requireMetaConfigured();

  let shortLived;
  try {
    const response = await axios.get(`${GRAPH_API_BASE}/oauth/access_token`, {
      params: {
        client_id: env.META_APP_ID,
        client_secret: env.META_APP_SECRET,
        redirect_uri: env.META_CALLBACK_URL,
        code,
      },
      timeout: OAUTH_HTTP_TIMEOUT,
    });
    shortLived = response.data;
  } catch (error) {
    throw mapAxiosError(error, "Meta");
  }

  if (!shortLived?.access_token) {
    throw createError("Meta did not return an access token.", 502, {
      code: "OAUTH_TOKEN_EXCHANGE_FAILED",
    });
  }

  try {
    const response = await axios.get(`${GRAPH_API_BASE}/oauth/access_token`, {
      params: {
        grant_type: "fb_exchange_token",
        client_id: env.META_APP_ID,
        client_secret: env.META_APP_SECRET,
        fb_exchange_token: shortLived.access_token,
      },
      timeout: OAUTH_HTTP_TIMEOUT,
    });

    return {
      accessToken: response.data.access_token,
      expiresIn: response.data.expires_in || 60 * 24 * 60 * 60, // ~60 days
      tokenType: response.data.token_type || "bearer",
    };
  } catch (error) {
    logger.warn("Long-lived Meta token exchange failed, using short-lived", {
      message: error.response?.data?.error?.message || error.message,
    });
    return {
      accessToken: shortLived.access_token,
      expiresIn: shortLived.expires_in || 3600,
      tokenType: shortLived.token_type || "bearer",
    };
  }
}

/**
 * Discover the Instagram Professional account linked to any of the
 * user's Facebook Pages.
 *
 * Throws domain-specific errors so the UI can explain exactly what is
 * missing instead of dumping the user on a generic failure page.
 */
export async function fetchInstagramProfessionalAccount(accessToken) {
  let pages;
  try {
    const response = await axios.get(`${GRAPH_API_BASE}/me/accounts`, {
      params: {
        fields: "id,name,instagram_business_account{id,username}",
        access_token: accessToken,
      },
      timeout: OAUTH_HTTP_TIMEOUT,
    });
    pages = response.data?.data || [];
  } catch (error) {
    throw mapAxiosError(error, "Meta");
  }

  if (pages.length === 0) {
    throw createError(
      "No Facebook Page was found on this account. Instagram publishing " +
        "requires an Instagram Professional account connected to a Facebook Page.",
      400,
      { code: "INSTAGRAM_NO_FACEBOOK_PAGE" },
    );
  }

  const linked = pages.find((page) => page.instagram_business_account?.id);

  if (!linked) {
    throw createError(
      "None of your Facebook Pages have an Instagram Professional account " +
        "linked. Convert your Instagram account to Professional (Business or " +
        "Creator) and link it to a Facebook Page, then try again.",
      400,
      { code: "INSTAGRAM_NOT_PROFESSIONAL" },
    );
  }

  const igId = linked.instagram_business_account.id;

  let profile = {
    username: linked.instagram_business_account.username || null,
    name: null,
    profilePictureUrl: null,
    accountType: null,
  };

  try {
    const igResponse = await axios.get(`${GRAPH_API_BASE}/${igId}`, {
      params: {
        fields: "id,username,name,profile_picture_url,account_type,followers_count",
        access_token: accessToken,
      },
      timeout: OAUTH_HTTP_TIMEOUT,
    });

    profile = {
      username: igResponse.data.username || profile.username,
      name: igResponse.data.name || null,
      profilePictureUrl: igResponse.data.profile_picture_url || null,
      accountType: igResponse.data.account_type || null,
      followersCount: igResponse.data.followers_count ?? null,
    };
  } catch (error) {
    logger.warn("Instagram profile fetch failed", {
      message: error.response?.data?.error?.message || error.message,
    });
  }

  return {
    igUserId: igId,
    pageId: linked.id,
    pageName: linked.name,
    ...profile,
  };
}

/**
 * Revoke app permissions at Meta (best effort; keeps the account clean
 * on the user's Facebook settings when they disconnect).
 */
export async function revokeMetaPermissions(accessToken) {
  if (!accessToken) return;
  try {
    await axios.delete(`${GRAPH_API_BASE}/me/permissions`, {
      params: { access_token: accessToken },
      timeout: OAUTH_HTTP_TIMEOUT,
    });
  } catch (error) {
    logger.warn("Meta permission revocation failed", {
      message: error.response?.data?.error?.message || error.message,
    });
  }
}

export { consumeOAuthState };
