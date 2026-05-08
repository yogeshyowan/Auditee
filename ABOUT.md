# Auditee

**AI-native enterprise platform for the Product Development Lifecycle (PDLC).**

Auditee unifies fragmented requirements, source code, defect trackers, tests, and compliance audits into a single living knowledge graph — so engineering and quality teams can ship regulated products faster, prove conformance continuously, and never lose traceability between "what we said we'd build" and "what we actually built."

Live at **[https://auditee.site](https://auditee.site)**.

---

## Table of contents

1. [What problem Auditee solves](#what-problem-auditee-solves)
2. [Who it's for](#who-its-for)
3. [Product surface — the marketing site](#product-surface--the-marketing-site)
4. [Product surface — the application](#product-surface--the-application)
5. [Auxiliary artifacts (tutorial video, sales deck)](#auxiliary-artifacts-tutorial-video-sales-deck)
6. [Core concepts](#core-concepts)
7. [Plans, billing & enterprise features](#plans-billing--enterprise-features)
8. [The connector ecosystem](#the-connector-ecosystem)
9. [The AI layer](#the-ai-layer)
10. [Compliance frameworks supported](#compliance-frameworks-supported)
11. [Authentication, RBAC & multi-tenancy](#authentication-rbac--multi-tenancy)
12. [Operator overrides (test/founder accounts)](#operator-overrides-testfounder-accounts)
13. [Technical architecture](#technical-architecture)
14. [Data model](#data-model)
15. [Repository layout](#repository-layout)
16. [Local development](#local-development)
17. [Search-engine + social setup](#search-engine--social-setup)
18. [Deployment & domain](#deployment--domain)
19. [Roadmap notes](#roadmap-notes)

---

## What problem Auditee solves

In any team building regulated, safety-critical, or audited software (medical devices, automotive ECUs, avionics, fintech, security software, industrial automation, rail), the same five problems recur:

1. **Requirements fragmentation.** Specs live in IBM DOORS, Jama, Polarion, codeBeamer, Helix RM, Visure, ReqIF files, Confluence pages, Jira tickets, and Word docs — none of which talk to each other.
2. **Code disconnect.** No automatic link between "this requirement" and "this commit / this file / this test". Traceability matrices are maintained by hand and stale within a sprint.
3. **Audit pain.** ASPICE, ISO 26262, IEC 62304, FDA QMSR, SOC 2, HIPAA, CMMI, ISO 21434, UN R155 audits each require recreating evidence packets from scratch — often weeks of senior-engineer time per audit cycle.
4. **Defect noise.** Bugs sit in Jira / Azure DevOps / Bugzilla / ServiceNow / Linear / GitHub Issues / GitLab Issues, with no link back to the requirements or controls they violate.
5. **Legacy black boxes.** Decades-old code (often the most safety-critical) has no written requirements at all — knowledge lives in the heads of engineers who left years ago.

Auditee ingests all of it, builds a graph, and lets the AI answer "what does this codebase do, where is it non-compliant, what evidence do I have, and what's the corrective action?" in plain English — then turns the answers into signed audit packets.

---

## Who it's for

- **Quality / Regulatory engineers** running ASPICE, ISO 26262, IEC 62304, CMMI, FDA QMSR, SOC 2, HIPAA, IEC 62443, ISO 21434, UN R155 audits.
- **Systems engineers** maintaining a requirements baseline across DOORS / Jama / Polarion / codeBeamer / Helix RM / Visure.
- **Engineering managers** of regulated software teams who need real traceability without forcing engineers to update a separate ALM tool.
- **CTOs / VPs of Engineering** modernising a legacy codebase whose original specs are lost.
- **Compliance / GRC teams** who want continuous evidence collection rather than once-a-year audit panic.
- **Enterprise IT / SecOps** integrating Auditee with their IdP (SSO/SAML/OIDC/SCIM), SIEM, and audit-log retention policy.

---

## Product surface — the marketing site

Lives at `/` (artifact: `artifacts/eltegra-site`) — a multi-page React landing site with these key sections / routes:

- **Home** — value prop, CTA, animated network illustration, problem framing, product framing, ROI.
- **Demo Videos** (`/demo-videos`) — gallery of 17 narrated module tutorials, plus the long-form **ASPICE 4.0 walkthrough** (`?aspice=1`) and the **full tour** (`?full=1`).
- **Pricing** (`/pricing`) — free / standard / professional / enterprise tiers with Razorpay-backed checkout.
- **Contact / Demo request** — form that POSTs to `/api/demo-requests` and persists to `demo_requests`. Lead-capture also syncs to a Google Sheet (see Connectors).
- **Compliance grid** — the standards Auditee audits against (visual logos / cards).
- **Prompt Library** — curated prompt templates for engineering / compliance work.
- **Authentication** — Sign in / Sign up via Clerk; new users are auto-bootstrapped into a free workspace as `owner`.

The site is fully indexable: long-form `<title>`, comprehensive meta description + keywords, canonical link, theme color, mobile-app meta, Open Graph + Twitter Card tags pointing at `/opengraph.jpg` (1200×630), three JSON-LD blocks (`SoftwareApplication`, `Organization`, `WebSite`), `<noscript>` fallback content, `robots.txt`, `sitemap.xml`. See [§17](#search-engine--social-setup) for details.

---

## Product surface — the application

Lives under `/app/*` and is **excluded from search-engine indexing** (project names and customer-confidential info). The left-side navigation is ordered around the natural workflow:

| #  | Page | What it does |
|----|---|---|
| 1  | **Project Sources** | The landing page. Connect repos, RM tools, defect trackers, test management tools, document uploads. Nothing else works without sources, so this is first. |
| 2  | **Requirements** | Browse, filter (by source / external system / manual / type), edit (dialog or sheet), bulk-create. Imported rows show a `SourceBadge` linking back to their RM tool of origin. New requirements get unique `{prefix}-{NNNN}` codes allocated under a per-project advisory lock. |
| 3  | **Smart Interview** | AI interviews the PM with framework-aware questions; every answer becomes a real BRS/PRD/FRD requirement, baselined and ReqIF-exportable. |
| 4  | **Gaps** | AI-driven requirement gap detection — surfaces untraced files, missing tests, unmitigated hazards, and missing standards-mandated artifacts. |
| 5  | **Traceability** | SVG graph linking requirements ↔ code artifacts ↔ tests ↔ defects. "Analyze code" lets the AI classify a snippet against existing requirements and auto-create the link. Includes an `/ai/traceability-audit` graph-traversal completeness score (deterministic, not LLM-graded). |
| 6  | **Compliance** | Cards per framework + multi-framework "Run audit" launcher. |
| 7  | **Compliance detail** | Per-framework controls table with verdicts, native rating overlay (CL0–CL5 / ASIL / ML / DAL / Tier / Conformant…), evidence citations, and "Run AI audit" action. Last result is persisted in `audit_runs` and re-hydrated on dialog open (no extra credit spend on re-open). |
| 8  | **CAPA Actions** | Corrective + Preventive Action register. One-click CAPA injection from any audit gap; per-row framework badges; Standard dropdown filter. |
| 9  | **Defects** | Synced from Jira / Bugzilla / ServiceNow / ADO / Linear / GitHub / GitLab / YouTrack / ClickUp / Mantis / Redmine / ALM Octane every 5 minutes; auto-linked to requirements + tests. |
| 10 | **Test Cases** | Test repository (manual + imported from TestRail / Jira Xray / Zephyr); execution status; linked back to requirements for coverage scoring. |
| 11 | **AI Reports** | Templated narrative reports for any framework — exec summary, controls coverage, gap analysis, evidence appendix, CAPA roll-up. Downloadable as `.md`, `.csv`, or `.pdf` (browser print-to-PDF, no extra deps). DOCX export uses customer letterhead via `lib/companyTemplate.ts` (header/footer XML preserved byte-for-byte). |
| 12 | **Workflows** | Configurable PDLC workflow definitions (state machines for requirements, defects, change requests, CAPAs). Open → In Progress → In Review → Verified Closed; every transition signed and audit-trailed. |
| 13 | **PDLC** | Six gated lifecycle stages — Ideation, Design, Development, Test, Launch, Governance — with blockers, gate signers, and progress monitoring. |
| 14 | **Analytics** | Dashboards: Audit Readiness, Coverage, CAPA Closure rate, Traceability completeness, defect throughput, workflow lead time. Sparkline trends, exportable as a board pack. |
| 15 | **Recurring Audits** | Scheduler — "run an ISO 26262 audit on Project X every Monday at 06:00 UTC, notify me on regression, auto-open CAPAs for new findings." Driven by `lib/scheduler.ts` in-process cron loop. |
| 16 | **Legacy** | Drop in legacy code, get implicit requirements + risks extracted via multi-step LLM pipeline; optionally save them as real requirements with full traceability links. |
| 17 | **Activity / Audit Log** | Append-only event log of every ingestion, audit, edit, and notification — hash-chained for integrity, WORM-exportable to S3 (enterprise plan). |
| 18 | **Dashboard** | Roll-up view; intentionally last because it's only meaningful after data has been ingested. |
| 19 | **Settings** | Workspace settings, members + invites, RBAC, branding, billing, SSO/SAML/OIDC/SCIM (enterprise), IP allowlist (enterprise), MFA policy (enterprise), data residency (enterprise), CMK (enterprise), backups (enterprise), DSAR (enterprise), SIEM streaming (enterprise), BYO-LLM keys (enterprise). |
| 20 | **Admin → Leads** | Owner-role + `LEAD_ADMIN_EMAILS` allowlist gated. Browse demo requests / waitlist captured from the marketing site. |

**Ask Auditee** is intentionally *not* in the sidebar — it lives as a floating pill button (bottom-right of every app page) that opens a quick-chat sheet. Backed by the same `useAskAuditee` hook as the dedicated `/app/ask` page, with confidence badge + citations per answer. Per-project RAG using **pgvector** for context retrieval, with graceful fallback when embeddings are unavailable.

**Project switcher** sits at the top of the sidebar. Disabled (greyed) projects are ones with zero connected sources — clicking them deep-links to Sources with a "connect your first source" CTA. There's a "+ New project" item at the bottom of the dropdown that opens a CreateProjectDialog.

---

## Auxiliary artifacts (tutorial video, sales deck)

Three additional artifacts live alongside the main app:

| Artifact | Path / route | Purpose |
|---|---|---|
| `auditee-tutorial` | `/auditee-tutorial/...` | 17 narrated **module tutorials** (under 5 min each, voiceover via `/api/tutorial/tts` OpenAI nova with browser-TTS fallback, typewriter captions). Long-form variants: **full tour** (`?full=1`) and **ASPICE 4.0 walkthrough** (`?aspice=1`, ~7 min, end-to-end on the Apollo EV BMS project, framed with ASPICE process IDs ENG.1/ENG.2/ENG.5/SUP.7/SUP.9/SUP.10/MAN.3/MAN.6/SWE.4 plus an Enterprise scene covering SSO/RBAC/audit-log/SIEM). Driven by `AspiceTour.tsx` + `AspiceScenes.tsx`. |
| `auditee-deck` | `/auditee-deck/...` | Investor / sales slide deck, exportable to PPTX/PDF. |
| `mockup-sandbox` | internal | Vite preview server for UI prototyping on the canvas. Each component gets its own `/preview/<slug>` URL for iframe embedding during design exploration. |

The marketing site links to all of these from `/demo-videos` with the **ASPICE walkthrough** as the primary CTA.

---

## Core concepts

| Concept | What it is |
|---|---|
| **Workspace** | A tenant (organisation). Carries plan, seat limit, billing, branding, SSO config, audit-log retention. Every other entity is workspace-scoped. |
| **Member / Role** | A Clerk-authenticated user joined to a workspace as `owner` / `admin` / `editor` / `auditor` / `viewer`. Per-project role overrides supported. Invites can be `pending:<email>` until the invitee signs in (auto-reconciled on first login). |
| **Project** | A product or product line. Top-level scope inside a workspace. Identified by `proj-<slug>`. |
| **Source** | A connected upstream system or upload. Has a kind (github, doors_next, jira, reqif, jira_defects, …), a config blob, an optional per-source token, and a status. |
| **Requirement** | A normalised requirement row with a unique `{prefix}-{NNNN}` code allocated via `lib/insertRequirement.ts`. Carries provenance columns (`sourceId`, `externalId`, `externalUrl`, `externalSystem`) so we can trace it back to its upstream tool. |
| **Code artifact** | A file / module / snippet ingested from a source-code source. |
| **Traceability link** | An `(implements / tests / violates / supersedes)` edge between requirements and code artifacts. |
| **Compliance framework** | A standard (ISO 26262, ASPICE 4.0, CMMI 3.0, SOC 2, HIPAA, IEC 62304, FDA QMSR, ISO 21434, UN R155…). |
| **Compliance control** | An individual clause inside a framework. Audited verdict is `met / partial / gap`. |
| **CAPA** | Corrective and Preventive Action. Generated from audit gaps in one click; scoped by framework; gated through a workflow. |
| **Defect** | A bug pulled from a defect tracker, scoped to a source, de-duped on `(project_id, source_id, external_id)`. |
| **Test case** | A test scoped to a project, optionally linked to requirements; supplies coverage data for audits. |
| **Audit run** | A persisted run of the AI compliance auditor against `(project, framework)` — produces verdicts, recommendations, native-rating overlay; re-hydrated from `audit_runs` on dialog open. |
| **Recurring audit** | A scheduled audit. The scheduler in `lib/scheduler.ts` triggers them on a cron interval; new findings auto-open CAPAs. |
| **PDLC stage** | One of six gated lifecycle stages — Ideation, Design, Dev, Test, Launch, Governance. |
| **Knowledge graph** | The implicit network formed by requirements ↔ code ↔ tests ↔ defects ↔ controls ↔ CAPAs ↔ workflow states. The AI traverses this graph for "Ask Auditee" answers and audit reasoning. |

---

## Plans, billing & enterprise features

Four tiers, defined in `lib/db/src/schema/workspaces.ts` (`PLAN_SEATS`, `PLAN_CREDITS`):

| Plan | Seats | AI credits / month | Highlights |
|---|---|---|---|
| **Free** | 1 | 10 | Single user, basic audits |
| **Standard** | 1 | 50 | All audits, all connectors, all reports |
| **Professional** | 4 | 200 | Team collaboration, recurring audits, workflows, analytics |
| **Enterprise** | 20 | 1000 | Everything below ↓ |

**Enterprise-only features** (gated by `planAllows()` in `lib/permissions.ts`):

- **SSO** — SAML 2.0, OIDC, SCIM 2.0 user provisioning. Okta / Azure AD / Google Workspace tested.
- **Append-only audit log** — hash-chained, WORM-exportable to S3.
- **SIEM streaming** — Splunk HEC, Datadog. Failed logins, role escalations, anomalous exports streamed in real time.
- **BYO-LLM** — bring your own OpenAI / Anthropic / OpenRouter key (or a per-workspace key). Bypasses Auditee's AI billing.
- **IP allowlist** — per-tenant CIDR allowlist enforced in `requireWorkspace`. The `/workspace/ip-allowlist` route itself is exempt so admins can never lock themselves out.
- **MFA policy** — enforced MFA inherited from IdP.
- **Data residency** — pin tenant to a region.
- **Customer-managed keys (CMK)** — encryption at rest with customer KMS.
- **Branding / White-label** — custom logo, colours, DOCX letterhead. `{generated_by}` placeholder resolves to "" (instead of "Auditee") on any paid plan.
- **SLA dashboard, backups, DSAR (data-subject access requests)**.

**Billing.** Razorpay-backed checkout (`artifacts/api-server/src/routes/billing.ts`). Annual plans use **one-time orders** to work around the RBI ₹15k auto-debit cap; lazy expiry happens on the next workspace load (`expirePastDueAnnualPlan` in `lib/billingPlanSync.ts`).

**Webhook.** `RAZORPAY_WEBHOOK_SECRET` verifies inbound payment events; setup notes in `artifacts/api-server/RAZORPAY_WEBHOOK_SETUP.md`.

---

## The connector ecosystem

### Source code (multi-provider repo fetch)

`/api/ai/fetch-code-url` accepts URLs from **GitHub, GitLab (SaaS + self-hosted), Bitbucket Cloud, Azure DevOps, and self-hosted Gitea / Forgejo**. Self-hosted hosts must be allowlisted via `GITEA_HOSTS` / `GITLAB_HOSTS` / `BITBUCKET_HOSTS` / `AZURE_DEVOPS_HOSTS` env vars. Each provider has its own URL parser, default-branch resolver, tree lister, and raw-URL builder; all fetches route through `fetchAllowlistedFollow` for per-hop SSRF re-validation.

Other code sources:
- **GitHub repos** — REST + webhook ingestion. Falls back to `GITHUB_PAT` for anonymous-rate-limit avoidance and pushes (`routes/repoPush.ts`). Per-source tokens still take precedence for private repos.
- **ZIP archive** — upload a `.zip` of any codebase.
- **Project folder** — drag a whole folder from your machine.
- **GitHub webhooks** — continuous gap detection on push (`GITHUB_WEBHOOK_SECRET` required, otherwise 503).

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

Imported rows are de-duped by a partial unique index on `(project_id, source_id, external_id)` so re-syncs upsert in place. Locally-created requirements are de-duped by the `requirements_project_code_unique (project_id, code)` index.

### Defect management
A second connector section, dispatched in `lib/defect-ingestion.ts`.

`jira_defects`, `ado_defects` (Azure DevOps Bugs via WIQL), `bugzilla`, `mantis`, `redmine`, `youtrack`, `clickup`, `linear`, `servicenow`, `alm_octane`, `github_issues`, `gitlab_issues`.

Defects are pulled into the `defects` table and fed into the audit prompt as input #4 ("Defects from connected defect-management tools — cite by ticket key when they prove or disprove a control"). Deleting a source cascades the deletion of its defect rows.

### Test management
TestRail, Jira Xray, Zephyr — populate the `test_cases` table for coverage scoring.

### Documents
Generic upload — PDFs, Word, plain text. Used as evidence in audits.

### Notifications
- **Slack** — `SLACK_WEBHOOK_URL` (per-workspace overridable). Audit completions, CAPA assignments, recurring-audit regressions.
- **Microsoft Teams** — `TEAMS_WEBHOOK_URL`.

### Identity providers (enterprise)
- **SAML 2.0** — IdP-initiated and SP-initiated.
- **OIDC** — generic + Okta / Azure AD / Google Workspace presets.
- **SCIM 2.0** — JIT user creation, group → role mapping.

### SIEM (enterprise)
- **Splunk HEC**
- **Datadog**
- Generic webhook sink for any other SIEM.

### Lead capture
Sign-ups + waitlist + demo requests sync to a Google Sheet (`google-sheet` integration; `GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON` + `GOOGLE_SHEET_ID`).

---

## The AI layer

All AI endpoints live under `/api/ai/*` and intentionally bypass the OpenAPI codegen pipeline (they have looser, evolving schemas). The frontend calls them via thin `useMutation` wrappers in `artifacts/eltegra-site/src/lib/ai-api.ts`.

| Endpoint | Purpose | UI entry point |
|---|---|---|
| `POST /api/ai/generate-requirements` | Drafts BRDs / PRDs / FRDs / NFRs from a brief, persists to a project. | Requirements page → "Generate from brief" |
| `POST /api/ai/smart-interview` | Conducts framework-aware Q&A; turns answers into baselined requirements. | Smart Interview page |
| `POST /api/ai/analyze-code` | Classifies which existing requirements a code snippet implements / tests / violates, creates the code artifact + traceability links. | Traceability page → "Analyze code" |
| `POST /api/ai/fetch-code-url` | Multi-provider repo fetch (see §[Connectors](#source-code-multi-provider-repo-fetch)). | Sources / Legacy |
| `POST /api/ai/compliance-audit` | Control-by-control audit of a project against a framework, returns verdicts + recommendations + native-rating overlay; persists to `audit_runs`. | Compliance detail → "Run AI audit" |
| `POST /api/ai/traceability-audit` | Deterministic graph-traversal completeness score (req → code → test → defect chain). Treats omitted entries as "fully missing" — never silently inflates. | Traceability page → "Audit traceability" |
| `GET  /api/ai/audit-runs/latest?sourceId=&kind=&frameworkId=` | Re-hydrates the last persisted audit so users can re-open without spending a credit. | Run-Audit / Traceability dialogs |
| `POST /api/ai/legacy-extract` | Pulls implicit requirements + risks out of legacy code via multi-step LLM pipeline; optionally saves them. | Legacy page |
| `POST /api/ai/gap-detection` | Surfaces missing tests, untraced code, unmitigated hazards. | Gaps page |
| `POST /api/ai/generate-report` | Templated narrative report (BRD / PRD / audit / CAPA roll-up). | AI Reports page |
| `POST /api/ai/ask` | Natural-language Q&A across project context with **per-project pgvector RAG** + graceful fallback. Conversations persist server-side in `ai_conversations`, scoped by `projectId`. | `/app/ask` and the floating Ask Auditee sheet |
| `GET  /api/ai/ask/history?projectId=…&limit=50` | List saved Q&A history (newest first). | Ask page sidebar |
| `DELETE /api/ai/ask/history/:id` | Remove a saved conversation. | Ask page sidebar |
| `POST /api/tutorial/tts` | OpenAI `tts-1-hd` (`voice=nova`) for the tutorial-video voiceover. | `auditee-tutorial` artifact |

### Provider chain (fault-tolerant, cost-tiered)

`lib/ai.ts` runs providers in order:

1. **BYO** (workspace-supplied key)
2. **OpenRouter keys 1–21** (each `OPENROUTER_API_KEY[_N]`, free quotas first)
3. **OpenAI**
4. **Anthropic**

Paid OpenAI / Anthropic keys are only spent after every OpenRouter slot is exhausted. `isRetryable` + `classifyProviderError` treat 401/402/403/408/429/5xx and provider-specific quota errors (Anthropic "credit balance is too low", OpenRouter `insufficient_credits`) as retryable, so a depleted key automatically advances to the next.

### Multi-step extraction pipelines

Complex document analysis (legacy code, large PDFs, ReqIF imports) uses a **pipeline of focused LLM calls** for classification → entity extraction → linking, rather than a single mega-prompt. This improves accuracy, reduces hallucination, and stays within token limits.

### JSON repair

`parseJson` in `lib/ai.ts` runs a `tryRepairTruncatedJson` pass when `JSON.parse` fails — it closes any still-open arrays/objects/strings and drops the trailing partial element so a provider hitting `max_tokens` mid-stream returns a usable (slightly shorter) payload instead of a 502.

### Standard-native audit ratings

On top of the universal verdict (`strong / adequate / weak / failing`) and per-control verdicts (`met / partial / gap`), every audit returns a `nativeRating` block in the audited framework's own vocabulary:

| Framework | Native vocabulary |
|---|---|
| ISO/IEC 27001 | Conformant / Observation / Minor NC / Major NC |
| ASPICE 4.0 / Cybersecurity 2.0 | Capability Levels CL0–CL5 with N/P/L/F per process |
| CMMI 3.0 | Maturity Level 1–5 |
| NIST CSF 2.0 | Implementation Tiers 1–4 |
| IEC 61508 | SIL claim limit |
| IEC 62304 | Software Safety Class A/B/C |
| IEC 62443 | ML / SL pair |
| ISO 26262 | ASIL QM / A / B / C / D |
| ISO/SAE 21434 | CAL 1–4 |
| DO-178C | DAL A/B/C/D/E + Satisfied / Partially-Satisfied / Not-Satisfied |
| FDA 21 CFR Part 11, GDPR, HIPAA, PCI-DSS, SOC 2, DORA, NIS2 | Industry-standard conformity verdicts |

The mapping lives in `artifacts/api-server/src/lib/framework-rating.ts` and is computed **deterministically** from `compliancePercentage` + per-control verdicts (no extra LLM call). The endpoint spreads `...result` first and assigns `nativeRating` last, so the LLM cannot overwrite the deterministic overlay.

---

## Compliance frameworks supported

70+ framework + control libraries are seeded out of the box. Highlights by domain:

- **Automotive** — ASPICE 4.0, ASPICE Cybersecurity 2.0, ISO 26262, ISO 21448 (SOTIF), ISO/SAE 21434, UNECE R155, UNECE R156, ISO 24089, ISO 20077, ISO 20078, IATF 16949
- **Medical devices** — IEC 62304, IEC 60601, ISO 13485, ISO 14971, IEC 62366, ISO 14155, ISO 10993, FDA 21 CFR 820 (QMSR), 21 CFR 807, 21 CFR 814, MDR 2017/745, IVDR 2017/746
- **Avionics & aerospace** — DO-178C, DO-254, ARP 4754A, ARP 4761, AS9100, AS9110, AS9120, NADCAP, EASA Part 21, EASA Part 145
- **Industrial / functional safety** — IEC 61508, IEC 61511, IEC 62443, IEC 61131-3, IEC 60204-1, ISO 13849-1, ISO 10218-1
- **Rail** — EN 50128, EN 50126, EN 50129, EN 50657, EN 50155, EN 50159, EN 45545, TS 22163, UIC standards
- **Energy & oil & gas** — NERC CIP, API 1164, ISA-95
- **Process maturity & quality** — CMMI 3.0, ISO 9000, ISO 9001, ISO 9004, ISO 19011, Lean Six Sigma
- **Information security & privacy** — ISO/IEC 27001, ISO/IEC 27002, NIST CSF 2.0, SOC 2, HIPAA, GDPR, PCI-DSS, PCI DSS 4.0, DORA, NIS2, FDA 21 CFR Part 11
- **Other ISO management systems** — ISO 14001, ISO 45001, ISO 50001, ISO 26000, ISO 28000, ISO 22301, ISO 41001, ISO 31000, ISO 10002, ISO 10004
- **Software engineering standards** — IEEE 1016, IEEE 1063, IEEE 828, IEEE 1012, IEEE 730, ISO/IEC/IEEE 29119, ISO/IEC/IEEE 42010
- **AI governance** — EU AI Act

Adding a new framework is just two seed inserts (one row in `compliance_frameworks`, N rows in `compliance_controls`) — the audit runner is framework-agnostic. The full list lives in `scripts/src/seed.ts` (look for `Bootstrapped framework controls` log lines on server start).

---

## Authentication, RBAC & multi-tenancy

**Auth provider:** [Clerk](https://clerk.com). `CLERK_SECRET_KEY` + `CLERK_PUBLISHABLE_KEY` required. Sign-in / sign-up / MFA / social providers / SSO (enterprise) all handled by Clerk.

**Bootstrapping.** `requireAuth` middleware extracts `userId` + email from the Clerk session. `requireWorkspace` then calls `getOrCreateWorkspace`:
- If the user is already a member of a workspace → return it.
- Otherwise → create a new free-plan workspace named `<email-prefix>'s workspace`, add the user as `owner`, reconcile any pending `pending:<email>` invites.

**Roles.** `WORKSPACE_ROLES` = `owner` / `admin` / `editor` / `auditor` / `viewer`. Legacy `member` rows are normalised to `editor` at read-time (no destructive migration). Per-project roles override workspace roles via `project_members`.

**Permissions.** `lib/permissions.ts` exposes `permissionsFor(role)`, `isAtLeast(role, min)`, `planAllows(plan, feature)`. Routes use `ensureAdminEnterprise` and `gateAdmin` helpers to combine role + plan checks.

**IP allowlist.** Per-tenant CIDR allowlist enforced in `requireWorkspace` for enterprise plans. The `/workspace/ip-allowlist` route is exempt so admins cannot lock themselves out, and operator-allowlisted emails (see next section) are also exempt.

**Audit log.** Every requirement edit, CAPA transition, gate sign-off, role change, and config change captured in `audit_logs` with actor, IP, timestamp, and SHA-256 integrity hash forming a hash chain.

---

## Operator overrides (test/founder accounts)

`artifacts/api-server/src/lib/accessOverrides.ts` holds a small allowlist (`DEFAULT_UNLIMITED_EMAILS` + the `UNLIMITED_CREDIT_EMAILS` env var, comma- or whitespace-separated). Listed emails are forced **in-memory** (no DB writes) to:

- `plan = 'enterprise'`
- `seatLimit = PLAN_SEATS.enterprise`
- `role = 'owner'`
- `planExpiresAt = null` (so the lazy expiry can't downgrade them)
- **Unlimited AI credits** (the credit middleware uses the same `isUnlimitedEmail`)
- **IP allowlist exemption** (so operator accounts can never self-lockout)

Removing an email from the allowlist instantly reverts that account to its real plan / role on the next request. Default allowlist contains `yogesh.yowan@gmail.com` (project owner / test account).

This is the supported way to grant founders, internal staff, and demo accounts full access without billing — preferred over manually mutating `workspaces.plan` in the DB.

---

## Technical architecture

**Stack.** TypeScript everywhere. pnpm workspaces monorepo. Node.js 24.

**Frontend (`artifacts/eltegra-site`)** — React + Vite + TailwindCSS + shadcn/ui + wouter for routing + TanStack Query for data + Framer Motion for animation. The marketing landing page and the signed-in app share a single Vite build with two route trees (`/` and `/app/*`). UI theme uses Auditee purple + Inter Tight font (`packages/app/src/index.css`).

**API server (`artifacts/api-server`)** — Express 5 + Pino structured logging + Drizzle ORM. Built with esbuild into a single CJS bundle. All routes live under `/api/*`. Comprehensive HTTP security headers via Helmet. Rate-limiting via `express-rate-limit`.

**Database** — PostgreSQL via Drizzle ORM, with `pgvector` extension for RAG embeddings. Schema is the source of truth; migrations done via `drizzle-kit push`.

**API spec (`lib/api-spec`)** — OpenAPI 3 spec is the source of truth for CRUD endpoints. Orval generates `lib/api-zod` (Zod schemas) and `lib/api-client-react` (TanStack Query hooks). AI endpoints intentionally bypass codegen.

**Validation** — Zod (`zod/v4`) and `drizzle-zod` to derive request/response schemas from the DB schema.

**Networking safety** — All outbound fetches go through `artifacts/api-server/src/lib/safe-fetch.ts`, which DNS-resolves the target and refuses private IPs, link-local, loopback, and cloud-metadata endpoints. Prevents SSRF attacks via user-supplied connector URLs. Multi-provider repo fetch uses `fetchAllowlistedFollow` for per-hop SSRF re-validation.

**Background work** — `lib/scheduler.ts` runs the recurring-audit cron loop in-process at server start. Slack / Teams notifications dispatched in-process. No external job queue needed for current scale.

**AI proxy** — `lib/integrations-openai-ai-server`, `lib/integrations-anthropic`, `lib/integrations-openrouter`, `lib/integrations-gemini` (Replit AI Integrations proxies, no API key required for the default tier). BYO keys layer on top.

**Billing** — Razorpay client + webhook handler. Idempotent on `razorpay_payment_id`. Annual one-time orders for RBI compliance.

**Auth** — Clerk Express SDK + JWT verification middleware.

---

## Data model

40+ tables in `lib/db/src/schema/`. Highlights:

| Table | Purpose |
|---|---|
| `workspaces` | Tenant. Holds plan, seatLimit, planActivatedAt, planExpiresAt, branding, ipAllowlist, mfaPolicy, dataResidency, etc. |
| `workspace_members` | (workspaceId, userId, email, role). `pending:<email>` rows reconcile on first login. |
| `project_members` | Per-project role overrides. |
| `projects` | Top-level container (id `proj-<slug>`). |
| `project_sources` | Connected upstream systems (kind, config JSON, status, optional per-source token). |
| `requirements` | Normalised requirements, unique `{prefix}-{NNNN}` codes per project, with `sourceId` / `externalId` / `externalUrl` / `externalSystem` provenance. |
| `code_artifacts` | Files / modules ingested from code sources. |
| `traceability_links` | Edges: `(requirement_id ↔ code_artifact_id, kind)`. |
| `compliance_frameworks` | ISO 26262, ASPICE, CMMI, etc. |
| `compliance_controls` | Individual clauses within each framework. |
| `capa_actions` | CAPAs scoped to a framework + project. |
| `defects` | Bugs pulled from defect trackers, scoped to a source. |
| `test_cases` | Test repository. |
| `audit_runs` | Persisted audit results (re-hydrated on dialog open). |
| `audit_logs` | Hash-chained append-only event log. |
| `pdlc_stages` | Project lifecycle stages. |
| `workflows` | State-machine definitions. |
| `workflow_states` / `workflow_transitions` | Workflow graph. |
| `recurring_audits` | Scheduled audits (cron expression + last/next run). |
| `activity_events` | Per-user activity feed. |
| `notifications` | Per-user notification queue. |
| `comments` | Threaded comments on requirements / controls / CAPAs. |
| `ai_conversations` | Persisted Q&A history for Ask Auditee (with pgvector embeddings). |
| `ai_reports` | Saved narrative reports. |
| `legacy_systems` | Legacy codebases dropped in for requirement-extraction. |
| `sso_config` | Per-workspace SAML / OIDC config. |
| `scim_tokens` | Per-workspace SCIM provisioning tokens. |
| `siem_config` | Per-workspace SIEM sink config. |
| `byo_llm_keys` | Per-workspace LLM API keys. |
| `subscriptions` | Razorpay subscription / order state. |
| `lead_captures` | Marketing-site lead-capture (global table, gated by `LEAD_ADMIN_EMAILS`). |
| `demo_requests` | Marketing-site demo requests. |

Relationships are enforced with foreign keys + cascade deletes (deleting a source cascades to its requirements and defects; deleting a project cascades to everything in the project; deleting a workspace cascades to all projects).

---

## Repository layout

```
/
├── artifacts/
│   ├── eltegra-site/            React + Vite frontend (landing + app pages)
│   ├── api-server/              Express API mounted at /api
│   ├── auditee-tutorial/        17 narrated module tutorials + ASPICE walkthrough
│   ├── auditee-deck/            Investor / sales slide deck
│   └── mockup-sandbox/          Vite preview server for UI prototyping
├── lib/
│   ├── db/                                  Drizzle schemas + migration tooling
│   ├── api-spec/                            OpenAPI source of truth + Orval codegen
│   ├── api-zod/                             Generated Zod schemas (do not edit)
│   ├── api-client-react/                    Generated TanStack Query hooks (do not edit)
│   ├── integrations-openai-ai-server/       Replit AI Integrations proxy (OpenAI)
│   ├── integrations-anthropic/              Anthropic proxy
│   ├── integrations-openrouter/             OpenRouter proxy
│   ├── integrations-gemini/                 Gemini proxy
│   └── ui/                                  Shared shadcn/ui components
├── scripts/
│   └── src/seed.ts              Seeds projects, requirements, 70+ frameworks…
├── deploy/                      Helm chart + Hetzner deploy notes
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

# seed the database (projects, frameworks, controls)
pnpm --filter @workspace/scripts run seed

# run the API server
pnpm --filter @workspace/api-server run dev

# run the frontend
pnpm --filter @workspace/eltegra-site run dev
```

Workflows are pre-configured in the Replit workspace and started automatically:
- `artifacts/api-server: API Server`
- `artifacts/eltegra-site: web`
- `artifacts/auditee-tutorial: web`
- `artifacts/auditee-deck: web`
- `artifacts/mockup-sandbox: Component Preview Server`

### Required environment variables

| Var | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string (auto-provisioned by Replit). |
| `SESSION_SECRET` | Session signing (auto-provisioned). |
| `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY` | Auth. |
| `OPENAI_API_KEY` | Primary AI (optional — Replit Integrations proxy works without it). |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | Billing. |
| `GITHUB_WEBHOOK_SECRET` | GitHub webhook verification (otherwise 503 on the webhook route). |
| `GITHUB_PAT` | Platform GitHub token for anonymous-rate-limit fallback + push. |
| `SLACK_WEBHOOK_URL`, `TEAMS_WEBHOOK_URL` | Notifications. |
| `GOOGLE_SHEET_ID`, `GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON` | Lead capture sync. |
| `LEAD_ADMIN_EMAILS` | Allowlist for `/app/admin/leads`. |

### Optional environment variables

| Var | Purpose |
|---|---|
| `OPENROUTER_API_KEY`, `OPENROUTER_API_KEY_2…21` | OpenRouter fallback rotation. |
| `ANTHROPIC_API_KEY` | Anthropic fallback. |
| `UNLIMITED_CREDIT_EMAILS` | Extend the operator allowlist (see [§12](#operator-overrides-testfounder-accounts)). |
| `GITEA_HOSTS`, `GITLAB_HOSTS`, `BITBUCKET_HOSTS`, `AZURE_DEVOPS_HOSTS` | Self-hosted Git host allowlist for `/ai/fetch-code-url`. |

---

## Search-engine + social setup

The marketing site is fully optimised for search and social:

- `index.html` carries a long-form `<title>`, comprehensive `<meta description>`, keyword list, canonical link, theme color, mobile-app meta, and a `<noscript>` block with crawlable copy.
- Open Graph + Twitter Card tags reference `/opengraph.jpg` (1200×630).
- Three JSON-LD blocks (`SoftwareApplication`, `Organization`, `WebSite`) describe the product, features, and offer to search engines.
- `public/robots.txt` allows crawling of marketing pages, disallows `/app/*`, blocks the major LLM training scrapers (GPTBot, ClaudeBot, anthropic-ai, CCBot, Google-Extended), and points to the sitemap.
- `public/sitemap.xml` lists the canonical homepage with image entries.
- The signed-in app (`AppLayout`) injects a `<meta name="robots" content="noindex, nofollow, noarchive, nosnippet">` while mounted, so even if a crawler ignores robots.txt the per-page directive still suppresses indexing.

**Canonical hostname** is `https://auditee.site/`. The hostname is centralised in `artifacts/eltegra-site/src/components/SEO.tsx` (`SITE_URL`), `artifacts/eltegra-site/scripts/generate-sitemap.mjs` (`SITE`), `artifacts/eltegra-site/index.html`, `artifacts/eltegra-site/public/robots.txt`, and the CORS allowlist in `artifacts/api-server/src/app.ts`.

---

## Deployment & domain

The project deploys on Replit (path-based proxy routes traffic to the right artifact by URL prefix) and also has a Helm chart at `deploy/helm/auditee/` for Kubernetes targets. Hetzner deploy notes live in `DEPLOY-HETZNER.md`.

After deployment:
1. Verify the canonical URL in `index.html` / `robots.txt` / `sitemap.xml` matches the production domain.
2. Submit the sitemap to **Google Search Console** and **Bing Webmaster Tools** to accelerate indexing.
3. Verify Open Graph rendering on **LinkedIn Post Inspector**, **Twitter Card Validator**, and **iMessage** before any major social campaign.
4. Wire up the Razorpay webhook (`/api/billing/webhook`) per `artifacts/api-server/RAZORPAY_WEBHOOK_SETUP.md`.
5. Wire up the GitHub webhook (`/api/integrations/github/webhook`) on each customer repo for continuous gap detection.

---

## Roadmap notes

These are observed gaps in the current build, not committed work:

- **Webhook ingestion breadth** — sources beyond GitHub are currently pull-only (sync on demand or on cron). Push (webhook) ingestion would shorten the freshness window for DOORS Next, Jira, and GitLab.
- **Audit log retention** — `audit_logs` grows unbounded. Add automatic rotation/archive policy at scale (WORM-export to S3 already supported on enterprise; needs a scheduled rotator).
- **Connector polish** — the marketing site lists ALM Octane, ServiceNow, etc. as defect connectors; some of those have minimal field coverage and would benefit from a dedicated polish pass.
- **External job queue** — `lib/scheduler.ts` runs the recurring-audit cron loop in-process. Move to a dedicated worker (BullMQ / Temporal) once recurring audits are run by 100+ concurrent workspaces.
- **More IdPs** — SAML/OIDC presets cover Okta / Azure AD / Google Workspace; add OneLogin, JumpCloud, Ping out of the box.
