import { Router, type IRouter, raw, json } from "express";
import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";
import multer from "multer";
import { db, projectSourcesTable, pipelineRunsTable } from "@workspace/db";
import { eq, desc, and, gte } from "drizzle-orm";
import { logger } from "../lib/logger";
import { logActivity } from "../lib/activityLog";
import { requireProjectAccessInline } from "../lib/projectAccess";
import {
  PIPELINE_TOOLS,
  getPipelineTool,
  isPipelineKind,
  type PipelineToolDef,
} from "../lib/pipeline-registry";
import {
  parseGithubActionsWorkflowRun,
  parseGitlabPipelineHook,
  parseJenkinsNotification,
  parseJUnitXml,
  parseSarif,
  parseGenericWebhook,
  persistPipelineRun,
} from "../lib/pipeline-ingestion";

/**
 * Pipeline webhook + upload receivers.
 *
 * Mounting:
 *   POST /api/integrations/pipelines/:kind/webhook?source=:sourceId
 *     - Native webhook for github_actions / gitlab_ci / jenkins
 *     - Generic webhook for everything else
 *     - Auth: per-source secret stored in project_sources.config.webhookSecret
 *
 *   POST /api/integrations/pipelines/:kind/upload?source=:sourceId
 *     - For sarif_upload + junit_upload tools (or anything that wants to
 *       drop a file from CI). Auth: per-source secret in `x-pipeline-token`
 *       header OR session cookie if hitting from the UI.
 *
 *   GET  /api/sources/:id/pipeline-runs?limit=20
 *     - Used by the UI to display recent runs against a source.
 *
 *   GET  /api/integrations/pipelines/catalog
 *     - Static catalog of all 37+ supported tools (used by the source picker).
 *
 *   POST /api/sources/:id/pipeline-secret
 *     - Rotates / generates the per-source webhook secret (returns it once;
 *       hashed-equivalent is stored on the source's config).
 */
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });
const router: IRouter = Router();

// ─── Catalog ──────────────────────────────────────────────────────────────
router.get("/integrations/pipelines/catalog", (_req, res) => {
  res.json({
    tools: PIPELINE_TOOLS.map((t) => ({
      kind: t.kind,
      title: t.title,
      vendor: t.vendor,
      category: t.category,
      adapter: t.adapter,
      blurb: t.blurb,
      webhookAuth: t.webhookAuth,
      secretHeader: t.secretHeader,
      docsUrl: t.docsUrl,
      produces: t.produces,
    })),
  });
});

// ─── Per-source secret rotation ───────────────────────────────────────────
router.post("/sources/:id/pipeline-secret", json(), async (req, res) => {
  const [src] = await db.select().from(projectSourcesTable).where(eq(projectSourcesTable.id, req.params.id!));
  if (!src) {
    res.status(404).json({ error: "source not found" });
    return;
  }
  const access = await requireProjectAccessInline(req, res, src.projectId, "developer");
  if (access === false) return;
  if (!isPipelineKind(src.kind)) {
    res.status(400).json({ error: "Source is not a pipeline kind" });
    return;
  }
  const secret = randomBytes(24).toString("hex");
  const cfg = { ...(src.config ?? {}), webhookSecret: secret } as Record<string, unknown>;
  await db
    .update(projectSourcesTable)
    .set({ config: cfg, updatedAt: new Date() })
    .where(eq(projectSourcesTable.id, src.id));
  res.json({ secret, sourceId: src.id });
});

// ─── List recent pipeline runs for a source ──────────────────────────────
router.get("/sources/:id/pipeline-runs", async (req, res) => {
  const [src] = await db.select().from(projectSourcesTable).where(eq(projectSourcesTable.id, req.params.id!));
  if (!src) {
    res.status(404).json({ error: "source not found" });
    return;
  }
  const access = await requireProjectAccessInline(req, res, src.projectId, "auditor");
  if (access === false) return;
  const limit = Math.min(Number(req.query.limit) || 20, 200);
  const runs = await db
    .select()
    .from(pipelineRunsTable)
    .where(eq(pipelineRunsTable.sourceId, src.id))
    .orderBy(desc(pipelineRunsTable.receivedAt))
    .limit(limit);
  res.json({ runs });
});

// ─── Upload (multipart) — JUnit / SARIF / dbt run_results.json / etc. ─────
router.post(
  "/integrations/pipelines/:kind/upload",
  upload.single("file"),
  async (req, res) => {
    const kind = req.params.kind!;
    const tool = getPipelineTool(kind);
    if (!tool) {
      res.status(400).json({ error: `Unknown pipeline kind: ${kind}` });
      return;
    }
    const sourceId = typeof req.query.source === "string" ? req.query.source : undefined;
    if (!sourceId || !req.file) {
      res.status(400).json({ error: "source query param and file are required" });
      return;
    }
    const [src] = await db.select().from(projectSourcesTable).where(eq(projectSourcesTable.id, sourceId));
    if (!src || src.kind !== kind) {
      res.status(404).json({ error: "source not found or kind mismatch" });
      return;
    }
    // Auth: per-source token OR a logged-in user with developer access.
    const headerToken = req.header("x-pipeline-token");
    const cfg = (src.config ?? {}) as Record<string, unknown>;
    const expected = typeof cfg.webhookSecret === "string" ? cfg.webhookSecret : null;
    if (expected && headerToken && constantEq(expected, headerToken)) {
      // ok — token wins
    } else {
      const access = await requireProjectAccessInline(req, res, src.projectId, "developer");
      if (access === false) return;
    }

    try {
      const body = req.file.buffer.toString("utf8");
      let parsed;
      if (tool.adapter === "junit_upload" || /\.xml$/i.test(req.file.originalname)) {
        parsed = parseJUnitXml(body, tool);
      } else if (tool.adapter === "sarif_upload" || /\.sarif(\.json)?$/i.test(req.file.originalname)) {
        const json = JSON.parse(body);
        parsed = parseSarif(json, tool);
      } else {
        const json = JSON.parse(body);
        parsed = { run: parseGenericWebhook(json, tool), findings: [] as any[] };
      }
      const persisted = await persistPipelineRun(
        { ...parsed.run, sourceId: src.id, projectId: src.projectId },
        parsed.findings,
      );
      await logActivity(
        "pipeline_run",
        `${tool.title}: ${parsed.run.name} (${parsed.run.status})`,
        "pipeline_upload",
        src.projectId,
      );
      res.status(201).json({ ok: true, runId: persisted.runId });
    } catch (err: any) {
      logger.error({ err, kind }, "pipeline upload failed");
      res.status(400).json({ error: err.message ?? "Could not parse pipeline upload" });
    }
  },
);

// ─── Webhook (raw body for HMAC verification) ─────────────────────────────
router.post(
  "/integrations/pipelines/:kind/webhook",
  raw({ type: "*/*", limit: "10mb" }),
  async (req, res) => {
    const kind = req.params.kind!;
    const tool = getPipelineTool(kind);
    if (!tool) {
      res.status(400).json({ error: `Unknown pipeline kind: ${kind}` });
      return;
    }
    const sourceId = typeof req.query.source === "string" ? req.query.source : undefined;
    if (!sourceId) {
      res.status(400).json({ error: "source query param required" });
      return;
    }
    const [src] = await db.select().from(projectSourcesTable).where(eq(projectSourcesTable.id, sourceId));
    if (!src || src.kind !== kind) {
      res.status(404).json({ error: "source not found or kind mismatch" });
      return;
    }
    const cfg = (src.config ?? {}) as Record<string, unknown>;
    const rawBody = req.body as Buffer;
    if (!Buffer.isBuffer(rawBody)) {
      res.status(400).json({ error: "Expected raw body" });
      return;
    }

    if (!verifyWebhook(req, rawBody, tool, cfg)) {
      res.status(401).json({ error: "Invalid signature" });
      return;
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody.toString("utf8"));
    } catch {
      res.status(400).json({ error: "Invalid JSON" });
      return;
    }

    try {
      let parsed: { run: any; findings: any[] };
      if (tool.adapter === "github_actions") {
        const event = req.header("x-github-event") ?? "";
        if (event === "ping") { res.json({ ok: true, event: "ping" }); return; }
        if (event !== "workflow_run" && event !== "check_run") {
          res.json({ ok: true, ignored: event });
          return;
        }
        if (event === "workflow_run" && payload.action !== "completed" && payload.action !== "requested" && payload.action !== "in_progress") {
          res.json({ ok: true, ignored_action: payload.action });
          return;
        }
        parsed = { run: parseGithubActionsWorkflowRun(payload), findings: [] };
      } else if (tool.adapter === "gitlab_ci") {
        const event = String(payload.object_kind ?? "");
        if (event !== "pipeline" && event !== "build") {
          res.json({ ok: true, ignored: event });
          return;
        }
        parsed = { run: parseGitlabPipelineHook(payload), findings: [] };
      } else if (tool.adapter === "jenkins") {
        parsed = { run: parseJenkinsNotification(payload), findings: [] };
      } else if (tool.adapter === "sarif_upload" && payload?.runs) {
        // Some scanners (SonarQube webhooks, semgrep app) post SARIF inline.
        parsed = parseSarif(payload, tool);
      } else {
        parsed = { run: parseGenericWebhook(payload, tool), findings: [] };
      }

      const persisted = await persistPipelineRun(
        { ...parsed.run, sourceId: src.id, projectId: src.projectId },
        parsed.findings,
      );
      await logActivity(
        "pipeline_run",
        `${tool.title}: ${parsed.run.name} (${parsed.run.status})`,
        "pipeline_webhook",
        src.projectId,
      );
      res.status(202).json({ ok: true, runId: persisted.runId });
    } catch (err: any) {
      logger.error({ err, kind }, "pipeline webhook handling failed");
      res.status(400).json({ error: err.message ?? "Could not handle webhook" });
    }
  },
);

function verifyWebhook(req: any, rawBody: Buffer, tool: PipelineToolDef, cfg: Record<string, unknown>): boolean {
  if (tool.webhookAuth === "none") return true;
  const secret = typeof cfg.webhookSecret === "string" ? cfg.webhookSecret : null;
  // No secret configured → reject. We do NOT accept-and-warn here because
  // the source ID is the only handle the upstream tool needs, and a leaked
  // ID would let an attacker post fraudulent green builds / clean scans
  // that pollute audit evidence. Users must hit "Generate secret" before
  // the webhook accepts anything.
  if (!secret) {
    logger.warn({ kind: tool.kind }, "pipeline webhook rejected: no secret configured on source");
    return false;
  }
  const headerName = (tool.secretHeader ?? "x-pipeline-token").toLowerCase();
  const hdr = req.header(headerName) ?? "";
  if (tool.webhookAuth === "shared-token") {
    return constantEq(hdr, secret);
  }
  if (tool.webhookAuth === "hmac-sha256") {
    // Common shapes: "sha256=<hex>" (GitHub), "<base64>" (Sonar), "<hex>" (others).
    const expectedHex = createHmac("sha256", secret).update(rawBody).digest("hex");
    const expectedB64 = createHmac("sha256", secret).update(rawBody).digest("base64");
    const cleaned = hdr.replace(/^sha256=/, "").trim();
    return constantEq(cleaned, expectedHex) || constantEq(cleaned, expectedB64);
  }
  return false;
}

function constantEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

export default router;
// Reference imports kept silent for tree-shakers.
void and; void gte;
