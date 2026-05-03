import app from "./app";
import { logger } from "./lib/logger";
import { bootstrapFrameworks } from "./lib/bootstrap-frameworks";
import { bootstrapGapRequirements } from "./lib/bootstrap-gap-requirements";
import { bootstrapDemoProjects } from "./lib/bootstrap-demo-projects";
import { backfillUnforwardedLeads } from "./lib/leadCaptureBackfill";
import { startScheduler } from "./lib/scheduler";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // Idempotently ensure built-in process frameworks (ASPICE 4.0, CMMI 3.0) exist.
  // Runs in the background so it never blocks request handling.
  void bootstrapFrameworks();
  void bootstrapGapRequirements();
  // Idempotently ensure the built-in demo projects (with full per-module
  // sample data) exist so every new workspace sees them in the project picker.
  void bootstrapDemoProjects();
  // Best-effort: flush any lead_captures rows that were stored before the
  // Google Sheet integration was wired up. No-op once everything is forwarded.
  void backfillUnforwardedLeads().catch((err) =>
    logger.error(
      { err: err instanceof Error ? err.message : String(err) },
      "lead backfill on startup failed",
    ),
  );
  startScheduler(port);
});
