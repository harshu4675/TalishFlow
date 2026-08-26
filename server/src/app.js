import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import mongoSanitize from "express-mongo-sanitize";
import path from "path";
import { fileURLToPath } from "url";

import { env } from "./config/env.js";
import { connectDatabase } from "./config/database.js";
import { connectRedis } from "./config/redis.js";
import logger from "./utils/logger.js";
import requestLogger from "./middleware/requestLogger.js";
import errorHandler, { notFoundHandler } from "./middleware/errorHandler.js";
import { generalLimiter } from "./middleware/rateLimit.js";
import routes from "./routes/index.js";
import mediaRoutes from "./routes/mediaRoutes.js";
import { initWebSocketServer } from "./websocket/wsServer.js";
import { startCleanupWorker } from "./workers/cleanupWorker.js";
import { initQueues } from "./queues/queueManager.js";
import { handleProcessVideo } from "./workers/processingWorker.js";
import { handlePublish } from "./workers/publishingWorker.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        mediaSrc: ["'self'", "blob:"],
        connectSrc: ["'self'", env.CLIENT_URL, "wss:"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }),
);

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-CSRF-Token",
      "X-Requested-With",
    ],
  }),
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(requestLogger);
app.use("/api/", generalLimiter);

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    app: "TalishFlow",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// Publicly reachable, signature-protected media endpoints (used by
// external services e.g. Meta fetching a clip for Instagram publishing).
// Mounted before the authenticated API on purpose.
app.use("/api/v1/media", mediaRoutes);

app.use("/api/v1", routes);

if (env.NODE_ENV === "production") {
  const clientBuildPath = path.join(__dirname, "../../client/dist");

  app.use(
    express.static(clientBuildPath, {
      maxAge: "1y",
      etag: true,
      lastModified: true,
    }),
  );

  app.get("*", (req, res) => {
    if (!req.path.startsWith("/api")) {
      res.sendFile(path.join(clientBuildPath, "index.html"));
    }
  });
}

app.use(notFoundHandler);
app.use(errorHandler);

export async function startApp() {
  try {
    await connectDatabase();

    const redis = await connectRedis();
    app.set("redis", redis);

    await initQueues({
      onProcessVideo: handleProcessVideo,
      onPublish: handlePublish,
    });

    const server = app.listen(env.PORT, () => {
      logger.info(
        `TalishFlow Server started — port ${env.PORT} — ${env.NODE_ENV} mode`,
      );
    });

    initWebSocketServer(server);

    startCleanupWorker();

    const shutdown = async (signal) => {
      logger.info(`${signal} received — shutting down gracefully`);

      server.close(() => {
        logger.info("HTTP server closed");
        process.exit(0);
      });

      setTimeout(() => {
        logger.error("Forced shutdown after timeout");
        process.exit(1);
      }, 30000);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));

    process.on("unhandledRejection", (reason) => {
      logger.error("Unhandled Promise Rejection", { reason: String(reason) });
    });

    process.on("uncaughtException", (error) => {
      logger.error("Uncaught Exception", {
        error: error.message,
        stack: error.stack,
      });
      process.exit(1);
    });

    return server;
  } catch (error) {
    logger.error("Failed to start application", { error: error.message });
    process.exit(1);
  }
}

export default app;
