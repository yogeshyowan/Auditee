# Workspace

## Overview

Auditee is an AI-native enterprise platform designed to manage the entire Product Development Lifecycle (PDLC). It provides comprehensive tools for requirements management, traceability, compliance, defect tracking, and advanced AI-powered analysis and report generation. The platform aims to automate and streamline product development processes, offering AI-driven requirement generation, code analysis, compliance auditing, extraction from legacy systems, and natural language Q&A. The business vision is to transform product development efficiency and compliance through AI-accelerated PDLC management.

## User Preferences

I prefer iterative development with clear communication at each stage. Ask before making major architectural changes or introducing new dependencies. For code, I prefer readable and maintainable solutions over overly clever or complex ones.

## System Architecture

The project is structured as a pnpm workspace monorepo using Node.js and TypeScript.

### UI/UX Decisions

The marketing site is optimized for SEO, while the application (`/app/*`) is configured for `noindex, nofollow`. The application features a logical navigation and a floating "Ask Auditee" AI chat button. The UI adheres to a branded `shadcn` appearance with Auditee purple (`#6366f1`) and Inter Tight font.

### Technical Implementations

The backend is an Express 5 API server. Data persistence is managed by PostgreSQL with Drizzle ORM, utilizing Zod for validation. API client code is generated from an OpenAPI specification. The frontend is built with React and Vite. All external HTTP requests are routed through `lib/safe-fetch.ts` for SSRF protection. Authentication and authorization are handled by Clerk, supporting a workspace-scoped, seat-based billing model.

### Enterprise Features

-   **RBAC**: Four workspace roles (`owner`, `admin`, `editor`, `viewer`) and four project roles (`manager`, `developer`, `reviewer`, `auditor`) with detailed permission matrices and server-side checks.
-   **Audit Log**: An append-only `audit_logs` table records all mutations with read access for admin+ roles and Enterprise plans. Each row now carries a SHA-256 `integrity_hash` over its canonical fields (id, workspaceId, actorUserId, action, resourceType, resourceId, createdAt) for offline tamper-detection.
-   **Security Event Log**: A `logSecurityEvent()` helper writes `security.*` actions (permission denials, rate-limit hits, suspicious input) to the same audit trail; fired automatically on every 403 from project-access checks.
-   **HTTP Security Headers (Helmet)**: Every API response carries `Strict-Transport-Security` (2 yr + preload), `Content-Security-Policy` (deny-all for this pure-API origin), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (camera/mic/geo/payment/usb/bluetooth all denied), and `X-Powered-By` removed.
-   **IP Rate Limiting**: Four tiers via `express-rate-limit` — general (200 req/15 min), workspace/auth-adjacent (30 req/15 min), AI generation (20 req/15 min), billing webhook (60 req/min). All keyed by the first `X-Forwarded-For` IP.
-   **Audit Coverage**: Requirements `create`, `update`, `delete` now produce `requirement.*` audit rows in addition to the existing `project.*`, `workspace.*` events.
-   **SSO**: SAML / OIDC via Clerk Enterprise for owner-only, Enterprise-only access.
-   **Plan-gating**: Features are gated by plan, returning HTTP 402 for Free/Pro plans.
-   **Trust / Security Center**: A public page detailing security posture and compliance.

AI features are exposed via `/api/ai/*` endpoints for `generate-requirements`, `analyze-code`, `compliance-audit`, `legacy-extract`, `ask`, `gap-analysis`, `promote`, and `estimate-effort`. AI document generators support various report types (e.g., `compliance_audit`, `requirements_summary`) and can export to DOCX/PDF/HTML, leveraging canonical blueprints. Standards-aware generation allows AI outputs to conform to multiple regulatory frameworks. Free-trial AI credits are provided for anonymous and Free plan users.

### Pricing & Credit Model

A single source of truth for pricing/seats/credits is defined in `lib/db/src/schema/workspaces.ts` with tiers: Free, Standard, Professional, and Enterprise, each with specific seats and monthly AI credits. One credit equals one successful AI generation, with failures auto-refunded. Anonymous users receive a Free allowance tracked locally and verified server-side.

### Feature Specifications

-   **Project Management**: Creation and management of projects.
-   **Requirements Management Connectors**: Integrations with various RM tools (e.g., Doors Next, Jama, Jira) for importing requirements.
-   **Defect Management Connectors**: Integrations with multiple defect tracking systems (e.g., Jira, Azure DevOps, GitHub Issues) for importing defects.
-   **AI-powered Reporting**: Generation of various reports (e.g., BRD, PRD, test cases) with standards-aware content.
-   **Standards Documentation Set**: Five dedicated AI report kinds for engineering documentation conforming to international standards (e.g., `architecture_doc`, `hld`, `lld`).
-   **Standards Compliance**: AI generators and reports adhere to multiple compliance standards, incorporating native rating vocabularies and framework-specific filters.
-   **Medical Device Standards Bundle**: A comprehensive set of medical-device regulatory frameworks (e.g., IEC 60601, ISO 13485, FDA 21 CFR Part 820) available across compliance audits and document generation.
-   **Company Letterhead Templates**: Per-workspace `.docx` templates for custom branding on PDLC reports with dynamic placeholders.
-   **5-Stage Lifecycle Traceability**: End-to-end traceability across Architecture, Design, Implementation, Testing, and Deployment, visualized with completeness badges and AI-driven recommendations.
-   **Automated Control Closure & Evidence Locker**: Compliance controls auto-close with new evidence, maintaining a full evidence trail.
-   **Test Management & Notifications**: A dedicated test-cases module with AI-powered suite generation and automated notifications for stale requirements.
-   **Multi-Level Test Suite Generation & AI Execution**: Test cases span ISTQB-aligned levels and eleven disciplines, generated from various sources in static or dynamic mode. An AI executor evaluates cases and produces a `Test Execution Report`, exportable as a ZIP bundle.
-   **Push to Connected GitHub Repo**: A reusable affordance to commit generated artifacts (reports, test bundles, CAPA actions) to a project's connected GitHub repository using the GitHub Git Data API.
-   **Pre-Audit Source Auto-Pull**: Before scheduled compliance audits, the system automatically refreshes all linked sources (GitHub, RM tools, defect tools, remote systems) to ensure AI evaluates the current state.
-   **Tutorial Videos (Dark Theme)**: The `auditee-tutorial` artifact uses a dark theme (`--color-bg-dark: #0b0f1a`, `--color-bg-muted: #1a1630`) with light text across all video scenes (Scene1-5, ScenePayment, CaseIntake/Requirements/Traceability/Report/Audit/Gaps/Capa/Workflow/Conclude) and all 17 module files. Shorts (9:16 format) hide the AppShell sidebar via `.short-mode` CSS class and `data-appshell-*` attributes.
-   **SEO & Content**: The marketing site incorporates comprehensive SEO infrastructure, including a declarative SEO component, `robots.txt`, a build-time sitemap generator, and a blog.
-   **Hetzner / Docker Deployment**: The codebase supports deployment on Replit or a self-hosted Hetzner VPS via `docker compose up -d` with `db`, `api`, and `web` containers. Replit-specific code paths are gated and activate only when relevant environment variables are present.
-   **Lead Capture & Google Sheet Sync**: Every signed-in user (signup, login, and waitlist click) is captured into the `lead_captures` table with a unique `(email, source)` constraint. A "Join the waitlist with Google" button on the marketing pages opens Clerk's Google OAuth modal. Captures are appended as new rows to a Google Sheet via the connected Replit `google-sheet` integration (OAuth-based; no Apps Script or service account required) when `GOOGLE_SHEET_ID` is set. The sheet's header row is created automatically on the first append, and any rows captured before the integration was wired up are back-filled on the next API server start. An admin page at `/app/admin/leads` lists every captured row newest-first with a per-row green/red sheet-sync indicator and a "Resync all unforwarded" button. Access requires both the workspace `owner` role AND a match in the `LEAD_ADMIN_EMAILS` env var allowlist (comma-separated emails). Both checks are required because `lead_captures` is a single global table (not workspace-scoped) and `requireWorkspace` auto-creates a workspace where the caller is owner — an owner-only check by itself would let any signed-in user read every other user's signup PII. The "Captured Leads" sidebar entry is hidden for users who do not pass both checks; direct navigation shows a 403 card.

## External Dependencies

-   **OpenAI**: Used for all AI functionalities (via Replit AI Integrations proxy or `OPENAI_API_KEY`).
-   **PostgreSQL**: Primary database.
-   **Clerk**: Authentication and user management.
-   **Requirements Management Tools**: DOORS Next, DOORS Classic, Jama, Polarion, Codebeamer, Helix RM, Visure, Azure DevOps, Jira.
-   **Defect Management Tools**: Jira, Azure DevOps, Bugzilla, Mantis, Redmine, YouTrack, ClickUp, Linear, ServiceNow, ALM Octane, GitHub Issues, GitLab Issues.
-   **Razorpay**: Live billing. Monthly plans (Standard ₹1,999 / Professional ₹7,999) use Razorpay Subscriptions (auto-renew). Annual plans (Standard ₹19,990 / Professional ₹79,990) use one-time Razorpay Orders (no auto-renew, RBI ₹15k cap workaround; expire after 12 months). Enterprise is contact-sales only. Keys live in `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`. Webhook URL: `https://<domain>/api/billing/webhook` — register in Razorpay dashboard with events: `payment.captured`, `subscription.activated`, `subscription.charged`, `subscription.cancelled`, `subscription.completed`, `subscription.halted`, `order.paid`. All HMAC verification (checkout + webhook) uses timing-safe comparison. The `billingPlanSync.ts` helper is the single source of truth for workspace plan transitions; it contains a CAS guard to prevent stale webhook events from re-granting paid access.