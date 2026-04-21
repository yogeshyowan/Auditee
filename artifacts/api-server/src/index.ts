import app from "./app";
import { logger } from "./lib/logger";
import { bootstrapFrameworks } from "./lib/bootstrap-frameworks";

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
});
