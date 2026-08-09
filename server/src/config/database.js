import mongoose from "mongoose";
import { env } from "./env.js";
import logger from "../utils/logger.js";

let isConnected = false;

export async function connectDatabase() {
  if (isConnected) {
    logger.info("Database: Using existing connection");
    return;
  }

  try {
    logger.info("Database: Connecting to MongoDB...");

    const connection = await mongoose.connect(env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    });

    isConnected = true;

    logger.info(
      `Database: Connected to MongoDB — ${connection.connection.host}`,
    );

    mongoose.connection.on("error", (error) => {
      logger.error("Database: Connection error", { error: error.message });
      isConnected = false;
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("Database: Disconnected");
      isConnected = false;
    });

    mongoose.connection.on("reconnected", () => {
      logger.info("Database: Reconnected");
      isConnected = true;
    });

    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      logger.info("Database: Connection closed due to application termination");
      process.exit(0);
    });
  } catch (error) {
    logger.error("Database: Failed to connect", {
      error: error.message,
      code: error.code,
    });
    console.error("Full MongoDB connection error:", error);
    process.exit(1);
  }
}

export async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    isConnected = false;
    logger.info("Database: Disconnected");
  }
}

export default connectDatabase;
