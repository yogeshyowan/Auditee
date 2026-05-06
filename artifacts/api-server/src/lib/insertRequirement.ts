import { eq, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db, requirementsTable, projectsTable } from "@workspace/db";

type RequirementInsert = typeof requirementsTable.$inferInsert;
type RequirementRow = typeof requirementsTable.$inferSelect;

/**
 * Build the row to insert given a freshly-allocated `code`. Callers can
 * mirror the code into `externalId` (for AI-extracted rows) or skip it
 * (for manually-authored rows).
 */
export type RequirementBuilder = (code: string) => Omit<
  RequirementInsert,
  "code" | "projectId"
> & { id?: string };

const MAX_CODE_RETRIES = 8;

function projectPrefix(slug: string | null | undefined): string {
  return (slug ?? "REQ").toUpperCase().slice(0, 4);
}

/**
 * Insert a new requirement, allocating a unique `code` of the form
 * `{prefix}-{NNNN}` for the given project.
 *
 * Race-safety: a per-project Postgres advisory transaction lock serialises
 * concurrent allocations, and the `requirements_project_code_unique` index
 * is the hard backstop — on a 23505 unique_violation we recompute the next
 * free number and retry, up to MAX_CODE_RETRIES times.
 */
export async function insertRequirement(
  projectId: string,
  build: RequirementBuilder,
): Promise<RequirementRow> {
  const [project] = await db
    .select({ slug: projectsTable.slug })
    .from(projectsTable)
    .where(eq(projectsTable.id, projectId));
  if (!project) throw new Error(`Project not found: ${projectId}`);
  const prefix = projectPrefix(project.slug);

  let lastErr: unknown = null;
  for (let attempt = 0; attempt < MAX_CODE_RETRIES; attempt++) {
    try {
      return await db.transaction(async (tx) => {
        // Per-project advisory lock — serialises concurrent allocators so
        // the common case is collision-free; the retry loop only fires if
        // a writer outside this transaction (e.g. a separate process)
        // grabs the same number first.
        await tx.execute(
          sql`SELECT pg_advisory_xact_lock(hashtext(${projectId}))`,
        );
        const rows = await tx
          .select({ code: requirementsTable.code })
          .from(requirementsTable)
          .where(eq(requirementsTable.projectId, projectId));
        const max = rows.reduce((m, r) => {
          const n = Number(r.code.split("-")[1] ?? "0");
          return Number.isFinite(n) && n > m ? n : m;
        }, 0);
        const code = `${prefix}-${String(max + 1 + attempt).padStart(4, "0")}`;
        const { id: draftId, ...rest } = build(code);
        const [row] = await tx
          .insert(requirementsTable)
          .values({
            ...rest,
            id: draftId ?? randomUUID(),
            projectId,
            code,
          })
          .returning();
        return row!;
      });
    } catch (err) {
      // Postgres unique_violation. Could be requirements_project_code_unique
      // (we lost a race for this code number) or requirements_provenance_unique
      // (caller passed a sourceId/externalId that already exists — not a
      // retryable condition).
      const pgCode = (err as { code?: string } | null)?.code;
      const constraint = (err as { constraint?: string } | null)?.constraint;
      if (pgCode === "23505" && constraint === "requirements_project_code_unique") {
        lastErr = err;
        continue;
      }
      throw err;
    }
  }
  throw lastErr ??
    new Error(
      `insertRequirement: exceeded ${MAX_CODE_RETRIES} retries allocating a code for project ${projectId}`,
    );
}
