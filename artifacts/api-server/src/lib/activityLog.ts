import { randomUUID } from "node:crypto";
import { db, activityEventsTable } from "@workspace/db";

/**
 * Shared activity-log helper. Mirrors the inline helper in routes/ai.ts so
 * any route can emit timeline events without duplicating insert logic.
 */
export async function logActivity(
  kind: string,
  message: string,
  actor: string,
  entityCode?: string,
) {
  await db.insert(activityEventsTable).values({
    id: randomUUID(),
    kind,
    message,
    actor,
    entityCode: entityCode ?? null,
  });
}
