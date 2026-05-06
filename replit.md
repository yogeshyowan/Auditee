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
-   **Lead Admin Access**: Access to `/app/admin/leads` requires both `owner` role and `LEAD_ADMIN_EMAILS` allowlist match, due to `lead_captures` being a global table.
-   **Razorpay RBI Cap**: Annual plans use one-time orders to work around the RBI ₹15k auto-renew cap.
-   **AI Fallbacks**: AI features gracefully fall back (e.g., when `OPENAI_API_KEY` is unset or pipeline errors occur).

## Pointers

-   **Clerk Documentation**: `https://clerk.com/docs`
-   **Drizzle ORM Documentation**: `https://orm.drizzle.team/docs`
-   **Zod Documentation**: `https://zod.dev/`
-   **Shadcn UI Documentation**: `https://ui.shadcn.com/docs`
-   **OpenAPI Specification**: `https://spec.openapis.org/oas/v3.1.0`
-   **Express Rate Limit**: `https://www.npmjs.com/package/express-rate-limit`
-   **Helmet**: `https://helmetjs.github.io/`