import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

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

  // Database
  MONGODB_URI: z.string().min(1),

  // Redis
  REDIS_URL: z.string().default("redis://localhost:6379"),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES: z.string().default("15m"),
  JWT_REFRESH_EXPIRES: z.string().default("7d"),

  // Encryption
  ENCRYPTION_KEY: z.string().min(32),

  // CSRF
  CSRF_SECRET: z.string().min(32),

  // Session
  SESSION_SECRET: z.string().min(32),

  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GOOGLE_CALLBACK_URL: z.string().url(),

  // YouTube API (same credentials as Google OAuth with YouTube scope)
  YOUTUBE_API_KEY: z.string().optional(),

  // Meta / Instagram
  META_APP_ID: z.string().min(1),
  META_APP_SECRET: z.string().min(1),
  META_CALLBACK_URL: z.string().url(),

  // OpenAI (Whisper API — optional, can use local Whisper)
  OPENAI_API_KEY: z.string().optional(),

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
  // Optional: explicit path to a yt-dlp binary (used for YouTube imports)
  YT_DLP_PATH: z.string().optional(),
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

export const env = parsed.data;

export default env;
