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
} from "@workspace/db";
import { logger } from "./logger";
import { notify } from "./notify";
import { nextOccurrence } from "../routes/recurringAudits";
import { randomUUID } from "node:crypto";

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

// Reference unused import to keep linter quiet when isNull is no longer needed.
void isNull;
