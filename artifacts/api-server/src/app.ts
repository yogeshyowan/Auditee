import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import { CLERK_PROXY_PATH, clerkProxyMiddleware } from "./middlewares/clerkProxyMiddleware";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

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

app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());

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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(clerkMiddleware());

app.use("/api", router);

export default app;
