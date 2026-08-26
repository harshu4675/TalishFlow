import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

// ============================================================
// Helpers
// ============================================================

/**
 * Treats empty strings and common `.env.example` placeholders as "unset"
 * so optional integrations can be detected as not-configured.
 */
function optionalSecret(value) {
  if (value == null) return undefined;
  const trimmed = String(value).trim();
  if (!trimmed) return undefined;
  if (/^(your_|changeme|placeholder|xxx|<)/i.test(trimmed)) return undefined;
  return trimmed;
}

// ============================================================
// Environment Variable Schema (strict validation at startup)
// ============================================================

const envSchema = z.object({
  // App
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.string().default("5000"),
  CLIENT_URL: z.string().url(),

  /**
   * Publicly reachable base URL of THIS API server (no trailing slash).
   * Required for Instagram publishing (Meta fetches media via a public URL).
   * Defaults to http://localhost:PORT in development.
   */
  PUBLIC_API_URL: z.preprocess(
    optionalSecret,
    z.string().url().optional(),
  ),

  // Database
  MONGODB_URI: z.string().min(1),

  // Redis
  REDIS_URL: z.string().default("redis://localhost:6379"),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES: z.string().default("15m"),
  JWT_REFRESH_EXPIRES: z.string().default("7d"),

  // Encryption (AES-256 for platform tokens + HMAC for signed URLs/state)
  ENCRYPTION_KEY: z.string().min(32),

  // Google OAuth
  // GOOGLE_CALLBACK_URL receives both login and platform-connect callbacks —
  // the OAuth "mode" is carried inside the signed state parameter, so only
  // one redirect URI has to be registered in Google Cloud Console.
  GOOGLE_CLIENT_ID: z.preprocess(optionalSecret, z.string().optional()),
  GOOGLE_CLIENT_SECRET: z.preprocess(optionalSecret, z.string().optional()),
  GOOGLE_CALLBACK_URL: z.preprocess(optionalSecret, z.string().url().optional()),

  // YouTube Data API key (optional — used for import metadata enrichment)
  YOUTUBE_API_KEY: z.preprocess(optionalSecret, z.string().optional()),

  // Meta / Instagram
  META_APP_ID: z.preprocess(optionalSecret, z.string().optional()),
  META_APP_SECRET: z.preprocess(optionalSecret, z.string().optional()),
  META_CALLBACK_URL: z.preprocess(optionalSecret, z.string().url().optional()),

  // OpenAI (optional — Whisper API transcription + AI copy generation)
  OPENAI_API_KEY: z.preprocess(optionalSecret, z.string().optional()),

  // Email (for password reset)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),

  // Storage
  UPLOAD_DIR: z.string().default("./uploads"),
  MAX_FILE_SIZE: z.string().default("5368709120"), // 5GB

  // Processing
  FFMPEG_PATH: z.string().optional(),
  FFPROBE_PATH: z.string().optional(),
  WHISPER_MODEL: z
    .enum(["tiny", "base", "small", "medium", "large"])
    .default("base"),
  PYTHON_PATH: z.string().default("python3"),

  // Cleanup
  ASSET_TTL_HOURS: z.string().default("24"),
});

// ============================================================
// Parse & Validate
// ============================================================

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("\n❌ Invalid environment variables:\n");
  parsed.error.issues.forEach((issue) => {
    console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
  });
  console.error("\nPlease check your .env file.\n");
  process.exit(1);
}

const data = parsed.data;

// ============================================================
// Derived configuration
// ============================================================

const publicApiUrl = (
  data.PUBLIC_API_URL || `http://localhost:${data.PORT}`
).replace(/\/+$/, "");

export const env = {
  ...data,
  PUBLIC_API_URL: publicApiUrl,

  /** True when Google OAuth is fully configured (client id + secret + callback). */
  get GOOGLE_OAUTH_CONFIGURED() {
    return Boolean(
      data.GOOGLE_CLIENT_ID && data.GOOGLE_CLIENT_SECRET && data.GOOGLE_CALLBACK_URL,
    );
  },

  /** True when Meta/Instagram OAuth is fully configured. */
  get META_OAUTH_CONFIGURED() {
    return Boolean(data.META_APP_ID && data.META_APP_SECRET && data.META_CALLBACK_URL);
  },
};

export default env;
