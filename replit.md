# Workspace

## Overview

Auditee is an AI-native enterprise platform designed to manage the entire Product Development Lifecycle (PDLC). It offers comprehensive tools for requirements management, traceability, compliance, defect tracking, and advanced AI-powered analysis and report generation. The platform aims to automate and streamline product development processes, providing a holistic solution for businesses. Key capabilities include AI-driven requirement generation, code analysis, compliance auditing, extraction from legacy systems, and natural language Q&A. The project includes a marketing landing page and a core application, with a focus on delivering a robust, AI-accelerated PDLC management experience.

## User Preferences

I prefer iterative development with clear communication at each stage. Ask before making major architectural changes or introducing new dependencies. For code, I prefer readable and maintainable solutions over overly clever or complex ones.

## System Architecture

The project is built as a pnpm workspace monorepo using Node.js v24 and TypeScript v5.9.

### UI/UX Decisions

The marketing site is optimized for SEO with extensive meta tags, Open Graph, Twitter Cards, and JSON-LD, along with `robots.txt` and `sitemap.xml`. The application (`/app/*`) is configured with `noindex, nofollow`. The application's navigation is structured logically, and a floating "Ask Auditee" button provides quick access to AI chat. The UI adheres to a branded `shadcn` appearance with Auditee purple (`#6366f1`) and Inter Tight font.

### Technical Implementations

The backend is an Express 5 API server mounted at `/api`. Data persistence is handled by PostgreSQL with Drizzle ORM. Zod and `drizzle-zod` are used for validation. API client code is generated from an OpenAPI specification using Orval. Frontend is developed with React and Vite. All external HTTP requests are routed through `lib/safe-fetch.ts` for SSRF protection. The system implements a robust authentication and authorization mechanism using Clerk (white-label) and a workspace-scoped, seat-based billing model.

### Enterprise Features

- **RBAC (4 roles)**: `owner`, `admin`, `editor`, `viewer`. The permission matrix lives in `artifacts/api-server/src/lib/permissions.ts` (`canManageBilling`, `canManageMembers`, `canChangeRoles`, `canManageSso`, `canViewAuditLog`, `canEditContent`, `canViewContent`). Server-side `permissionsFor()` and `isAtLeast()` are the authoritative checks. Legacy `member` rows are normalized to `editor` via `canonicalRole()`. Role changes on owner/admin targets are owner-only and serialized via `FOR UPDATE` locks; the last-owner demotion guard runs inside the same transaction.
- **Audit Log**: append-only `audit_logs` table (workspaceId, actorUserId, actorEmail, action, resourceType, resourceId, metadata jsonb, ip, userAgent, createdAt; indexed on workspaceId+createdAt). Mutations write rows via the best-effort `auditLog()` helper (`artifacts/api-server/src/lib/auditLog.ts`). Read endpoint `GET /api/workspace/audit-logs` requires admin+ role and Enterprise plan; UI at `/app/audit-logs` with filters and CSV export.
- **SSO (SAML / OIDC via Clerk Enterprise)**: `workspaces.sso_enabled` + `workspaces.sso_domain` for domain auto-routing. `POST /api/workspace/sso` is owner-only and Enterprise-only (returns 402 `requiresUpgrade` for Free/Pro). UI at `/app/sso` includes Okta / Entra ID / Google Workspace setup links. Plan downgrades from Enterprise automatically clear `sso_enabled` / `sso_domain`.
- **Plan-gating**: `planAllows(plan, feature)` enforces the Enterprise-only feature set (`audit_log`, `sso`). Endpoints return HTTP 402 with `requiresUpgrade: true` so the frontend can render upgrade CTAs.
- **Trust / Security center**: public `/security` page documents encryption (TLS 1.3, AES-256), SSO + RBAC + audit log capability, SOC 2 / ISO 27001 / GDPR / HIPAA posture (precise wording — "aligned with"/"designed for"/"ready for", never false "certified" claims), sub-processors list, and security@auditee.com vulnerability disclosure. Linked from the marketing nav (Resources) and footer.

AI features are accessible via `/api/ai/*` endpoints and include functionalities like `generate-requirements`, `analyze-code`, `compliance-audit`, `legacy-extract`, `ask`, `gap-analysis`, `promote`, and `estimate-effort`. AI document generators support various report types (e.g., `compliance_audit`, `requirements_summary`) and can export to DOCX/PDF/HTML, leveraging canonical blueprints. Standards-aware generation is a core feature, allowing AI outputs to conform to multiple regulatory frameworks (e.g., HIPAA, IEC 62304, SOC 2) through dynamic blueprint application. The system supports free-trial AI credits with a mechanism for anonymous and Free plan users, including atomic credit consumption and refund on failure.

### Feature Specifications

- **Project Management**: Users can create and manage projects, with persistent project selection.
- **Requirements Management Connectors**: Integrations with various RM tools (e.g., Doors Next, Jama, Jira) for importing and de-duplicating requirements.
- **Defect Management Connectors**: Integrations with multiple defect tracking systems (e.g., Jira, Azure DevOps, GitHub Issues) for importing and de-duplicating defects.
- **AI-powered Reporting**: Generation of various reports (e.g., BRD, PRD, test cases) with standards-aware content.
- **Standards Compliance**: AI generators and reports can adhere to multiple compliance standards, incorporating native rating vocabularies and framework-specific filters for traceability and CAPA.
- **SEO & Content**: The marketing site incorporates comprehensive SEO infrastructure, including a declarative SEO component, `robots.txt`, and a build-time sitemap generator. It features a blog with long-form content optimized for search intent, employing internal linking strategies and rich JSON-LD schemas.

## External Dependencies

-   **OpenAI**: Utilized for all AI functionalities via Replit AI Integrations proxy, specifically `gpt-5.2` in JSON mode.
-   **PostgreSQL**: The primary database for all application data.
-   **Clerk**: Handles authentication and user management.
-   **Various Requirements Management Tools**: DOORS Next, DOORS Classic, Jama, Polarion, Codebeamer, Helix RM, Visure, Azure DevOps, Jira (for requirements).
-   **Various Defect Management Tools**: Jira, Azure DevOps, Bugzilla, Mantis, Redmine, YouTrack, ClickUp, Linear, ServiceNow, ALM Octane, GitHub Issues, GitLab Issues.
-   **Stripe**: (Pending integration) for subscription billing.