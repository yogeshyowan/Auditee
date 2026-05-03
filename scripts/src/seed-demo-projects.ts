/**
 * CLI wrapper for the demo-projects seed.
 *
 * The actual seed logic lives in `lib/db/src/demo-seed.ts` so that both this
 * CLI and the api-server's startup bootstrap can call it.
 *
 * Run via:  pnpm --filter @workspace/scripts run seed:demo
 */
import { seedDemoProjects } from "@workspace/db";

seedDemoProjects()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
