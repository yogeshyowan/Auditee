# Auditee

**AI-native enterprise platform for the Product Development Lifecycle (PDLC).**

Auditee unifies fragmented requirements, source code, defect trackers, and compliance audits into a single living knowledge graph — so engineering and quality teams can ship regulated products faster, prove conformance continuously, and never lose traceability between "what we said we'd build" and "what we actually built."

---

## Table of contents

1. [What problem Auditee solves](#what-problem-auditee-solves)
2. [Who it's for](#who-its-for)
3. [Product surface — the marketing site](#product-surface--the-marketing-site)
4. [Product surface — the application](#product-surface--the-application)
5. [Core concepts](#core-concepts)
6. [The connector ecosystem](#the-connector-ecosystem)
7. [The AI layer](#the-ai-layer)
8. [Compliance frameworks supported](#compliance-frameworks-supported)
9. [Technical architecture](#technical-architecture)
10. [Data model](#data-model)
11. [Repository layout](#repository-layout)
12. [Local development](#local-development)
13. [Search-engine + social setup](#search-engine--social-setup)
14. [Deployment & domain](#deployment--domain)
15. [Roadmap notes](#roadmap-notes)

---

## What problem Auditee solves

In any team building regulated, safety-critical, or audited software (medical devices, automotive ECUs, avionics, fintech, security software), the same five problems recur:

1. **Requirements fragmentation.** Specs live in IBM DOORS, Jama, Polarion, codeBeamer, Helix RM, Visure, ReqIF files, Confluence pages, Jira tickets, and Word docs — none of which talk to each other.
2. **Code disconnect.** No automatic link between "this requirement" and "this commit / this file / this test". Traceability matrices are maintained by hand and stale within a sprint.
3. **Audit pain.** ASPICE, ISO 26262, IEC 62304, FDA QMSR, SOC 2, HIPAA, CMMI audits each require recreating evidence packets from scratch, often weeks of senior-engineer time per audit cycle.
4. **Defect noise.** Bugs sit in Jira / Azure DevOps / Bugzilla / ServiceNow / Linear / GitHub Issues / GitLab Issues, with no link back to the requirements or controls they violate.
5. **Legacy black boxes.** Decades-old code (often the most safety-critical) has no written requirements at all — knowledge lives in the heads of engineers who left years ago.

Auditee ingests all of it, builds a graph, and lets the AI answer "what does this codebase do, where is it non-compliant, and what evidence do I have?" in plain English.

---

## Who it's for

- **Quality / Regulatory engineers** running ASPICE, ISO 26262, IEC 62304, CMMI, FDA QMSR, SOC 2, HIPAA, IEC 62443 audits.
- **Systems engineers** maintaining a requirements baseline across DOORS / Jama / Polarion / codeBeamer / Helix RM / Visure.
- **Engineering managers** of regulated software teams who need real traceability without forcing engineers to update a separate ALM tool.
- **CTOs / VPs of Engineering** modernising a legacy codebase whose original specs are lost.
- **Compliance / GRC teams** who want continuous evidence collection rather than once-a-year audit panic.

---

## Product surface — the marketing site

Lives at `/` and is a single-page React landing site with these sections:

- **Hero** — value prop, CTA, animated network illustration.
- **The problem** — the five fragmentation pain-points above.
- **The product** — knowledge graph, AI audit, traceability, CAPA, recurring audits.
- **Compliance grid** — the standards Auditee audits against (visual logos / cards).
- **ROI section** — "weeks → hours" framing with concrete numbers.
- **Demo CTA** — name / email / company / message form that POSTs to `/api/demo-requests` and persists to the `demo_requests` table.

The site is fully indexable: long-form `<title>`, comprehensive meta description + keywords, canonical link, theme color, mobile-app meta, Open Graph + Twitter Card tags pointing at `/opengraph.jpg` (1200×630), three JSON-LD blocks (`SoftwareApplication`, `Organization`, `WebSite`), `<noscript>` fallback content, `robots.txt`, `sitemap.xml`. See [§13](#search-engine--social-setup) for details.

---

## Product surface — the application

Lives under `/app/*` and is **excluded from search-engine indexing** (project names and customer-confidential info). The left-side navigation is ordered around the natural workflow:

| # | Page | What it does |
|---|---|---|
| 1 | **Project Sources** | The landing page. Connect repos, RM tools, defect trackers, document uploads. Nothing else works without sources, so this is first. |
| 2 | **Requirements** | Browse, filter (by source / external system / manual), edit (dialog or sheet), and create requirements. Imported rows show a `SourceBadge` linking back to their RM tool of origin. |
| 3 | **Traceability** | SVG graph linking requirements ↔ code artifacts ↔ tests ↔ defects. "Analyze code" lets the AI classify a snippet against existing requirements and auto-create the link. |
| 4 | **Compliance** | Cards per framework + multi-framework "Run audit" launcher. |
| 5 | **Compliance detail** | Per-framework controls table with verdicts, native rating overlay (CL0–CL5 / ASIL / ML / DAL / Tier / Conformant…), and "Run AI audit" action. |
| 6 | **CAPA Actions** | Corrective + Preventive Action register with a Standard dropdown filter (ISO 27001, ASPICE, CMMI, NIST CSF…) and per-row framework badges. |
| 7 | **AI Reports** | Templated narrative reports for any framework — exec summary, gap analysis, evidence appendix. |
| 8 | **Workflows** | Configurable PDLC workflow definitions (state machines for requirements / defects / change requests). |
| 9 | **Analytics** | Dashboards: requirements coverage, audit pass-rate over time, CAPA ageing, defect throughput. |
| 10 | **Recurring Audits** | Scheduler — "run an ISO 26262 audit on Project X every Monday at 06:00 UTC, notify me on regression." |
| 11 | **Legacy** | Drop in legacy code, get implicit requirements + risks extracted; optionally save them as real requirements. |
| 12 | **Activity** | Append-only event log of every ingestion, audit, edit, and notification. |
| 13 | **Dashboard** | Roll-up view; intentionally last because it's only meaningful after data has been ingested. |

**Ask Auditee** is intentionally *not* in the sidebar — it lives as a floating pill button (bottom-right of every app page) that opens a quick-chat sheet. Backed by the same `useAskAuditee` hook as the dedicated `/app/ask` page, with confidence badge + citations per answer.

**Project switcher** sits at the top of the sidebar. Disabled (greyed) projects are ones with zero connected sources — clicking them deep-links to Sources with a "connect your first source" CTA. There's a "+ New project" item at the bottom of the dropdown that opens a CreateProjectDialog.

---

## Core concepts

| Concept | What it is |
|---|---|
| **Project** | A product or product line. Top-level scope for everything else. Identified by `proj-<slug>`. |
| **Source** | A connected upstream system or upload. Has a kind (github, doors_next, jira, reqif, …), a config blob, and a status. |
| **Requirement** | A normalised requirement row. Carries provenance columns (`sourceId`, `externalId`, `externalUrl`, `externalSystem`) so we can trace it back to its upstream tool. |
| **Code artifact** | A file / module / snippet ingested from a source-code source. |
| **Traceability link** | An `(implements / tests / violates / supersedes)` edge between requirements and code artifacts. |
| **Compliance framework** | A standard (ISO 26262, ASPICE 4.0, CMMI 3.0, SOC 2, HIPAA, IEC 62304, FDA QMSR…). |
| **Compliance control** | An individual clause inside a framework. Audited verdict is `met / partial / gap`. |
| **CAPA** | Corrective and Preventive Action. Generated from audit gaps, scoped by framework. |
| **Defect** | A bug pulled from a defect tracker, scoped to a source, de-duped on `(project_id, source_id, external_id)`. |
| **Audit** | A run of the AI compliance auditor against `(project, framework)` — produces verdicts, recommendations, and a deterministic native-rating overlay. |
| **Recurring audit** | A scheduled audit; the scheduler in `lib/scheduler.ts` triggers them on a cron interval. |
| **Knowledge graph** | The implicit network formed by requirements ↔ code ↔ defects ↔ controls ↔ CAPAs. The AI traverses this graph for "Ask Auditee" answers and audit reasoning. |

---

## The connector ecosystem

### Source code
- **GitHub** — public/private repos via REST. Personal access token strongly recommended (Replit's shared egress IP exhausts GitHub's 60 anonymous calls / hr quickly; a token raises that to 5,000 / hr).
- **ZIP archive** — upload a `.zip` of any codebase.
- **Project folder** — drag a whole folder from your machine (browser permitting).

### Requirements management
A dedicated section on Sources, dispatched in `lib/rm-ingestion.ts`. All HTTP fetches go through `lib/safe-fetch.ts` (SSRF-guarded — refuses private IPs, link-local, metadata endpoints).

| Tool | Kind | Auth |
|---|---|---|
| IBM DOORS Classic | `doors` | ReqIF upload (DOORS Classic has no usable network API) |
| IBM DOORS Next | `doors_next` | OSLC root URL + project area + bearer token |
| Jama Connect | `jama` | host + projectId + access token |
| Siemens Polarion | `polarion` | host + projectId + bearer token |
| Intland codeBeamer | `codebeamer` | host + trackerId + token |
| Perforce Helix RM | `helix_rm` | host + projectId + token |
| Visure | `visure` | host + projectKey + token |
| Azure DevOps Boards | `azure_devops` | org URL + project + PAT + WIQL |
| Jira (requirements) | `jira_reqs` | host + projectKey + token + JQL |
| Generic ReqIF | `reqif` | `.reqif` / `.reqifz` upload (vendor-neutral) |

Imported rows are de-duped by a partial unique index on `(project_id, source_id, external_id)` so re-syncs upsert in place.

### Defect management
A second connector section, dispatched in `lib/defect-ingestion.ts`.

`jira_defects`, `ado_defects` (Azure DevOps Bugs via WIQL), `bugzilla`, `mantis`, `redmine`, `youtrack`, `clickup`, `linear`, `servicenow`, `alm_octane`, `github_issues`, `gitlab_issues`.

Defects are pulled into the `defects` table and fed into the audit prompt as input #4 ("Defects from connected defect-management tools — cite by ticket key when they prove or disprove a control"). Deleting a source cascades the deletion of its defect rows.

### Documents
Generic upload — PDFs, Word, plain text. Used as evidence in audits.

---

## The AI layer

All AI endpoints live under `/api/ai/*` and intentionally bypass the OpenAPI codegen pipeline (they have looser, evolving schemas). The frontend calls them via thin `useMutation` wrappers in `artifacts/eltegra-site/src/lib/ai-api.ts`.

| Endpoint | Purpose | UI entry point |
|---|---|---|
| `POST /api/ai/generate-requirements` | Drafts BRDs / PRDs / FRDs / NFRs from a brief, persists to a project. | Requirements page → "Generate from brief" |
| `POST /api/ai/analyze-code` | Classifies which existing requirements a code snippet implements / tests / violates, creates the code artifact + traceability links. | Traceability page → "Analyze code" |
| `POST /api/ai/compliance-audit` | Control-by-control audit of a project against a framework, returns verdicts + recommendations. | Compliance detail → "Run AI audit" |
| `POST /api/ai/legacy-extract` | Pulls implicit requirements + risks out of legacy code, optionally saves them. | Legacy page → "Extract requirements" |
| `POST /api/ai/ask` | Natural-language Q&A across project context. Conversations persist server-side in `ai_conversations`, scoped by `projectId`. | `/app/ask` and the floating Ask Auditee sheet |
| `GET /api/ai/ask/history?projectId=…&limit=50` | List saved Q&A history (newest first). | Ask page sidebar |
| `DELETE /api/ai/ask/history/:id` | Remove a saved conversation. | Ask page sidebar |

**Provider:** OpenAI via Replit AI Integrations (proxy — no API key required). Model: `gpt-5.2`, JSON mode for structured outputs.

**Standard-native audit ratings.** On top of the universal verdict (`strong / adequate / weak / failing`) and per-control verdicts (`met / partial / gap`), every audit returns a `nativeRating` block in the audited framework's own vocabulary:

| Framework | Native vocabulary |
|---|---|
| ISO/IEC 27001 | Conformant / Observation / Minor NC / Major NC |
| ASPICE 4.0 / Cybersecurity 2.0 | Capability Levels CL0–CL5 with N/P/L/F per process |
| CMMI 3.0 | Maturity Level 1–5 |
| NIST CSF 2.0 | Implementation Tiers 1–4 |
| IEC 61508 | SIL claim limit |
| IEC 62304 | Software Safety Class A/B/C |
| IEC 62443 | ML / SL pair |
| ISO 26262 | ASIL QM/A/B/C/D |
| DO-178C | DAL A/B/C/D/E + Satisfied / Partially-Satisfied / Not-Satisfied |
| FDA 21 CFR Part 11, GDPR, HIPAA, PCI-DSS, SOC 2 | Industry-standard conformity verdicts |

The mapping lives in `artifacts/api-server/src/lib/framework-rating.ts` and is computed **deterministically** from `compliancePercentage` + per-control verdicts (no extra LLM call). The endpoint spreads `...result` first and assigns `nativeRating` last, so the LLM cannot overwrite the deterministic overlay. The UI renders the rating as an indigo badge next to the universal verdict, an indigo highlight panel describing the scheme, a "Native rating" column in the per-control table, and an extra column in the Markdown export.

---

## Compliance frameworks supported

Out-of-the-box framework + control libraries (seeded by `scripts/src/seed.ts`):

- **Automotive:** ASPICE 4.0, ASPICE Cybersecurity 2.0, ISO 26262
- **Medical:** IEC 62304, FDA 21 CFR Part 820 / QMSR, ISO 13485
- **Avionics:** DO-178C
- **Industrial / functional safety:** IEC 61508, IEC 62443
- **Process maturity:** CMMI 3.0
- **Information security / privacy:** ISO/IEC 27001, NIST CSF 2.0, SOC 2, HIPAA, GDPR, PCI-DSS
- **Records / e-signature:** FDA 21 CFR Part 11

Adding a new framework is just two seed inserts (one row in `compliance_frameworks`, N rows in `compliance_controls`) — the audit runner is framework-agnostic.

---

## Technical architecture

**Stack.** TypeScript everywhere. pnpm workspaces monorepo. Node.js 24.

**Frontend (`artifacts/eltegra-site`)** — React + Vite + TailwindCSS + shadcn/ui + wouter for routing + TanStack Query for data + Framer Motion for animation. The marketing landing page and the signed-in app share a single Vite build with two route trees (`/` and `/app/*`).

**API server (`artifacts/api-server`)** — Express 5 + Pino structured logging + Drizzle ORM. Built with esbuild into a single CJS bundle. All routes live under `/api/*`.

**Database** — PostgreSQL via Drizzle ORM. Schema is the source of truth; migrations done via `drizzle-kit push`.

**API spec (`lib/api-spec`)** — OpenAPI 3 spec is the source of truth for CRUD endpoints. Orval generates `lib/api-zod` (Zod schemas) and `lib/api-client-react` (TanStack Query hooks). AI endpoints intentionally bypass codegen.

**Validation** — Zod (`zod/v4`) and `drizzle-zod` to derive request/response schemas from the DB schema.

**Networking safety** — All outbound fetches go through `artifacts/api-server/src/lib/safe-fetch.ts`, which DNS-resolves the target and refuses private IPs, link-local, loopback, and cloud-metadata endpoints. Prevents SSRF attacks via user-supplied connector URLs.

**Background work** — `lib/scheduler.ts` runs the recurring-audit cron loop in-process at server start. No external job queue needed for current scale.

**AI proxy** — `lib/integrations-openai-ai-server` (Replit AI Integrations proxy, no API key required).

---

## Data model

15 tables in `lib/db/src/schema/`:

| Table | Purpose |
|---|---|
| `projects` | Top-level container (id `proj-<slug>`). |
| `project_sources` | Connected upstream systems (kind, config JSON, status). |
| `requirements` | Normalised requirements (with `sourceId`, `externalId`, `externalUrl`, `externalSystem` provenance columns). |
| `code_artifacts` | Files / modules ingested from code sources. |
| `traceability_links` | Edges: `(requirement_id ↔ code_artifact_id, kind)`. |
| `compliance_frameworks` | ISO 26262, ASPICE, CMMI, etc. |
| `compliance_controls` | Individual clauses within each framework. |
| `capa_actions` | CAPAs scoped to a framework + project. |
| `defects` | Bugs pulled from defect trackers, scoped to a source. |
| `legacy_systems` | Legacy codebases dropped in for requirement-extraction. |
| `pdlc_stages` | Project lifecycle stages (Plan / Design / Build / Verify / Release). |
| `workflows` | State-machine definitions for requirements / defects / change requests. |
| `recurring_audits` | Scheduled audits (cron expression + last/next run). |
| `activity_events` | Append-only event log. |
| `notifications` | Per-user notification queue. |
| `comments` | Threaded comments on requirements / controls / CAPAs. |
| `ai_conversations` | Persisted Q&A history for Ask Auditee. |
| `ai_reports` | Saved narrative reports. |
| `demo_requests` | Marketing-site demo requests. |

Relationships are enforced with foreign keys + cascade deletes (deleting a source cascades to its requirements and defects; deleting a project cascades to everything).

---

## Repository layout

```
/
├── artifacts/
│   ├── eltegra-site/            React + Vite frontend (landing + app pages)
│   ├── api-server/              Express API mounted at /api
│   └── mockup-sandbox/          Vite preview server for UI prototyping
├── lib/
│   ├── db/                      Drizzle schemas + migration tooling
│   ├── api-spec/                OpenAPI source of truth + Orval codegen
│   ├── api-zod/                 Generated Zod schemas (do not edit)
│   ├── api-client-react/        Generated TanStack Query hooks (do not edit)
│   ├── integrations-openai-ai-server/   Replit AI Integrations proxy client
│   └── ui/                      Shared shadcn/ui components
├── scripts/
│   └── src/seed.ts              Seeds 3 projects, 22 reqs, 6 frameworks…
├── package.json                 pnpm workspace root
├── pnpm-workspace.yaml
├── replit.md                    Workspace + project notes (always loaded by the agent)
└── ABOUT.md                     This file
```

---

## Local development

Prerequisites: Node 24, pnpm.

```bash
# install everything
pnpm install

# typecheck the whole monorepo
pnpm run typecheck

# build everything
pnpm run build

# regen API hooks + Zod schemas after editing the OpenAPI spec
pnpm --filter @workspace/api-spec run codegen

# push DB schema (dev only)
pnpm --filter @workspace/db run push

# seed the database
pnpm --filter @workspace/scripts run seed

# run the API server
pnpm --filter @workspace/api-server run dev

# run the frontend
pnpm --filter @workspace/eltegra-site run dev
```

The three workflows (`API Server`, `web`, `Component Preview Server`) are pre-configured in the Replit workspace and started automatically.

**Required env vars**

- `DATABASE_URL` — Postgres connection string (provisioned automatically by Replit).
- `SESSION_SECRET` — used for session signing (provisioned automatically).

No third-party API keys are required — the OpenAI calls go through the Replit AI Integrations proxy.

---

## Search-engine + social setup

The marketing site is fully optimised for search and social:

- `index.html` carries a long-form `<title>`, comprehensive `<meta description>`, keyword list, canonical link, theme color, mobile-app meta, and a `<noscript>` block with crawlable copy.
- Open Graph + Twitter Card tags reference `/opengraph.jpg` (1200×630).
- Three JSON-LD blocks (`SoftwareApplication`, `Organization`, `WebSite`) describe the product, features, and offer to search engines.
- `public/robots.txt` allows crawling of marketing pages, disallows `/app/*`, blocks the major LLM training scrapers (GPTBot, ClaudeBot, anthropic-ai, CCBot, Google-Extended), and points to the sitemap.
- `public/sitemap.xml` lists the canonical homepage with image entries.
- The signed-in app (`AppLayout`) injects a `<meta name="robots" content="noindex, nofollow, noarchive, nosnippet">` while mounted, so even if a crawler ignores robots.txt the per-page directive still suppresses indexing.

**Canonical hostname** is `https://auditee.site/` (DNS for `auditee.site` points to the production deployment). The hostname is centralised in `artifacts/eltegra-site/src/components/SEO.tsx` (`SITE_URL`), `artifacts/eltegra-site/scripts/generate-sitemap.mjs` (`SITE`), `artifacts/eltegra-site/index.html` (canonical / OG / JSON-LD URLs), `artifacts/eltegra-site/public/robots.txt` (Sitemap line), and the CORS allowlist in `artifacts/api-server/src/app.ts`. To change the hostname later, search-and-replace across those files and re-run the sitemap generator.

---

## Deployment & domain

The project is built to deploy on Replit. The frontend is served from the Vite build, and the API server is deployed alongside it under `/api/*`.

After deployment:
1. Update the canonical URL in `index.html` / `robots.txt` / `sitemap.xml` to the production domain.
2. Submit the sitemap to **Google Search Console** and **Bing Webmaster Tools** to accelerate indexing.
3. Verify Open Graph rendering on **LinkedIn Post Inspector**, **Twitter Card Validator**, and **iMessage** before any major social campaign.

---

## Roadmap notes

These are observed gaps in the current build, not committed work:

- **Authentication** is not wired up (out of scope for the demo build). The signed-in app is reachable by anyone who knows the `/app/*` URL — fine for demos, must be addressed before production.
- **Multi-tenancy** — there is no `org_id` column anywhere yet. All data lives in a single tenant.
- **Audit log retention** — `activity_events` grows unbounded. Needs a rotation/archive policy at scale.
- **Connector breadth** — the marketing site lists ALM Octane, ServiceNow, etc. as defect connectors; some of those have minimal field coverage and would benefit from a dedicated polish pass.
- **Webhook ingestion** — sources are currently pull-only (sync on demand or on cron). Push (webhook) ingestion would shorten the freshness window for DOORS Next, Jira, and GitHub.
