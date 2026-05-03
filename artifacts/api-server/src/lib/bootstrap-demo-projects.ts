import { seedDemoProjects } from "@workspace/db";
import { logger } from "./logger";

/**
 * Idempotently ensures the built-in demo workspace + 14 demo projects (with
 * full per-module sample data for the 6 anchor projects) exist in the
 * database. Safe to run on every server boot — the underlying seed uses
 * deterministic IDs and ON CONFLICT DO NOTHING.
 *
 * Skipped when AUDITEE_SKIP_DEMO_SEED is set (useful for ephemeral test envs).
 */
export async function bootstrapDemoProjects(): Promise<void> {
  if (process.env["AUDITEE_SKIP_DEMO_SEED"]) {
    logger.info("AUDITEE_SKIP_DEMO_SEED set — skipping demo project seed");
    return;
  }
  try {
    await seedDemoProjects();
    logger.info("demo projects bootstrap complete");
  } catch (err) {
    logger.error(
      { err: err instanceof Error ? err.message : String(err) },
      "demo projects bootstrap failed (non-fatal)",
    );
  }
}
