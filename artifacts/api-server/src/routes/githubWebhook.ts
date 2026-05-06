import { Router, type IRouter, raw } from "express";
import { createHmac, timingSafeEqual } from "node:crypto";
import { db, projectSourcesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";
import { logActivity } from "../lib/activityLog";

/**
 * GitHub webhook receiver — closes the "continuous gap detection on every
 * commit" parity gap. Customers point their GitHub repo's webhook at
 * `POST /api/webhooks/github` with content type `application/json` and a
 * shared secret stored in the `GITHUB_WEBHOOK_SECRET` env var.
 *
 * On a `push` event we:
 *   1. verify the `x-hub-signature-256` HMAC against the body bytes (timing-safe)
 *   2. resolve the GitHub repo URL → projectId via the existing
 *      `project_sources` table (kind=github, config.repoUrl matches)
 *   3. enqueue an activity row tagged `gap_analysis_pending` so the
 *      scheduled gap-analysis worker (or any UI poller) can pick it up
 *
 * The endpoint is mounted with `raw({ type: "application/json" })` so the
 * raw body bytes are available for HMAC verification.
 */
const router: IRouter = Router();

function verifySignature(secret: string, rawBody: Buffer, header: string | undefined): boolean {
  if (!header || !header.startsWith("sha256=")) return false;
  const expected = "sha256=" + createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(header);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function normalizeRepoUrl(url: string | undefined | null): string {
  if (!url) return "";
  return url.toLowerCase().replace(/\.git$/, "").replace(/\/$/, "");
}

router.post(
  "/webhooks/github",
  raw({ type: "application/json", limit: "5mb" }),
  async (req, res) => {
    const secret = process.env.GITHUB_WEBHOOK_SECRET;
    if (!secret) {
      res.status(503).json({ error: "GITHUB_WEBHOOK_SECRET not configured" });
      return;
    }
    const rawBody = req.body as Buffer;
    if (!Buffer.isBuffer(rawBody)) {
      res.status(400).json({ error: "Expected raw body" });
      return;
    }
    const sig = req.header("x-hub-signature-256") ?? undefined;
    if (!verifySignature(secret, rawBody, sig)) {
      res.status(401).json({ error: "Invalid signature" });
      return;
    }

    const event = req.header("x-github-event") ?? "";
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(rawBody.toString("utf8")) as Record<string, unknown>;
    } catch {
      res.status(400).json({ error: "Invalid JSON" });
      return;
    }

    if (event === "ping") {
      res.json({ ok: true, event: "ping" });
      return;
    }
    if (event !== "push") {
      // Ack so GitHub doesn't keep retrying — we just don't act on it.
      res.json({ ok: true, ignored: event });
      return;
    }

    const repo = payload.repository as Record<string, unknown> | undefined;
    const repoUrl = normalizeRepoUrl((repo?.html_url as string) ?? (repo?.clone_url as string));
    if (!repoUrl) {
      res.status(400).json({ error: "Missing repository.html_url" });
      return;
    }

    const sources = await db
      .select()
      .from(projectSourcesTable)
      .where(eq(projectSourcesTable.kind, "github"));
    const matched = sources.filter((s) => {
      const cfg = (s.config ?? {}) as Record<string, unknown>;
      const u =
        normalizeRepoUrl(cfg.repoUrl as string) ||
        normalizeRepoUrl(cfg.url as string) ||
        normalizeRepoUrl(cfg.repository as string);
      return u && u === repoUrl;
    });

    if (matched.length === 0) {
      logger.info({ repoUrl }, "github webhook: no project source matched");
      res.json({ ok: true, matched: 0 });
      return;
    }

    const ref = (payload.ref as string) ?? "";
    const after = (payload.after as string) ?? "";
    const commits = Array.isArray(payload.commits) ? payload.commits.length : 0;

    for (const src of matched) {
      await logActivity(
        "gap_analysis_pending",
        `GitHub push to ${repoUrl} (${ref}, ${commits} commit${commits === 1 ? "" : "s"}, sha ${after.slice(0, 7)}) — gap analysis queued.`,
        "github_webhook",
        src.projectId,
      );
      logger.info(
        { projectId: src.projectId, sourceId: src.id, ref, after },
        "github webhook: gap analysis queued",
      );
    }

    res.json({ ok: true, matched: matched.length });
  },
);

export default router;
