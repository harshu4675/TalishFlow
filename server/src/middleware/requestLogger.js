import morgan from "morgan";
import logger from "../utils/logger.js";

// Custom token
morgan.token("user-id", (req) => req.user?.id || "anonymous");

// Log format
const format =
  ":method :url :status :response-time ms - :res[content-length] [:user-id]";

export default morgan(format, {
  stream: logger.stream,
  skip: (req) => {
    // Skip health check logs
    return req.url === "/health" || req.url === "/api/v1/health";
  },
});
