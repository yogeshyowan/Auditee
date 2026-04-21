import { and, eq, lte } from "drizzle-orm";
import {
  db,
  recurringAuditsTable,
  projectsTable,
  complianceFrameworksTable,
} from "@workspace/db";
import { logger } from "./logger";
import { notify } from "./notify";
import { nextOccurrence } from "../routes/recurringAudits";

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
  if (due.length === 0) return;
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
}
