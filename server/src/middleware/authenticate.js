import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import User from "../models/User.js";
import { createError } from "./errorHandler.js";

export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return next(createError("Authentication required", 401));
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return next(createError("Authentication required", 401));
    }

    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return next(createError("Access token expired", 401));
      }
      return next(createError("Invalid access token", 401));
    }

    const user = await User.findById(decoded.userId).lean();

    if (!user) {
      return next(createError("User not found", 401));
    }

    if (!user.isActive) {
      return next(createError("Account has been deactivated", 403));
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
    };

    next();
  } catch (error) {
    next(error);
  }
}

export async function optionalAuthenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];

      if (token) {
        try {
          const decoded = jwt.verify(token, env.JWT_SECRET);
          const user = await User.findById(decoded.userId).lean();

          if (user?.isActive) {
            req.user = {
              id: user._id.toString(),
              email: user.email,
              name: user.name,
              role: user.role,
            };
          }
        } catch {
          // Silently continue without auth
        }
      }
    }
  } catch {
    // Silently continue without auth
  }

  next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(createError("Authentication required", 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(createError("Insufficient permissions", 403));
    }

    next();
  };
}
