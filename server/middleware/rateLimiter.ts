import rateLimit from "express-rate-limit";
import { createErrorResponse } from "../utils/errors";

export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30, // 30 req/min per IP
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    trustProxy: false,
    xForwardedForHeader: false,
    forwardedHeader: false,
  },
  handler: (req, res) => {
    res.status(429).json(createErrorResponse("Too many requests. Please wait.", "TOO_MANY_REQUESTS"));
  }
});

export const dataLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60, // 60 req/min per IP
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    trustProxy: false,
    xForwardedForHeader: false,
    forwardedHeader: false,
  },
  handler: (req, res) => {
    res.status(429).json(createErrorResponse("Too many requests. Please wait.", "TOO_MANY_REQUESTS"));
  }
});
