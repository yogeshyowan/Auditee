import rateLimit from "express-rate-limit";
import type { Request } from "express";

function clientIp(req: Request): string {
  return (
    req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ??
    req.socket?.remoteAddress ??
    "unknown"
  );
}

/**
 * General API rate limit: 200 requests / 15 minutes per IP.
 * Applied to all /api/* routes.
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: clientIp,
  message: { error: "Too many requests, please slow down and try again." },
  skip: (req) => req.method === "OPTIONS",
});

/**
 * Strict rate limit for authentication-adjacent and sensitive mutation routes:
 * 30 requests / 15 minutes per IP.
 *
 * Applied to: workspace bootstrap (/api/workspace), invite/member flows.
 */
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: clientIp,
  message: { error: "Too many requests on this endpoint, please try again later." },
});

/**
 * AI generation rate limit: 20 requests / 15 minutes per IP.
 * AI operations are expensive; this prevents credential-stuffing abuse
 * and reduces unintentional runaway usage.
 */
export const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: clientIp,
  message: { error: "AI generation rate limit reached. Please wait before retrying." },
});

/**
 * Webhook rate limit: 60 requests / minute per IP.
 * Protects the billing webhook from replay floods.
 */
export const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: clientIp,
  message: { error: "Webhook rate limit exceeded." },
});
