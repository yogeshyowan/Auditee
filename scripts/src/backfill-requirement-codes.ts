import { pool } from "@workspace/db";

/**
 * One-shot backfill that re-numbers any duplicate `(project_id, code)` rows
 * in the `requirements` table so the `requirements_project_code_unique`
 * index can be added cleanly.
 *
 * Strategy: within each project, keep the oldest row (by created_at, id) at
 * its current code, and renumber the rest to fresh codes appended after the
 * project's current max numeric suffix. The renumber is deterministic and
 * idempotent — running it twice on a clean table is a no-op.
 *
 * Run with: pnpm --filter @workspace/scripts run backfill:req-codes
 */
async function main(): Promise<void> {
  const dupes = await pool.query<{ project_id: string; code: string; n: string }>(`
    SELECT project_id, code, COUNT(*) AS n
    FROM requirements
    GROUP BY project_id, code
    HAVING COUNT(*) > 1
    ORDER BY n DESC, project_id;
  `);
  if (dupes.rowCount === 0) {
    console.log("No duplicate (project_id, code) rows — nothing to do.");
    return;
  }
  console.log(`Found ${dupes.rowCount} duplicate (project_id, code) groups:`);
  for (const r of dupes.rows) {
    console.log(`  project=${r.project_id} code=${r.code} n=${r.n}`);
  }

  const updated = await pool.query<{ id: string; project_id: string; old_code: string; new_code: string }>(`
    WITH
      ranked AS (
        SELECT id, project_id, code, created_at,
               ROW_NUMBER() OVER (PARTITION BY project_id, code ORDER BY created_at, id) AS rn
        FROM requirements
      ),
      dupes_in_project AS (
        SELECT r.id, r.project_id, r.code AS old_code,
               ROW_NUMBER() OVER (PARTITION BY r.project_id ORDER BY r.code, r.created_at, r.id) AS dup_seq
        FROM ranked r
        WHERE r.rn > 1
      ),
      cur_max AS (
        SELECT project_id,
               COALESCE(MAX(
                 CASE WHEN SPLIT_PART(code, '-', 2) ~ '^[0-9]+$'
                      THEN SPLIT_PART(code, '-', 2)::int
                      ELSE 0 END
               ), 0) AS max_n,
               (SELECT SPLIT_PART(MIN(r2.code), '-', 1)
                  FROM requirements r2
                  WHERE r2.project_id = r.project_id) AS prefix
        FROM requirements r
        GROUP BY project_id
      ),
      new_codes AS (
        SELECT d.id,
               d.old_code,
               c.prefix || '-' || LPAD((c.max_n + d.dup_seq)::text, 4, '0') AS new_code
        FROM dupes_in_project d
        JOIN cur_max c ON c.project_id = d.project_id
      )
    UPDATE requirements r
    SET code = nc.new_code,
        external_id = CASE WHEN r.external_id = nc.old_code THEN nc.new_code ELSE r.external_id END,
        updated_at = NOW()
    FROM new_codes nc
    WHERE r.id = nc.id
    RETURNING r.id, r.project_id, nc.old_code, r.code AS new_code;
  `);
  console.log(`Renumbered ${updated.rowCount ?? 0} duplicate row(s).`);

  const verify = await pool.query(`
    SELECT project_id, code, COUNT(*) AS n
    FROM requirements
    GROUP BY project_id, code
    HAVING COUNT(*) > 1;
  `);
  if ((verify.rowCount ?? 0) > 0) {
    console.error("Backfill incomplete — duplicates remain:", verify.rows);
    process.exit(1);
  }
  console.log("All (project_id, code) pairs are now unique. Safe to add the unique index.");
}

main()
  .then(() => pool.end())
  .catch((err) => {
    console.error(err);
    pool.end().finally(() => process.exit(1));
  });
