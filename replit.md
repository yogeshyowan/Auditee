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

## Project: Auditee

AI-native enterprise platform for Product Development Lifecycle (PDLC) management.
Marketing landing page lives at `/` and the functional app lives under `/app/*`.

### Artifacts
- `artifacts/eltegra-site` — React + Vite frontend
  - Marketing routes: `/` (Home), `/pricing` (3-tier plans + FAQ), `/roi-calculator` (interactive sliders)
  - App routes under `/app/*`: sources, requirements, traceability, compliance,
    capa, defects, reports, workflows, analytics, recurring-audits, pdlc, legacy,
    activity, dashboard, ask
- `artifacts/api-server` — Express API mounted at `/api`
- `lib/db` — Drizzle schemas including: projects, requirements, codeArtifacts,
  traceabilityLinks, complianceFrameworks, complianceControls, capaActions,
  defects, projectSources, sourceFiles, activityEvents, aiReports, aiConversations,
  workflows, recurringAudits, pdlcStages, legacySystems, comments, notifications,
  demoRequests
- `lib/api-spec` — OpenAPI source of truth; codegen produces api-zod and api-client-react
- `scripts/src/seed.ts` — seeds 3 projects, 22 requirements, 6 frameworks/16 controls,
  5 legacy systems, 12 code artifacts, traceability links, PDLC stages, and activity events.
  Run with `pnpm --filter @workspace/scripts run seed`.

### App pages (under `/app`)
Dashboard, Project Sources (connect repos/uploads/docs + RM tools — see below),
Requirements (CRUD via dialog/sheet, plus a SourceBadge that links imported
requirements back to their RM tool of origin), Traceability (SVG graph),
Compliance (cards + multi-framework "Run audit" launcher) + ComplianceDetail
(controls table), CAPA Actions, AI Reports (templated narrative reports for any
framework), Workflows, Analytics, Recurring Audits, PDLC pipeline.

### Requirements-management connectors
The Sources page has a second "Requirements management" section that pulls real
requirements (not just code/evidence) into the Requirements table from external
RM tools. Supported kinds: `doors_next` (OSLC), `doors` (Classic — ReqIF
upload), `jama`, `polarion`, `codebeamer`, `helix_rm`, `visure`, `azure_devops`,
`jira_reqs`, plus a generic `reqif` (.reqif/.reqifz) upload. All HTTP fetches go
through `lib/safe-fetch.ts` (SSRF-guarded) and are dispatched in
`lib/rm-ingestion.ts`. Imported rows are de-duped by a partial unique index on
`(project_id, source_id, external_id)` so re-syncs upsert in place. Provenance
columns on `requirements`: `sourceId`, `externalId`, `externalUrl`,
`externalSystem`. ReqIF is uploaded via `POST /api/sources/upload-reqif`; all
other RM kinds use the standard `/api/sources` + `/api/sources/:id/sync` flow.

### SEO
The marketing site (`/`) is fully optimised for search and social:
- `index.html` carries a long-form `<title>`, comprehensive `<meta description>`,
  keyword list, canonical link, theme color, mobile-app meta, and a `<noscript>`
  block with crawlable copy.
- Open Graph + Twitter Card tags reference `/opengraph.jpg` (1200×630).
- Three JSON-LD blocks (`SoftwareApplication`, `Organization`, `WebSite`)
  describe the product, features, and offer to search engines.
- `public/robots.txt` allows crawling of marketing pages, disallows `/app/*`,
  blocks the major LLM training scrapers (GPTBot, ClaudeBot, anthropic-ai,
  CCBot, Google-Extended), and points to the sitemap.
- `public/sitemap.xml` lists the canonical homepage with image entries.
- The signed-in app (`AppLayout`) injects a `<meta name="robots"
  content="noindex, nofollow, noarchive, nosnippet">` while mounted, so even
  if a crawler ignores robots.txt the per-page directive still suppresses it.
- Canonical hostname is set to `https://auditee.eltegra.ai/`. **When the real
  production domain is decided, search-and-replace this URL across
  `index.html`, `robots.txt`, and `sitemap.xml`** — that's the only site-wide
  change needed.

### Creating new projects from the UI
Users create new projects directly from the project switcher in the sidebar
— there's a "+ New project" item at the bottom of the dropdown that opens
`components/CreateProjectDialog.tsx`. It POSTs to `/api/projects` (added in
`routes/projects.ts`), which auto-derives a unique slug from the name
(`slugify(name)` with `-2`, `-3` suffix on collision) and assigns id
`proj-<slug>`. After create, the dialog awaits the projects-list refetch
(via `getListProjectsQueryKey()` from the generated client) before calling
`setProjectId(newId)` — this matters because the auto-select effect in
`ProjectProvider` would otherwise see an unknown id and snap back to the
first connected project. The provider was also updated to keep a project
selected as long as it exists in `allProjects` (not just `connectedProjects`),
so freshly-created projects with 0 sources stay active until the user
connects their first source.

### Navigation order + floating Ask Auditee
The left-side app navigation is ordered around the natural workflow:
**Project Sources** is the landing item (top of the list) because nothing
else works without sources connected, and **Dashboard** is the last item
since it's a roll-up view that only becomes meaningful after data has been
ingested. **Ask Auditee** is intentionally removed from the sidebar and
lives instead as a floating pill button (bottom-right of every app page)
implemented in `components/AskAuditeeFloater.tsx`. Clicking the floater
opens a right-side Sheet with a minimal quick-chat — uses the same
`useAskAuditee` hook as the full page, shows confidence badge + citations
per answer, and links out to `/app/ask` for the full multi-turn experience.

### Source-aware Requirements + standard-aware CAPA filters
The Requirements page (`/app/requirements`) has a "Source" dropdown that
aggregates and filters requirements by where they came from (Manual entries
vs imported from any RM tool — DOORS, Jama, ReqIF, etc.). The options are
populated from a parallel unfiltered query of the project's requirements so
the dropdown always reflects the actual sources present. When more than one
source exists, a chip strip appears below the filters that toggles each
source on/off. Backend: `GET /api/requirements` accepts `sourceId`,
`externalSystem`, and `origin=manual` query params.

The CAPA page (`/app/capa`) has a "Standard" dropdown in the Action
register card that filters CAPAs by their framework (ISO 27001, ASPICE,
CMMI, NIST CSF, etc.). Each row also shows an indigo badge with the
framework name. Backend: `GET /api/capa` accepts a `frameworkId` query
param and the response is built via a left-join on
`complianceFrameworksTable` so each row carries `frameworkName` and
`frameworkCode`.

### Per-framework Traceability filter
The Traceability page (`/app/traceability`) has a "Standard" dropdown next
to "Analyze code" that scopes the entire graph to a single compliance
framework. Default is "All frameworks". When a framework is selected, the
endpoint `GET /api/traceability/graph?projectId=…&frameworkId=…` returns
only (a) requirements whose `linkedFrameworks` array contains that id,
(b) code artifacts traced to those requirements via `traceability_links`,
and (c) the single selected framework. The page subtitle updates to
"Tracing requirements covered by <CODE> — <NAME>." and an amber empty-state
card renders when the chosen framework has no linked requirements yet.
Filter logic lives in `routes/traceability.ts`.

### Standard-native audit ratings
On top of the universal `overallVerdict` (strong/adequate/weak/failing) and
per-control `verdict` (met/partial/gap), every compliance audit now also
returns a `nativeRating` block expressed in the audited framework's own
vocabulary. Examples: ISO/IEC 27001 → Conformant / Observation / Minor NC /
Major NC; ASPICE 4.0 / ASPICE Cybersecurity 2.0 → Capability Levels CL0–CL5
with N/P/L/F per process; CMMI 3.0 → ML 1–5; NIST CSF 2.0 → Implementation
Tiers 1–4; IEC 61508 → SIL claim limit; IEC 62304 → Software Safety Class
A/B/C; IEC 62443 → ML/SL pair; ISO 26262 → ASIL QM/A/B/C/D; DO-178C → DAL
A/B/C/D/E with Satisfied/Partially-Satisfied/Not-Satisfied; FDA 21 CFR Part
11 / GDPR / HIPAA / PCI-DSS / SOC 2 → industry-standard conformity verdicts.

The mapping lives in `artifacts/api-server/src/lib/framework-rating.ts` and
is computed deterministically from `compliancePercentage` + per-control
verdicts (no extra LLM call). The endpoint spreads `...result` first and
assigns `nativeRating` last so the LLM cannot overwrite the deterministic
overlay. The UI renders the rating as an indigo badge next to the existing
verdict, an indigo highlight panel describing the scheme, a "Native rating"
column in the per-control table, and an extra column in the Markdown export.

### Defect-management connectors
The Sources page also has a "Defect management" section that pulls real bugs
into a `defects` table from external trackers. Supported kinds: `jira_defects`,
`ado_defects` (Azure DevOps Bugs via WIQL), `bugzilla`, `mantis`, `redmine`,
`youtrack`, `clickup`, `linear`, `servicenow`, `alm_octane`, `github_issues`,
`gitlab_issues`. All HTTP fetches go through `lib/safe-fetch.ts` and are
dispatched in `lib/defect-ingestion.ts` via `ingestDefectsTool`. Imported rows
are de-duped by a partial unique index on `(project_id, source_id, external_id)`.
The compliance audit prompt in `routes/ai.ts` loads defects scoped to the
sources included in the run, summarises totals + samples up to 25 most
severe/oldest, and feeds them as input #4 ("Defects from connected
defect-management tools — cite by ticket key when they prove or disprove a
control"). Deleting a source cascades the deletion of its defect rows.

State: `useProjectContext` from `src/lib/project-context.tsx` — exposes
`connectedProjects` (sourceCount > 0) which is what the sidebar dropdown
surfaces; unconnected projects are shown disabled with a CTA to Sources.

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
- `POST /api/ai/gap-analysis` — Missing Requirements Analysis. Loads a project's full requirements set (and optionally a selected compliance framework's controls) and returns structured findings: missing requirements (categorised: security / compliance / accessibility / performance / error_handling / observability / data / ux / other), duplicates, conflicts, and improvement recommendations. UI: `/app/gaps` (sidebar: "Gap Detection").
- `POST /api/ai/gap-analysis/promote` — turns one missing-requirement finding into a real `requirements` row with `tags = ["gap-analysis", <category>]`. Category is allowlisted server-side against the same enum the analysis prompt is permitted to emit.
- `POST /api/ai/estimate-effort` — per-requirement man-hour estimates (with complexity classification + risks) and project-total roll-up (hours + weeks-at-1-FTE + complexity breakdown). Designed for the Requirements page bulk-estimate action.

Provider client lives at `lib/integrations-openai-ai-server` (Replit AI Integrations
proxy — no API key required). Model: `gpt-5.2` (JSON mode for structured outputs).

### AI document generators (Reports)
- `POST /api/reports/generate` accepts kinds: `compliance_audit`, `requirements_summary`, `traceability`, `exec_brief`, `brd`, `prd`, `frd`, `test_cases`. Each kind has a canonical section blueprint in `KIND_BLUEPRINT` (artifacts/api-server/src/routes/reports.ts) that drives the LLM prompt. Reports auto-export to DOCX/PDF/HTML.
- The Requirements page (`/app/requirements`) exposes all 4 document types — BRD, PRD, FRD and Test Cases — through a single "Generate AI document" dropdown.
- `OPENROUTER_MAX_TOKENS_CAP = 8192` (parity with default `jsonCompletion` maxTokens). Reports explicitly request `maxTokens: 12288` to leave headroom for multi-section docs.

### Marketing pages
- `/` Home — landing with NAV_GROUPS for Platform / Solutions / Resources / Company. Internal `/`-routes use Wouter `Link` (client-side); hashed deep-links (e.g. `/about#careers`) use raw `<a>` so the browser performs native anchor scrolling.
- `/features` — comprehensive platform feature page (12 feature cards each linking to its app route, four AI-native capabilities strip, role-based outcomes for Product Owner / Business Analyst / QA & Compliance, demo CTAs).
- `/pricing`, `/roi-calculator`, `/about`, `/contact` — full marketing pages registered in `App.tsx`. The Contact form posts to the existing `POST /api/demo-requests` endpoint with the reason prefixed into the message body.

### Notes
- API endpoints live under `/api/*`. CRUD endpoints have generated Orval hooks; AI endpoints use the small wrapper in `src/lib/ai-api.ts`.
- No authentication is currently configured (out of scope for the demo build).
