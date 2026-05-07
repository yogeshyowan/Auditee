# Auditee

Auditee is an AI-native enterprise platform for managing the entire Product Development Lifecycle (PDLC) with AI-powered analysis and report generation.

## Run & Operate

-   **Run Dev Server**: `pnpm dev`
-   **Build**: `pnpm build`
-   **Typecheck**: `pnpm typecheck`
-   **Codegen**: `pnpm codegen` (for OpenAPI client)
-   **DB Push**: `pnpm db:push` (Drizzle ORM schema migrations)

**Required Environment Variables**:
`OPENAI_API_KEY`, `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `GITHUB_WEBHOOK_SECRET`, `SLACK_WEBHOOK_URL`, `TEAMS_WEBHOOK_URL`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `GOOGLE_SHEET_ID`, `LEAD_ADMIN_EMAILS`

**Optional AI fallback keys**:
`OPENROUTER_API_KEY`, `OPENROUTER_API_KEY_2`…`OPENROUTER_API_KEY_21`, `ANTHROPIC_API_KEY` — see Architecture decisions for rotation order.

## Stack

-   **Frameworks**: React, Express 5
-   **Runtime**: Node.js, TypeScript
-   **ORM**: Drizzle ORM
-   **Validation**: Zod
-   **Build Tool**: Vite
-   **Auth**: Clerk

## Where things live

-   **Backend API**: `packages/api/src/routes/`
-   **Frontend App**: `packages/app/src/pages/`
-   **Database Schema**: `packages/db/src/schema/`
-   **AI Logic**: `packages/api/src/lib/ai/`
-   **OpenAPI Spec**: `packages/api/openapi.yaml`
-   **UI Components**: `packages/ui/src/components/`
-   **Marketing Site**: `packages/marketing/src/pages/`
-   **Prompt Library Data**: `artifacts/eltegra-site/src/data/promptLibrary.ts`
-   **UI Theme/Branding**: `packages/app/src/index.css` (uses Shadcn, Auditee purple, Inter Tight font)

## Architecture decisions

-   **Monorepo Structure**: pnpm workspace for managing multiple packages (api, app, db, ui, marketing).
-   **AI RAG Implementation**: Per-project RAG using `pgvector` for contextual AI responses, with graceful fallback.
-   **Multi-step AI Extraction**: Complex document analysis uses a pipeline of focused LLM calls for classification and entity extraction, improving accuracy over single-prompt approaches.
-   **Deterministic Traceability**: Traceability scoring is based on graph traversal of database relationships, not LLM self-scoring, ensuring accuracy and auditability.
-   **External HTTP Routing**: All external HTTP requests go through `lib/safe-fetch.ts` for SSRF protection.
-   **Multi-provider repo fetch**: `/ai/fetch-code-url` accepts URLs from GitHub, GitLab (SaaS + self-hosted), Bitbucket Cloud, Azure DevOps, and self-hosted Gitea/Forgejo. Self-hosted hosts must be allowlisted via `GITEA_HOSTS` / `GITLAB_HOSTS` / `BITBUCKET_HOSTS` / `AZURE_DEVOPS_HOSTS` env vars. Each provider has its own URL parser, default-branch resolver, tree lister, and raw-URL builder; all fetches route through `fetchAllowlistedFollow` for per-hop SSRF re-validation.
-   **Security Headers**: Comprehensive HTTP security headers applied via Helmet for API responses.

## Product

-   **Requirements Management**: AI-powered generation, extraction, and management of requirements.
-   **Traceability**: 5-stage lifecycle traceability with AI-driven recommendations.
-   **Compliance**: AI-driven compliance auditing, standards-aware generation, and automated control closure.
-   **Defect Tracking**: Integration with various defect management systems.
-   **AI-powered Reporting**: Generation of BRD, PRD, test cases, and other standards-compliant documents.
-   **Code Analysis**: Static code analysis for legacy systems and business rule extraction.
-   **Project Management**: Creation and management of development projects.
-   **User/Role Management**: RBAC with workspace and project-level roles.
-   **Audit & Security Logs**: Append-only audit logs with integrity hashes and security event logging.
-   **Integrations**: GitHub webhooks for continuous gap detection, Slack/MS Teams notifications.
-   **Billing**: Subscription-based plan gating with Razorpay integration.
-   **Lead Capture**: Google Sheet sync for user sign-ups and waitlist.

## User preferences

I prefer iterative development with clear communication at each stage. Ask before making major architectural changes or introducing new dependencies. For code, I prefer readable and maintainable solutions over overly clever or complex ones.

## Gotchas

-   **GitHub Webhook Secret**: `GITHUB_WEBHOOK_SECRET` must be configured for GitHub integration to work; otherwise, it returns a 503.
-   **GitHub PAT fallback**: When a project's GitHub source has no per-source `token`, both the read path (`lib/source-ingestion.ts → ingestGithub`) and the write path (`routes/repoPush.ts → loadGithubSource`) fall back to `process.env.GITHUB_PAT`. This lifts anonymous reads off GitHub's 60-req/hour rate limit and lets pushes succeed against any repo the platform PAT can write to. Per-source tokens still take precedence — needed for private repos or pushing to user-owned repos the platform PAT can't write to.
-   **Lead Admin Access**: Access to `/app/admin/leads` requires both `owner` role and `LEAD_ADMIN_EMAILS` allowlist match, due to `lead_captures` being a global table.
-   **Razorpay RBI Cap**: Annual plans use one-time orders to work around the RBI ₹15k auto-renew cap.
-   **AI Fallbacks**: AI features gracefully fall back (e.g., when `OPENAI_API_KEY` is unset or pipeline errors occur).
-   **Persisted audits**: Run-Audit and Traceability dialogs persist their last result to `audit_runs` and re-hydrate on dialog open via `GET /ai/audit-runs/latest?sourceId=&kind=&frameworkId=` — users can re-open without re-spending an AI credit. Reports can be downloaded as `.md`, `.csv`, or `.pdf` (PDF uses the browser's native print-to-PDF dialog, no extra deps).
-   **AI Provider Chain**: `lib/ai.ts` runs providers in order — BYO (workspace key) → OpenRouter keys 1-5 (each `OPENROUTER_API_KEY[_N]`, free quotas first) → OpenAI → Anthropic. Paid OpenAI / Anthropic keys are only spent after every OpenRouter slot is exhausted. `isRetryable` + `classifyProviderError` treat 401/402/403/408/429/5xx and provider-specific quota errors (Anthropic "credit balance is too low", OpenRouter `insufficient_credits`) as retryable, so a depleted key automatically advances to the next.
-   **AI JSON repair**: `parseJson` in `lib/ai.ts` runs a `tryRepairTruncatedJson` pass when `JSON.parse` fails — it closes any still-open arrays/objects/strings and drops the trailing partial element so a provider hitting `max_tokens` mid-stream returns a usable (slightly shorter) payload instead of a 502. Downstream reconcilers (e.g. `/ai/traceability-audit`) treat omitted entries as "fully missing", so completeness scores are never silently inflated.
-   **Company DOCX template**: `lib/companyTemplate.ts` → `renderWithCompanyTemplate(workspaceId, report)` runs Docxtemplater over the body XML only. Header/footer XML parts (`word/header*.xml`, `word/footer*.xml`) are snapshotted before render and restored byte-for-byte after, so customer letterheads/logos/page-numbers survive untouched even if they contain `{curly}` text. `{title}` defaults to the report name with any "Auditee Report:" prefix stripped; `{subtitle}` defaults to the project name (looked up via `projectsTable.name`); `{date}` is plain text — users can delete the placeholder to omit it; `{generated_by}` resolves to "Auditee" only when `workspaces.plan === 'free' | 'trial'` and to "" on any paid plan (white-label).
-   **Requirement code allocation**: ALL requirement inserts must go through `lib/insertRequirement.ts`. It allocates a unique `{prefix}-{NNNN}` code under a per-project `pg_advisory_xact_lock`, with `requirements_project_code_unique (project_id, code)` as the hard backstop and a retry-on-23505 loop for cross-process races. Never write `count()+1`-style code-allocation in route handlers — it will produce duplicates under load. Existing duplicates (Apr 2026) were one-shot renumbered before the unique index was added.

## Pointers

-   **Clerk Documentation**: `https://clerk.com/docs`
-   **Drizzle ORM Documentation**: `https://orm.drizzle.team/docs`
-   **Zod Documentation**: `https://zod.dev/`
-   **Shadcn UI Documentation**: `https://ui.shadcn.com/docs`
-   **OpenAPI Specification**: `https://spec.openapis.org/oas/v3.1.0`
-   **Express Rate Limit**: `https://www.npmjs.com/package/express-rate-limit`
-   **Helmet**: `https://helmetjs.github.io/`