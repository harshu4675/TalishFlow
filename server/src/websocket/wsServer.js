import { Server } from "socket.io";
import { env } from "../config/env.js";
import logger from "../utils/logger.js";
import jwt from "jsonwebtoken";
import cookie from "cookie";

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

  io.use((socket, next) => {
    try {
      // Token may arrive as handshake auth (preferred — the access token
      // lives in JS memory, not a cookie) or, for legacy clients, in the
      // access_token cookie.
      const handshakeToken =
        (typeof socket.handshake.auth?.token === "string" &&
          socket.handshake.auth.token.replace(/^Bearer\s+/i, "")) ||
        null;

      const cookieHeader = socket.handshake.headers.cookie;
      let cookieToken = null;
      if (cookieHeader) {
        const cookies = cookie.parse(cookieHeader);
        cookieToken = cookies.access_token || null;
      }

      const token = handshakeToken || cookieToken;

      if (token) {
        try {
          const decoded = jwt.verify(token, env.JWT_SECRET);
          socket.userId = decoded.userId;
          return next();
        } catch {
          logger.warn("WebSocket: rejected invalid handshake token");
        }
      }

      // Allow connection without auth (limited features)
      socket.userId = null;
      next();
    } catch (error) {
      socket.userId = null;
      next(); // Allow but mark as unauthenticated
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
export function emitProcessingError(userId, jobId, error, code = null) {
  emitToUser(userId, "processing:error", { jobId, error, code });
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
