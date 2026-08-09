import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { env } from "./env.js";
import logger from "../utils/logger.js";
import { Strategy as FacebookStrategy } from "passport-facebook";
export function configurePassport() {
  // ── Google OAuth Strategy ────────────────────────────────
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: env.GOOGLE_CALLBACK_URL,
        scope: [
          "profile",
          "email",
          "https://www.googleapis.com/auth/youtube.upload",
          "https://www.googleapis.com/auth/youtube.readonly",
          "https://www.googleapis.com/auth/youtube.force-ssl",
        ],
        accessType: "offline",
        prompt: "consent",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Pass the full profile and tokens to the callback
          done(null, {
            profile,
            accessToken,
            refreshToken,
          });
        } catch (error) {
          logger.error("Google OAuth strategy error", { error: error.message });
          done(error, null);
        }
      },
    ),
  );

  logger.info("Passport: Google OAuth strategy configured");
}
passport.use(
  "instagram",
  new FacebookStrategy(
    {
      clientID: env.META_APP_ID,
      clientSecret: env.META_APP_SECRET,
      callbackURL: env.META_CALLBACK_URL,
      scope: [
        "instagram_basic",
        "instagram_content_publish",
        "pages_show_list",
        "pages_read_engagement",
      ],
      profileFields: ["id", "displayName", "emails", "photos"],
    },
    async (accessToken, refreshToken, profile, done) => {
      done(null, { profile, accessToken, refreshToken });
    },
  ),
);

export default configurePassport;
