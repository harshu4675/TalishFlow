import { Server } from "socket.io";
import { env } from "../config/env.js";
import logger from "../utils/logger.js";
import jwt from "jsonwebtoken";

let io = null;

export function initWebSocketServer(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
  });

  // ── Authentication Middleware ────────────────────────────
  //
  // The access token lives in client memory (never localStorage / cookies),
  // so the client passes it in the socket.io handshake `auth` payload.
  // Previously the server only looked for an `access_token` COOKIE that was
  // never set — so no client ever joined its user room and realtime
  // progress events never arrived.

  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers.authorization?.replace(/^Bearer /, "") ||
        null;

      if (!token) {
        socket.userId = null;
        return next();
      }

      const decoded = jwt.verify(token, env.JWT_SECRET);
      socket.userId = decoded.userId;
      return next();
    } catch {
      // Expired/invalid token — connect as anonymous; the client will
      // refresh and reconnect automatically.
      socket.userId = null;
      return next();
    }
  });

  // ── Connection Handler ───────────────────────────────────

  io.on("connection", (socket) => {
    logger.debug("WebSocket: Client connected", {
      socketId: socket.id,
      userId: socket.userId,
    });

    // Join user-specific room for targeted events
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }

    socket.on("disconnect", (reason) => {
      logger.debug("WebSocket: Client disconnected", {
        socketId: socket.id,
        reason,
      });
    });

    // Ping/pong for connection health
    socket.on("ping", () => socket.emit("pong"));
  });

  logger.info("WebSocket: Server initialized");

  return io;
}

// ── Emitter Utilities ────────────────────────────────────

/**
 * Emit event to a specific user
 */
export function emitToUser(userId, event, data) {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
}

/**
 * Emit processing progress to user
 */
export function emitProcessingProgress(userId, jobId, progress) {
  emitToUser(userId, "processing:progress", { jobId, ...progress });
}

/**
 * Emit processing complete
 */
export function emitProcessingComplete(userId, jobId, result) {
  emitToUser(userId, "processing:complete", { jobId, result });
}

/**
 * Emit processing error
 */
export function emitProcessingError(userId, jobId, error) {
  emitToUser(userId, "processing:error", { jobId, error });
}

/**
 * Emit upload progress
 */
export function emitUploadProgress(userId, uploadId, progress) {
  emitToUser(userId, "upload:progress", { uploadId, progress });
}

export function getIO() {
  if (!io) throw new Error("WebSocket server not initialized");
  return io;
}
