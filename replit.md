# Workspace

## Overview

Auditee is an AI-native enterprise platform designed to manage the entire Product Development Lifecycle (PDLC). It provides comprehensive tools for requirements management, traceability, compliance, defect tracking, and advanced AI-powered analysis and report generation. The platform aims to automate and streamline product development processes, offering AI-driven requirement generation, code analysis, compliance auditing, extraction from legacy systems, and natural language Q&A. The project includes a marketing landing page and a core application, focusing on delivering a robust, AI-accelerated PDLC management experience with a business vision to transform product development efficiency and compliance.

## User Preferences

I prefer iterative development with clear communication at each stage. Ask before making major architectural changes or introducing new dependencies. For code, I prefer readable and maintainable solutions over overly clever or complex ones.

## System Architecture

The project is structured as a pnpm workspace monorepo using Node.js and TypeScript.

### UI/UX Decisions

The marketing site is optimized for SEO with comprehensive meta tags, Open Graph, Twitter Cards, JSON-LD, `robots.txt`, and `sitemap.xml`. The application (`/app/*`) is configured for `noindex, nofollow`. The application features a logical navigation structure and a floating "Ask Auditee" AI chat button. The UI adheres to a branded `shadcn` appearance with Auditee purple (`#6366f1`) and Inter Tight font.

### Technical Implementations

The backend is an Express 5 API server mounted at `/api`. Data persistence is managed by PostgreSQL with Drizzle ORM, utilizing Zod and `drizzle-zod` for validation. API client code is generated from an OpenAPI specification using Orval. The frontend is built with React and Vite. All external HTTP requests are routed through `lib/safe-fetch.ts` for SSRF protection. Authentication and authorization are handled by Clerk (white-label), supporting a workspace-scoped, seat-based billing model.

### Enterprise Features

-   **RBAC (4 roles)**: `owner`, `admin`, `editor`, `viewer`, with a detailed permission matrix and server-side authoritative checks.
-   **Audit Log**: An append-only `audit_logs` table records all mutations, accessible via a read endpoint requiring admin+ role and Enterprise plan, with UI for filtering and CSV export.
-   **SSO (SAML / OIDC via Clerk Enterprise)**: Supports domain auto-routing and is an owner-only, Enterprise-only feature.
-   **Plan-gating**: Features are gated by plan, returning HTTP 402 for Free/Pro plans to prompt upgrades.
-   **Per-project RBAC (4 project roles)**: `manager`, `developer`, `reviewer`, `auditor`, layered on top of workspace roles, with explicit project membership and permission computation.
-   **Trust / Security Center**: A public `/security` page details encryption, SSO/RBAC/audit log capabilities, compliance posture (SOC 2, ISO 27001, GDPR, HIPAA), sub-processors, and vulnerability disclosure.

AI features are exposed via `/api/ai/*` endpoints for `generate-requirements`, `analyze-code`, `compliance-audit`, `legacy-extract`, `ask`, `gap-analysis`, `promote`, and `estimate-effort`. AI document generators support various report types (e.g., `compliance_audit`, `requirements_summary`) and can export to DOCX/PDF/HTML, leveraging canonical blueprints. Standards-aware generation allows AI outputs to conform to multiple regulatory frameworks. The system supports free-trial AI credits for anonymous and Free plan users.

### Pricing & Credit Model

A single source of truth for pricing/seats/credits lives in `lib/db/src/schema/workspaces.ts`:

| Tier         | Price       | Seats | Monthly AI credits |
|--------------|-------------|-------|--------------------|
| Free         | $0 forever  | 1     | 10 (one-time, plus $5 prepaid top-ups for 10 more, never expire) |
| Standard     | $25/month   | 1     | 50                 |
| Professional | $100/month  | 4     | 200                |
| Enterprise   | $500/month  | 20    | 1,000              |

One credit = one successful AI generation (BRD, PRD, test-case suite, compliance audit, traceability audit, etc.). Failures auto-refund via the reserve+refund pattern in `creditMiddleware.ts`. Anonymous (signed-out) browsers get the same Free allowance (`ANON_CREDIT_LIMIT = 10`), tracked in `localStorage` and verified server-side via `x-anon-credits-used`. Monthly plan credits reset each billing cycle; Free top-up credits never expire. The marketing pricing page (`Pricing.tsx`) and the in-app Billing page (`Billing.tsx`) both render directly off these constants. Razorpay billing is currently **paused** pending merchant credentials (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`) — `PLAN_PRICE_USD`, `FREE_TOPUP_PRICE_USD`, and `FREE_TOPUP_CREDITS` are display-only until those secrets are provided.

### Feature Specifications

-   **Project Management**: Creation and management of projects with persistent selection.
-   **Requirements Management Connectors**: Integrations with various RM tools (e.g., Doors Next, Jama, Jira) for importing and de-duplicating requirements.
-   **Defect Management Connectors**: Integrations with multiple defect tracking systems (e.g., Jira, Azure DevOps, GitHub Issues) for importing and de-duplicating defects.
-   **AI-powered Reporting**: Generation of various reports (e.g., BRD, PRD, test cases) with standards-aware content.
-   **Standards Documentation Set**: Five dedicated AI report kinds for engineering documentation that conform to international standards: `architecture_doc` per ISO/IEC/IEEE 42010 (stakeholders & concerns, drivers, system context, logical / process / data / deployment views, ADRs, risks); `hld` and `lld` per IEEE 1016 (module decomposition, component interactions, external interface design, data design — and at low level: class/method specs, API contracts, schemas, algorithms with pseudocode, error model, concurrency & state machines); `deployment_doc` (environments, infra components, CI pipeline, release strategy, runbook, DR posture); `user_manual` per IEEE 1063 (getting started, key concepts, task-oriented procedures, screen reference, troubleshooting, glossary). All five are first-class report kinds in `KIND_BLUEPRINT` (api-server `routes/reports.ts`) with friendly labels surfaced in the in-app Reports page kind dropdown, exportable to DOCX/PDF/HTML, and pushable to the connected GitHub repo via the standard report-push affordance.
-   **Standards Compliance**: AI generators and reports adhere to multiple compliance standards, incorporating native rating vocabularies and framework-specific filters.
-   **Medical Device Standards Bundle**: A first-class set of medical-device regulatory frameworks is available across compliance audits, gap-to-CAPA conversion, requirement generation and document generation. Frameworks (with control catalogs) live in `bootstrap-frameworks.ts`; matching AI prompt blueprints (document sections, requirement coverage, citation rules) live in `standards-blueprints.ts`. Bundle: **IEC 60601** (medical electrical equipment — basic safety, essential performance, EMC, PEMS, alarms), **ISO 13485** (medical-device QMS — design controls, CAPA, complaint handling), **ISO 14971** (risk management — risk-management file, risk control hierarchy, residual risk), **IEC 62304** (medical-device software life cycle — safety class A/B/C), **IEC 62366-1** (usability engineering — use specification, hazard-related use scenarios, summative evaluation), **ISO 14155** (clinical investigation — CIP, IB, AE/SAE reporting), **FDA 21 CFR Part 820** (QSR), **FDA 21 CFR Part 807** (establishment registration & 510(k)), **FDA 21 CFR Part 814** (PMA), **MDR (EU) 2017/745** (GSPR, technical documentation, CER, PMS, vigilance), **IVDR (EU) 2017/746** (performance evaluation, PMPF, vigilance), and **IEC 62443** (cybersecurity for industrial / medical devices). Selecting any of these on a project automatically scopes audits, evidence requirements, CAPA action items and AI-generated documents to the corresponding clauses with proper inline citations.
-   **Company Letterhead Templates**: Per-workspace `.docx` templates for custom branding on all PDLC reports, supporting dynamic placeholders.
-   **5-Stage Lifecycle Traceability**: End-to-end traceability across Architecture, Design, Implementation, Testing, and Deployment, visualized with completeness badges and AI-driven recommendations.
-   **Automated Control Closure & Evidence Locker**: Compliance controls auto-close with new evidence (AI-asserted or manually verified), maintaining a full evidence trail.
-   **Test Management & Notifications**: A dedicated test-cases module with AI-powered suite generation and automated notifications for stale requirements lacking test cases or traceability.
-   **Multi-Level Test Suite Generation & AI Execution**: Test cases now span ISTQB-aligned levels (unit / integration / system / acceptance / operational), eleven disciplines (functional, negative, regulatory, performance, security, usability, compatibility, regression, accessibility, reliability, UAT) and design paradigms (procedural, BDD/Gherkin, OO state-based, functional/property, exploratory) — generated from any source kind (requirements, design docs, architecture, source code, a specific AI report, or the whole project) in either static or dynamic mode. An AI executor evaluates each case against the ingested artefacts to produce per-case verdicts (pass/fail/inconclusive) with evidence, persists a `Test Execution Report`, and exports the entire suite + report as a downloadable ZIP bundle for committing back to the connected git repository so compliance can re-run.
-   **Push to Connected GitHub Repo**: A reusable "Push to repo" affordance (next to every report row, inside the report viewer, and in the Test Cases header) commits generated artefacts back to the project's connected GitHub source in a single atomic commit, using the GitHub Git Data API (ref → commit → tree → blobs → tree → commit → ref). Reports become Markdown files at `<subdir>/reports/<kind>/<slug>.md`; test bundles publish per-case Markdown grouped by level plus `test-cases.json`, the latest execution `REPORT.md`, and a `README.md` under `<subdir>/`. CAPA actions push as one Markdown file per action under `<subdir>/<code>-<idHash>-<title>.md` (UUID prefix prevents slug collisions) plus an auto-generated `INDEX.md` summary table — exposed via `POST /api/repo/push-capa` with `{projectId, capaActionIds?, includeStatuses?, sourceId?, branch?, subdir?, commitMessage?}`; default status filter is `["open","in_progress","blocked"]`, hard-capped at 200 actions per commit, and any path collision fails closed with HTTP 409 listing the conflicting CAPA IDs. The PAT stored on the github project source (`projectSourcesTable.config.token`, `repo` scope required) is reused — no new secret needed. All push endpoints (`GET /api/repo/push-targets`, `POST /api/repo/push-report`, `POST /api/repo/push-test-bundle`, `POST /api/repo/push-capa`) enforce project RBAC (developer for writes, viewer for target listing), share an in-memory rate limiter (10 pushes per user per endpoint per 10 min), guard against path traversal, and log every commit to the activity feed with the short SHA.
-   **Pre-Audit Source Auto-Pull**: Before every scheduled compliance audit fires, the in-process scheduler (`scheduler.ts` `runTick`) automatically refreshes every linked source on the project so the AI evaluates the *current* state of the codebase, requirements and defects rather than whatever was last manually synced. Per-source dispatch by kind: `github` → `ingestGithub`; RM kinds (DOORS Classic, DOORS Next, Jama, Polarion, Codebeamer, Helix RM, Visure, Azure DevOps, Jira reqs) → `ingestRequirementsTool`; defect kinds (Jira, ADO, Bugzilla, Mantis, Redmine, YouTrack, ClickUp, Linear, ServiceNow, ALM Octane, GitHub Issues, GitLab Issues) → `ingestDefectsTool`; remote-system kinds (Jenkins, S3, GDrive, ALM, Cloud server) → `ingestRemoteSystem`. Local-only kinds (`zip`, `folder`, `reqif`, `url`) are skipped. Each per-source pull is isolated: a failure is captured, recorded on the source's `status`/`statusMessage`, and the audit always proceeds — one bad source can never block the run. To prevent partial overwrites, `persistFiles` now wraps the delete-then-insert snapshot replace in a single Drizzle transaction so a mid-pull crash rolls back to the last known-good corpus instead of leaving the source half-populated.
-   **SEO & Content**: The marketing site incorporates comprehensive SEO infrastructure, including a declarative SEO component, `robots.txt`, a build-time sitemap generator, and a blog with optimized long-form content.

## External Dependencies

-   **OpenAI**: Used for all AI functionalities via Replit AI Integrations proxy, specifically `gpt-5.2` in JSON mode.
-   **PostgreSQL**: Primary database.
-   **Clerk**: Authentication and user management.
-   **Requirements Management Tools**: DOORS Next, DOORS Classic, Jama, Polarion, Codebeamer, Helix RM, Visure, Azure DevOps, Jira.
-   **Defect Management Tools**: Jira, Azure DevOps, Bugzilla, Mantis, Redmine, YouTrack, ClickUp, Linear, ServiceNow, ALM Octane, GitHub Issues, GitLab Issues.
-   **Stripe**: (Pending integration) for subscription billing.