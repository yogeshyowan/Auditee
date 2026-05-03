import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import { CLERK_PROXY_PATH, clerkProxyMiddleware } from "./middlewares/clerkProxyMiddleware";
import { generalLimiter, aiLimiter, strictLimiter, webhookLimiter } from "./middlewares/rateLimiter";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// ─── Security headers (Helmet) ────────────────────────────────────────────────
// Applied first so every response carries the headers, even error responses.
// This is a pure API server (no HTML); CSP is tightened to block all script
// execution in the unlikely event a browser hits the API directly.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        scriptSrc: ["'none'"],
        styleSrc: ["'none'"],
        imgSrc: ["'none'"],
        connectSrc: ["'self'"],
        frameAncestors: ["'none'"],
      },
    },
    // Force HTTPS for 2 years; include subdomains; allow preload list submission.
    strictTransportSecurity: {
      maxAge: 63_072_000,
      includeSubDomains: true,
      preload: true,
    },
    // Prevent MIME-type sniffing — stops browsers from misinterpreting API JSON
    // as executable content.
    noSniff: true,
    // Block this API from being loaded inside a frame/iframe (clickjacking).
    frameguard: { action: "deny" },
    // Disable browser DNS prefetching on API responses.
    dnsPrefetchControl: { allow: false },
    // Do not advertise server technology via X-Powered-By.
    hidePoweredBy: true,
    // Referrer-Policy: only send origin on cross-origin navigations.
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    // Disable deprecated X-XSS-Protection (modern browsers ignore it; enabling
    // it on older ones can introduce reflected-XSS bypasses).
    xssFilter: false,
    // Permissions-Policy: deny all browser feature APIs to this origin.
    permittedCrossDomainPolicies: { permittedPolicies: "none" },
  }),
);

// Add Permissions-Policy header (not yet in Helmet's built-ins for all features).
app.use((_req, res, next) => {
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=()",
  );
  next();
});

// ─── Request logging ──────────────────────────────────────────────────────────
// Serializers deliberately strip query strings (PII leakage) and the response
// body (could contain sensitive data). Only method, path, and status logged.
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// ─── Clerk proxy (must come before CORS + rate limiting) ─────────────────────
app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());

// ─── CORS ─────────────────────────────────────────────────────────────────────
// Path-based proxy means the eltegra-site and api-server share a parent
// origin, so CORS is not needed for the normal browser flow. We still allow
// an explicit allowlist for direct/dev tooling. NEVER reflect arbitrary
// origins while sending credentials — that would let any site read user data.
const allowedOrigins = new Set<string>(
  [
    process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : null,
    process.env.SITE_URL ?? null,
    "https://auditee.site",
    "http://localhost:5173",
    "http://localhost:80",
    "http://localhost:24265",
  ].filter((v): v is string => !!v),
);

app.use(
  cors({
    credentials: true,
    origin: (origin, cb) => {
      // Same-origin / non-browser callers (no Origin header) — allow.
      if (!origin) return cb(null, true);
      if (allowedOrigins.has(origin)) return cb(null, true);
      return cb(null, false);
    },
  }),
);

// ─── Body parsing ─────────────────────────────────────────────────────────────
// Capture the raw request bytes alongside the parsed JSON so the Razorpay
// billing webhook can verify its HMAC signature against the exact payload
// Razorpay sent. Adds ~one Buffer per request — negligible.
app.use(
  express.json({
    verify: (req, _res, buf) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (req as any).rawBody = buf;
    },
    // Limit body to 2 MB — reject oversized payloads before they reach routes.
    limit: "2mb",
  }),
);
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// ─── Clerk session ────────────────────────────────────────────────────────────
app.use(clerkMiddleware());

// ─── Rate limiting ────────────────────────────────────────────────────────────
// General limit covers all routes; specialised limits are narrower.
app.use("/api", generalLimiter);

// AI generation endpoints — computationally expensive and cost money.
app.use("/api/ai", aiLimiter);

// Workspace bootstrap + member management — brute-force / enumeration targets.
app.use("/api/workspace", strictLimiter);

// Billing webhook — protect against replay floods.
app.use("/api/billing/webhook", webhookLimiter);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api", router);

export default app;
