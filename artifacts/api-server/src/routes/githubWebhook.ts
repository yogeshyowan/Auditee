import { Router, type IRouter, raw } from "express";
import { createHmac, timingSafeEqual } from "node:crypto";
import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { db, projectSourcesTable, capaActionsTable, pipelineRunsTable } from "@workspace/db";
import { logger } from "../lib/logger";
import { logActivity } from "../lib/activityLog";
import { postCheckRun, parseFullName, type CheckRunConclusion } from "../lib/github-check-runs.js";

/**
 * GitHub webhook receiver — closes the "continuous gap detection on every
 * commit" parity gap. Customers point their GitHub repo's webhook at
 * `POST /api/webhooks/github` with content type `application/json` and a
 * shared secret stored in the `GITHUB_WEBHOOK_SECRET` env var.
 *
 * Two parts:
 *  1. Push / PR ack — verify the signature, resolve the repo URL to one
 *     or more `project_sources.kind = "github"` rows, log a
 *     `gap_analysis_pending` activity row.
 *  2. Compliance-as-code merge gate — for each matched source, compute a
 *     pass/fail snapshot (any open critical/high CAPA OR any failed
 *     pipeline run on this commit's branch in the last 24h → fail), then
 *     POST a Check Run back to GitHub for the head SHA. When the repo's
 *     branch protection requires the "Auditee / Compliance" check, this
 *     literally blocks the merge button on a PR with regressions.
 *
 * Per-source opt-out: set `cfg.gateChecks = false` on the source row.
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

// Compute the merge-gate verdict for a project. The signal is intentionally
// simple and explainable so customers can predict whether a push will pass:
//   - any OPEN capa with severity in {critical, high}                         → failure
//   - any FAILED pipeline run in the last 24h on this branch (or this SHA)    → failure
//   - else                                                                    → success
//
// Pipeline runs are scoped to the triggering branch/SHA so an unrelated
// branch's failure can't fail this PR (and vice versa). If neither branch
// nor commitSha is known we fall back to project-wide so the gate still
// runs on legacy data, but in practice push/PR events always carry a ref.
async function computeGateVerdict(
  projectId: string,
  opts: { branch?: string; commitSha?: string },
): Promise<{
  conclusion: CheckRunConclusion;
  title: string;
  summary: string;
}> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const pipeConds = [
    eq(pipelineRunsTable.projectId, projectId),
    eq(pipelineRunsTable.status, "failure"),
    gte(pipelineRunsTable.completedAt, since),
  ];
  // Match the pushed branch OR the exact commit SHA. Either is a "this
  // change broke the pipeline" signal; both together would over-narrow.
  if (opts.branch && opts.commitSha) {
    pipeConds.push(
      sql`(${pipelineRunsTable.branch} = ${opts.branch} OR ${pipelineRunsTable.commitSha} = ${opts.commitSha})`,
    );
  } else if (opts.branch) {
    pipeConds.push(eq(pipelineRunsTable.branch, opts.branch));
  } else if (opts.commitSha) {
    pipeConds.push(eq(pipelineRunsTable.commitSha, opts.commitSha));
  }
  const [capaRows, pipeRows] = await Promise.all([
    db
      .select({
        severity: capaActionsTable.severity,
        count: sql<number>`count(*)::int`,
      })
      .from(capaActionsTable)
      .where(
        and(
          eq(capaActionsTable.projectId, projectId),
          eq(capaActionsTable.status, "open"),
          inArray(capaActionsTable.severity, ["critical", "high"]),
        ),
      )
      .groupBy(capaActionsTable.severity),
    db
      .select({
        kind: pipelineRunsTable.kind,
        count: sql<number>`count(*)::int`,
      })
      .from(pipelineRunsTable)
      .where(and(...pipeConds))
      .groupBy(pipelineRunsTable.kind),
  ]);
  const critical = capaRows.find((r) => r.severity === "critical")?.count ?? 0;
  const high = capaRows.find((r) => r.severity === "high")?.count ?? 0;
  const failedRuns = pipeRows.reduce((acc, r) => acc + r.count, 0);
  const fail = critical > 0 || high > 0 || failedRuns > 0;
  const lines: string[] = [
    "**Auditee compliance gate**",
    "",
    `- Open **critical** CAPAs: \`${critical}\``,
    `- Open **high** CAPAs: \`${high}\``,
    `- Failed pipeline runs (last 24h): \`${failedRuns}\``,
    "",
    fail
      ? "❌ **Blocked.** Resolve the items above (or downgrade to medium severity) and push again."
      : "✅ **Clear.** No open critical/high CAPAs and no recent pipeline failures.",
    "",
    "_Gate logic: any open critical/high CAPA OR any failed pipeline run in the last 24 hours fails the check. Open the project in Auditee for full audit details._",
  ];
  return {
    conclusion: fail ? "failure" : "success",
    title: fail
      ? `Blocked — ${critical} critical, ${high} high, ${failedRuns} failed runs`
      : "Compliance clear",
    summary: lines.join("\n"),
  };
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
    // Recognised events: push (new commits to a branch) and
    // pull_request opened/synchronize/reopened (new PR or PR head moved).
    let headSha = "";
    let ref = "";
    let branch = ""; // short branch name used for pipeline scoping
    let commitsCount = 0;
    if (event === "push") {
      headSha = (payload.after as string) ?? "";
      ref = (payload.ref as string) ?? "";
      // refs/heads/main → main; refs/tags/* / unknown → leave blank so
      // we fall back to commitSha-only matching in the verdict.
      if (ref.startsWith("refs/heads/")) branch = ref.slice("refs/heads/".length);
      commitsCount = Array.isArray(payload.commits) ? payload.commits.length : 0;
    } else if (event === "pull_request") {
      const action = (payload.action as string) ?? "";
      if (!["opened", "synchronize", "reopened"].includes(action)) {
        res.json({ ok: true, ignored: `${event}.${action}` });
        return;
      }
      const pr = payload.pull_request as Record<string, any> | undefined;
      headSha = (pr?.head?.sha as string) ?? "";
      branch = (pr?.head?.ref as string) ?? "";
      ref = `refs/pull/${pr?.number}/head`;
    } else {
      res.json({ ok: true, ignored: event });
      return;
    }

    const repo = payload.repository as Record<string, unknown> | undefined;
    const repoUrl = normalizeRepoUrl((repo?.html_url as string) ?? (repo?.clone_url as string));
    if (!repoUrl) {
      res.status(400).json({ error: "Missing repository.html_url" });
      return;
    }
    const ownerRepo = parseFullName(repo?.full_name as string | undefined);

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

    // Always log activity for every matched source — multi-project repos
    // still want each project's history updated.
    for (const src of matched) {
      await logActivity(
        "gap_analysis_pending",
        `GitHub ${event} on ${repoUrl} (${ref}, ${commitsCount} commit${commitsCount === 1 ? "" : "s"}, sha ${headSha.slice(0, 7)}) — gap analysis queued.`,
        "github_webhook",
        src.projectId,
      );
    }

    // Pick a single project to post the "Auditee / Compliance" check-run
    // for. The check name is fixed (so branch-protection rules can require
    // it deterministically), so posting from N projects on the same repo
    // would race and clobber each other on GitHub's side. Deterministic
    // tie-break: lowest source.id wins. Customers wanting a separate gate
    // per project on a shared repo are out of scope for this MVP — when
    // that comes up we'll switch to a per-project check-run name.
    let gatesPosted = 0;
    let gatesFailed = 0;
    let gateProjectId: string | null = null;
    if (ownerRepo && headSha) {
      const projectIds = Array.from(new Set(matched.map((s) => s.projectId)));
      if (projectIds.length > 1) {
        logger.warn(
          { repoUrl, projectIds },
          "github webhook: multiple projects matched same repo — posting check-run for deterministic project only",
        );
      }
      const eligible = matched
        .filter((s) => ((s.config ?? {}) as Record<string, any>).gateChecks !== false)
        .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
      const chosen = eligible[0];
      if (!chosen) {
        logger.info({ repoUrl }, "github webhook: gate opted out via cfg.gateChecks=false on all matched sources");
      } else {
        const cfg = (chosen.config ?? {}) as Record<string, any>;
        const token = (cfg.token as string) || process.env.GITHUB_PAT || "";
        if (!token) {
          logger.warn({ projectId: chosen.projectId }, "github webhook: no token for check-run, skipping gate");
        } else {
          try {
            const verdict = await computeGateVerdict(chosen.projectId, { branch, commitSha: headSha });
            await postCheckRun(token, {
              owner: ownerRepo.owner,
              repo: ownerRepo.repo,
              headSha,
              conclusion: verdict.conclusion,
              title: verdict.title,
              summary: verdict.summary,
            });
            gatesPosted = 1;
            if (verdict.conclusion === "failure") gatesFailed = 1;
            gateProjectId = chosen.projectId;
            logger.info(
              { projectId: chosen.projectId, sha: headSha.slice(0, 7), branch, conclusion: verdict.conclusion },
              "github webhook: posted compliance check-run",
            );
          } catch (err: any) {
            logger.warn(
              { err: err.message, projectId: chosen.projectId },
              "github webhook: check-run post failed",
            );
          }
        }
      }
    }

    res.json({ ok: true, matched: matched.length, gatesPosted, gatesFailed, gateProjectId });
  },
);

export default router;
