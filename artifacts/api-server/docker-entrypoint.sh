#!/bin/sh
set -e

echo "[entrypoint] applying database schema (drizzle-kit push)..."
pnpm --filter @workspace/db run push

echo "[entrypoint] starting API server on port ${PORT:-8080}..."
exec node --enable-source-maps artifacts/api-server/dist/index.mjs
