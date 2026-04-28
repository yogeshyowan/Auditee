import { and, eq, isNull, lte, sql } from "drizzle-orm";
import {
  db,
  recurringAuditsTable,
  projectsTable,
  complianceFrameworksTable,
  requirementsTable,
  testCasesTable,
  traceabilityLinksTable,
  notificationsTable,
  projectMembersTable,
  projectSourcesTable,
} from "@workspace/db";
import { logger } from "./logger";
import { notify } from "./notify";
import { nextOccurrence } from "../routes/recurringAudits";
import { randomUUID } from "node:crypto";
import { ingestGithub, ingestRemoteSystem } from "./source-ingestion";
import { ingestRequirementsTool, isRmKind } from "./rm-ingestion";
import { ingestDefectsTool, isDefectKind } from "./defect-ingestion";

// In-process scheduler. Each tick (60s) finds active schedules whose nextRunAt has
// passed, calls the AI compliance audit endpoint internally (via fetch to localhost),
// updates lastRunAt + nextRunAt, and notifies recipients.
const TICK_MS = 60_000;
let started = false;
let ticking = false;

export function startScheduler(port: number): void {
  if (started) return;
  started = true;
  logger.info({ port }, "Recurring audit scheduler started");
  setInterval(() => {
    if (ticking) return; // prevent overlapping ticks
    ticking = true;
    runTick(port)
      .catch((err) => logger.warn({ err }, "scheduler tick failed"))
      .finally(() => {
        ticking = false;
      });
  }, TICK_MS);
}

async function runTick(port: number): Promise<void> {
  // Atomically claim due schedules by advancing nextRunAt before processing.
  // This prevents duplicate execution if multiple instances or overlapping ticks occur.
  const due = await db
    .select()
    .from(recurringAuditsTable)
    .where(and(eq(recurringAuditsTable.active, true), lte(recurringAuditsTable.nextRunAt, new Date())));
  if (due.length === 0) {
    // Even when no audits are due, still run the daily stale-requirements
    // digest pass — it has its own 24h dedupe so it's cheap to call often.
    await runStaleRequirementsDigest();
    return;
  }
  // Pre-claim: bump nextRunAt forward immediately so a concurrent tick won't pick the same row.
  const claimed: typeof due = [];
  for (const sched of due) {
    const tentative = nextOccurrence(sched.cadence, sched.hourUtc);
    const result = await db
      .update(recurringAuditsTable)
      .set({ nextRunAt: tentative, updatedAt: new Date() })
      .where(
        and(
          eq(recurringAuditsTable.id, sched.id),
          lte(recurringAuditsTable.nextRunAt, new Date()),
          eq(recurringAuditsTable.active, true),
        ),
      )
      .returning({ id: recurringAuditsTable.id });
    if (result.length > 0) claimed.push(sched);
  }
  for (const sched of claimed) {
    try {
      const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, sched.projectId));
      const [framework] = await db
        .select()
        .from(complianceFrameworksTable)
        .where(eq(complianceFrameworksTable.id, sched.frameworkId));
      if (!project || !framework) continue;

      // Pre-audit pull: refresh every linked source (GitHub code, Jira/Polarion/DOORS
      // requirements, defect trackers, …) so the AI evaluates the *current* state of
      // the project rather than whatever was ingested last. Best-effort — a failing
      // source must NEVER block the audit run, only get logged so an operator can fix
      // it after the fact. Each per-source result is also stored on the source row so
      // the UI shows when the last automated pre-audit sync occurred and whether it
      // succeeded.
      await syncProjectSourcesForAudit(sched.projectId, sched.id);

      const r = await fetch(`http://127.0.0.1:${port}/api/ai/compliance-audit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: sched.projectId, frameworkId: sched.frameworkId }),
      });
      const ok = r.ok;
      const result = ok ? ((await r.json()) as { capasCreated?: number; overallVerdict?: string }) : null;
      // nextRunAt was already advanced during the claim phase; just record the run outcome.
      await db
        .update(recurringAuditsTable)
        .set({
          lastRunAt: new Date(),
          lastRunStatus: ok ? "ok" : `error:${r.status}`,
          updatedAt: new Date(),
        })
        .where(eq(recurringAuditsTable.id, sched.id));
      // Notify each recipient.
      const recipients = sched.notifyTo
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      for (const rcpt of recipients) {
        await notify({
          recipient: rcpt,
          kind: "audit_completed",
          title: `${framework.code} recurring audit · ${project.name}`,
          body: ok
            ? `Verdict: ${result?.overallVerdict ?? "—"} · ${result?.capasCreated ?? 0} CAPA(s) opened`
            : `Audit run failed (HTTP ${r.status})`,
          link: `/app/compliance`,
          channels: ["in_app", "email"],
          data: { projectId: project.id, frameworkId: framework.id },
        });
      }
      logger.info({ scheduleId: sched.id, ok }, "Recurring audit tick executed");
    } catch (err) {
      logger.warn({ err, scheduleId: sched.id }, "Recurring audit execution failed");
    }
  }
  await runStaleRequirementsDigest();
}

// ---------------------------------------------------------------
// Stale-requirements digest — once per project per 24 h, emit a
// notification listing every requirement that has been Documented
// for >7 days but has *no* test_cases and *no* code/test traceability
// links. Implemented as an idempotent per-day pass: we look up
// existing notifications of kind=stale_requirements_digest emitted
// in the last 24h for the project and skip those.
// ---------------------------------------------------------------
const STALE_DAYS = 7;

async function runStaleRequirementsDigest(): Promise<void> {
  try {
    const projects = await db.select().from(projectsTable);
    if (projects.length === 0) return;

    for (const project of projects) {
      // Has a digest already been sent in the last 24h?
      const sinceCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recent = await db
        .select({ id: notificationsTable.id })
        .from(notificationsTable)
        .where(
          and(
            eq(notificationsTable.kind, "stale_requirements_digest"),
            sql`${notificationsTable.data}->>'projectId' = ${project.id}`,
            sql`${notificationsTable.createdAt} >= ${sinceCutoff}`,
          ),
        )
        .limit(1);
      if (recent.length > 0) continue;

      // Documented requirements older than 7 days, with NO test cases AND NO
      // traceability links — computed in a single set-based query (NOT EXISTS)
      // to avoid n+1.
      const cutoff = new Date(Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000);
      const staleRows = await db.execute<{
        id: string;
        code: string;
        title: string;
      }>(sql`
        SELECT r.id, r.code, r.title
        FROM ${requirementsTable} r
        WHERE r.project_id = ${project.id}
          AND r.status = 'documented'
          AND r.updated_at <= ${cutoff}
          AND NOT EXISTS (SELECT 1 FROM ${testCasesTable} t WHERE t.requirement_id = r.id)
          AND NOT EXISTS (SELECT 1 FROM ${traceabilityLinksTable} l WHERE l.requirement_id = r.id)
        LIMIT 200
      `);
      const stale = (staleRows as unknown as { rows?: Array<{ id: string; code: string; title: string }> }).rows
        ?? (staleRows as unknown as Array<{ id: string; code: string; title: string }>);
      if (!stale || stale.length === 0) continue;

      // Only manager-tier project members receive the digest — developers,
      // reviewers and auditors don't need to be paged about stale work.
      const members = await db
        .select({ userId: projectMembersTable.userId, role: projectMembersTable.role })
        .from(projectMembersTable)
        .where(eq(projectMembersTable.projectId, project.id));
      const recipients = members
        .filter((m) => m.role === "manager")
        .map((m) => m.userId);
      if (recipients.length === 0) continue; // no manager → skip rather than fan out

      const sample = stale.slice(0, 5).map((s) => `${s.code} — ${s.title}`).join("; ");
      const body = `${stale.length} requirement(s) have been documented for >${STALE_DAYS} days with no tests and no implementation links: ${sample}${stale.length > 5 ? ` (+${stale.length - 5} more)` : ""}.`;
      for (const rcpt of recipients) {
        await db.insert(notificationsTable).values({
          id: randomUUID(),
          recipient: rcpt,
          kind: "stale_requirements_digest",
          title: `${project.name} — ${stale.length} stale requirement(s)`,
          body,
          link: `/app/requirements`,
          channels: ["in_app"],
          data: { projectId: project.id, requirementIds: stale.map((s) => s.id) },
        });
      }
      logger.info({ projectId: project.id, count: stale.length }, "Emitted stale-requirements digest");
    }
  } catch (err) {
    logger.warn({ err }, "stale-requirements digest failed");
  }
}

// ---------------------------------------------------------------
// Pre-audit source sync — pull every linked source for a project
// before its scheduled audit fires. Best-effort and isolated:
//
//   • zip / folder / reqif / url   → no remote, skip
//   • github                        → ingestGithub
//   • RM kinds (DOORS / Polarion / Jama / Codebeamer / Helix /
//     Visure / Azure DevOps reqs / Jira reqs / DOORS Next)
//                                  → ingestRequirementsTool
//   • defect kinds (Jira / ADO / Bugzilla / Mantis / …)
//                                  → ingestDefectsTool
//   • everything else (jenkins / jira / aws_s3 / gdrive / …)
//                                  → ingestRemoteSystem
//
// One source's failure must NOT abort the others or the audit.
// Status / lastSyncAt is written back so the UI reflects the
// outcome of the automatic refresh.
// ---------------------------------------------------------------
const SKIP_KINDS = new Set(["zip", "folder", "reqif", "url"]);

async function syncProjectSourcesForAudit(projectId: string, scheduleId: string): Promise<void> {
  let sources: Array<typeof projectSourcesTable.$inferSelect> = [];
  try {
    sources = await db
      .select()
      .from(projectSourcesTable)
      .where(eq(projectSourcesTable.projectId, projectId));
  } catch (err) {
    logger.warn({ err, projectId, scheduleId }, "pre-audit: failed to list project sources");
    return;
  }
  if (sources.length === 0) return;

  let okCount = 0;
  let skipCount = 0;
  let errCount = 0;
  for (const src of sources) {
    if (SKIP_KINDS.has(src.kind)) {
      skipCount++;
      continue;
    }
    try {
      await db
        .update(projectSourcesTable)
        .set({ status: "syncing", statusMessage: "Pre-audit auto-sync", updatedAt: new Date() })
        .where(eq(projectSourcesTable.id, src.id));

      const cfg = (src.config ?? {}) as Record<string, any>;
      let result: { count: number; bytes: number };
      if (src.kind === "github") {
        result = await ingestGithub(src.id, cfg as { repoUrl: string; branch?: string; token?: string });
      } else if (isRmKind(src.kind)) {
        result = await ingestRequirementsTool(src.id, projectId, src.kind, cfg);
      } else if (isDefectKind(src.kind)) {
        result = await ingestDefectsTool(src.id, projectId, src.kind, cfg);
      } else {
        result = await ingestRemoteSystem(src.id, src.kind, cfg);
      }
      okCount++;
      logger.info(
        { projectId, scheduleId, sourceId: src.id, kind: src.kind, count: result.count, bytes: result.bytes },
        "pre-audit: source synced",
      );
    } catch (err) {
      errCount++;
      const msg = err instanceof Error ? err.message : String(err);
      try {
        await db
          .update(projectSourcesTable)
          .set({
            status: "error",
            statusMessage: `Pre-audit sync failed: ${msg.slice(0, 400)}`,
            updatedAt: new Date(),
          })
          .where(eq(projectSourcesTable.id, src.id));
      } catch {
        // swallow: status update is best-effort
      }
      logger.warn(
        { err, projectId, scheduleId, sourceId: src.id, kind: src.kind },
        "pre-audit: source sync failed",
      );
    }
  }
  logger.info(
    { projectId, scheduleId, ok: okCount, skipped: skipCount, errors: errCount, total: sources.length },
    "pre-audit: source refresh complete",
  );
}

// Reference unused import to keep linter quiet when isNull is no longer needed.
void isNull;
