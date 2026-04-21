# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Project: EltegraAI

AI-native enterprise platform for Product Development Lifecycle (PDLC) management.
Marketing landing page lives at `/` and the functional app lives under `/app/*`.

### Artifacts
- `artifacts/eltegra-site` — React + Vite frontend (landing + app pages)
- `artifacts/api-server` — Express API mounted at `/api`
- `lib/db` — Drizzle schemas (10 tables: projects, requirements, codeArtifacts,
  traceabilityLinks, complianceFrameworks, complianceControls, activityEvents,
  pdlcStages, legacySystems, demoRequests)
- `lib/api-spec` — OpenAPI source of truth; codegen produces api-zod and api-client-react
- `scripts/src/seed.ts` — seeds 3 projects, 22 requirements, 6 frameworks/16 controls,
  5 legacy systems, 12 code artifacts, traceability links, PDLC stages, and activity events.
  Run with `pnpm --filter @workspace/scripts run seed`.

### App pages (under `/app`)
Dashboard, Requirements (CRUD via dialog/sheet), Traceability (SVG graph),
Compliance (cards) + ComplianceDetail (controls table), PDLC pipeline,
Legacy systems, Activity timeline. State: `useProjectContext` from
`src/lib/project-context.tsx`.

### AI features (powered by OpenAI via Replit AI Integrations)
All AI endpoints live under `/api/ai/*` and intentionally bypass the OpenAPI
codegen pipeline; the frontend calls them via thin `useMutation` wrappers in
`artifacts/eltegra-site/src/lib/ai-api.ts`.

- `POST /api/ai/generate-requirements` — drafts BRDs/PRDs/FRDs/NFRs from a brief, persists to a project (UI: Requirements page → "Generate from brief").
- `POST /api/ai/analyze-code` — given a code snippet, classifies which existing requirements it implements/tests/violates, creates the code artifact and traceability links (UI: Traceability page → "Analyze code").
- `POST /api/ai/compliance-audit` — runs a control-by-control audit of a project against a framework, returns verdicts + recommendations (UI: ComplianceDetail → "Run AI audit").
- `POST /api/ai/legacy-extract` — pulls implicit requirements + risks out of legacy code, optionally saves them to a project (UI: Legacy page → "Extract requirements").
- `POST /api/ai/ask` — natural-language Q&A across project context (UI: `/app/ask`). Conversations persist server-side in the `ai_conversations` table and are scoped by `projectId` when one is selected.
- `GET /api/ai/ask/history?projectId=...&limit=50` — list saved Q&A history (newest first).
- `DELETE /api/ai/ask/history/:id` — remove a saved conversation.

Provider client lives at `lib/integrations-openai-ai-server` (Replit AI Integrations
proxy — no API key required). Model: `gpt-5.2` (JSON mode for structured outputs).

### Notes
- API endpoints live under `/api/*`. CRUD endpoints have generated Orval hooks; AI endpoints use the small wrapper in `src/lib/ai-api.ts`.
- No authentication is currently configured (out of scope for the demo build).
