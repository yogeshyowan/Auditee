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
  // Letters only, uppercase, capped at 4 chars. Stripping non-alphanumerics
  // (especially `-`) keeps allocated codes single-segment (`PROJ-0042`) so
  // the trailing-number parser below stays unambiguous.
  const cleaned = (slug ?? "REQ").toUpperCase().replace(/[^A-Z0-9]/g, "");
  return (cleaned || "REQ").slice(0, 4);
}

/**
 * Drizzle wraps pg errors in DrizzleQueryError — the SQLSTATE / constraint
 * name we care about live on `err.cause`, not on the outer error. Walk the
 * cause chain so we don't miss a unique-violation that should be retried.
 */
function isProjectCodeUniqueViolation(err: unknown): boolean {
  let cur: unknown = err;
  for (let i = 0; i < 5 && cur; i++) {
    const e = cur as { code?: string; constraint?: string; cause?: unknown };
    if (e?.code === "23505" && e?.constraint === "requirements_project_code_unique") {
      return true;
    }
    cur = e?.cause;
  }
  return false;
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
          // Match the trailing numeric segment regardless of how many `-`
          // segments precede it. Robust against legacy multi-segment codes
          // (e.g. `A-PA-0044`) that broke the old `split("-")[1]` parse.
          const tail = r.code.match(/(\d+)$/);
          const n = tail ? Number(tail[1]) : 0;
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
      // retryable condition). Drizzle wraps pg errors so we walk err.cause.
      if (isProjectCodeUniqueViolation(err)) {
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
