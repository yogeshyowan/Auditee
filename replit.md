# Workspace

## Overview

Auditee is an AI-native enterprise platform for Product Development Lifecycle (PDLC) management. It provides tools for managing requirements, traceability, compliance, defects, and various AI-powered features for analysis and report generation. The project aims to streamline and automate complex aspects of product development, offering a comprehensive solution for businesses.

The platform includes a marketing landing page and a functional application accessible under `/app/*`. Key capabilities include AI-driven requirement generation, code analysis, compliance auditing, legacy system extraction, and natural language Q&A.

## User Preferences

I prefer iterative development with clear communication at each stage. Ask before making major architectural changes or introducing new dependencies. For code, I prefer readable and maintainable solutions over overly clever or complex ones.

## System Architecture

The project is a pnpm workspace monorepo utilizing TypeScript.

### UI/UX Decisions

The marketing site (`/`) is optimized for SEO, including comprehensive meta tags, Open Graph, Twitter Card tags, and JSON-LD for search engines. It also includes `robots.txt` and `sitemap.xml` for crawl management. The application (`/app/*`) uses a `noindex, nofollow` meta tag to prevent indexing.

The application's left-side navigation is structured for natural workflow, starting with "Project Sources" and ending with "Dashboard." An "Ask Auditee" floating button provides quick chat access, separate from the main navigation.

### Technical Implementations

- **Monorepo Tool**: pnpm workspaces
- **Node.js**: Version 24
- **TypeScript**: Version 5.9
- **API Framework**: Express 5
- **Database**: PostgreSQL with Drizzle ORM
- **Validation**: Zod (`zod/v4`) and `drizzle-zod`
- **API Codegen**: Orval (from OpenAPI spec)
- **Build Tool**: esbuild (CJS bundle)
- **Frontend**: React with Vite (`artifacts/eltegra-site`)
- **API Server**: Express mounted at `/api` (`artifacts/api-server`)
- **Database Schemas**: Managed by `lib/db`, including `projects`, `requirements`, `codeArtifacts`, `traceabilityLinks`, `complianceFrameworks`, `capaActions`, `defects`, and more.
- **API Specification**: OpenAPI source of truth in `lib/api-spec`, generating `api-zod` and `api-client-react`.
- **SSRF Protection**: All external HTTP fetches go through `lib/safe-fetch.ts`.

### Feature Specifications

- **Project Management**: Users can create new projects from the UI, with unique slugs auto-derived. Project selection persists even for newly created projects without sources.
- **Requirements Management Connectors**: Integrations with `doors_next`, `doors`, `jama`, `polarion`, `codebeamer`, `helix_rm`, `visure`, `azure_devops`, `jira_reqs`, and generic `reqif` for importing requirements. Requirements are de-duplicated by `(project_id, source_id, external_id)`.
- **Defect Management Connectors**: Integrations with `jira_defects`, `ado_defects`, `bugzilla`, `mantis`, `redmine`, `youtrack`, `clickup`, `linear`, `servicenow`, `alm_octane`, `github_issues`, `gitlab_issues` for importing defects. Defects are de-duplicated similarly to requirements.
- **AI Features**: All AI endpoints are under `/api/ai/*` and bypass OpenAPI codegen. They include:
    - `generate-requirements`: Drafts various requirement documents.
    - `analyze-code`: Classifies code against requirements and creates traceability links.
    - `compliance-audit`: Runs control-by-control audits.
    - `legacy-extract`: Extracts requirements from legacy code.
    - `ask`: Natural language Q&A with server-side conversation persistence.
    - `gap-analysis`: Identifies missing, duplicate, or conflicting requirements.
    - `promote`: Turns gap analysis findings into formal requirements.
    - `estimate-effort`: Per-requirement man-hour estimates + project-total roll-up. Surfaced as the "Estimate effort" Sheet on the Requirements page (joins `requirementCode` to live requirements list for titles).
    - `interview/questions`: Smart Interview discovery flow. Returns 5-10 normalised, allowlist-categorised follow-up questions. UI: `/app/interview` — 3-stage page (brief → answer → extract) where the extract step calls the existing `generate-requirements` endpoint with an enriched `Original brief + Q&A transcript` payload, so smart-interview reqs share the same persistence and activity-log path as regular AI generation.
- **AI Document Generators (Reports)**: `POST /api/reports/generate` supports `compliance_audit`, `requirements_summary`, `traceability`, `exec_brief`, `brd`, `prd`, `frd`, `test_cases`. Reports use canonical blueprints and auto-export to DOCX/PDF/HTML.
- **Standards-aware Generation**: All AI generators (`/api/reports/generate`, `/api/ai/generate-requirements`, `/api/ai/interview/questions`) accept a multi-standard selection (`frameworkIds[]` for reports, `applicableFrameworkIds[]` for requirements/interview). The same selector applies to BOTH `brief` mode AND `code` mode in generate-requirements, so requirements derived from pasted/uploaded/GitHub-fetched code also conform to the chosen standards. Each selected framework is matched to a blueprint in `lib/standards-blueprints.ts` declaring required document sections, requirement-coverage topics, and citation hints. The blueprint addendum is appended to the system prompt so generated artefacts genuinely conform to HIPAA, IEC 62304, SOC 2, ISO 27001, FDA 21 CFR Part 11, GDPR, PCI DSS, NIST CSF/800-53, ISO 13485/26262, IEC 61508/62443, DO-178C, ASPICE, CMMI, EU AI Act, NIS2, DORA, etc. Requirement-count cap scales with the total coverage-topic count (capped at 60) so multi-standard selections are mathematically satisfiable. `compliance_audit` reports require ≥1 standard (server returns 400; UI disables submit). The shared `<StandardsMultiSelect>` component (Popover + Checkbox) wires the selector into Reports, Requirements (Generate-from-brief AND Generate-from-code), and Interview pages.
- **Source-aware Filtering**: The Requirements page filters by source (manual or external RM tools).
- **Standard-aware CAPA Filters**: The CAPA page filters actions by compliance framework.
- **Per-framework Traceability Filter**: The Traceability page scopes the graph to a single compliance framework.
- **Standard-native Audit Ratings**: Compliance audits return `nativeRating` blocks expressed in the audited framework's vocabulary, derived deterministically from `compliancePercentage` and per-control verdicts.
- **Marketing site**: `/` Home, `/features`, plus five capability deep-link pages — `/ai-product-development` (PDLC pipeline with stage cards), `/automated-compliance` (continuous evidence + 23-framework grid + 5-step "how it works"), `/ai-requirements-management` (9-capability grid + 10 RM-tool connector cards + 5-step flow), `/missing-requirements-analysis` (4 finding-type cards + 8-category scan + Gap-Detection deep dive), `/test-case-generation` (TC anatomy table + 6-capability grid + 4-step QA flow). Plus `/pricing`, `/roi-calculator`, `/about`, `/contact`. All five capability pages are surfaced from the Home page Platform nav dropdown.

## SEO & Content (eltegra-site)

Comprehensive per-page SEO infrastructure plus a long-form content engine designed to win search-listing real estate for buyer-intent and standards-research queries.

### Core SEO infrastructure

- **`src/components/SEO.tsx`** — declarative `<SEO>` component (no react-helmet — pure `useEffect` head manager). Each page passes `title`, `description`, `path`, `keywords[]`, optional `jsonLd`, `breadcrumbs`, `article`. Tags it adds are marked with a `data-seo-managed` attribute, so unmount/route-change cleanup never disturbs static tags in `index.html`. Helpers exported: `breadcrumbsLd`, `faqLd`, `articleLd`. `SITE_URL = https://auditee.eltegra.ai` is the canonical origin used for all canonical/OG URLs.
- **`public/robots.txt`** — allows `/`, blocks `/app/*`, points to the sitemap, and explicitly disallows GPTBot, anthropic-ai, ClaudeBot, CCBot and Google-Extended training crawlers.
- **`scripts/generate-sitemap.mjs`** — build-time generator that enumerates the canonical static routes plus every blog post in `src/content/blog/` and writes `public/sitemap.xml` (with image entries for the home hero). Wired as `prebuild` in `package.json` so every deploy ships a fresh sitemap; also exposed as `pnpm --filter @workspace/eltegra-site sitemap`.
- **Shared chrome** — `src/components/site/Chrome.tsx` exports `Navigation`, `SiteFooter`, `DemoDialog`, and `NAV_GROUPS`. Replaces previously duplicated nav/footer code on `Home.tsx`. Navigation surfaces Blog under the Resources mega-menu; SiteFooter ships real internal links plus a `sitemap.xml` link, improving internal-linking density.

### Per-page SEO use cases (the matrix)

| Route | Primary intent targeted | JSON-LD beyond default Org/SoftwareApp/WebSite |
| --- | --- | --- |
| `/` | Brand + category capture ("AI requirements management", "PDLC platform", "audit automation") | FAQPage (4 high-intent Qs about Auditee, supported standards, RM imports, code-to-requirements) |
| `/features` | Feature-set discovery, competitor comparisons | — |
| `/pricing` | Buyer-intent pricing/decision queries | FAQPage (free tier, on-prem/air-gapped, no-training-on-data, frameworks included) |
| `/roi-calculator` | Bottom-funnel "compliance ROI" / "audit savings" queries | — |
| `/about` | Brand, careers, press queries | — |
| `/contact` | Sales/demo/press/support queries | — |
| `/ai-product-development` | "AI PRD generation", "AI BRD", "Smart Interview" | — |
| `/automated-compliance` | 23-framework compliance keywords (SOC 2, HIPAA, IEC 62304, ASPICE, ISO 26262, FDA QMSR, etc.) | — |
| `/ai-requirements-management` | DOORS / Jama / Polarion alternative + OSLC / ReqIF queries | — |
| `/missing-requirements-analysis` | "AI gap detection", "missing requirements", coverage queries | — |
| `/test-case-generation` | "AI test case generation", "requirements-based testing" | — |
| `/blog` | Hub page for content marketing; tag-filtered index | Blog schema |
| `/blog/:slug` | Long-tail keyword capture per article | Article + BreadcrumbList |

### Blog content use cases

Long-form posts stored as TS modules under `src/content/blog/*.ts`, catalogued in `src/content/blog/index.ts` (exposes `POSTS`, `getPost(slug)`, `getRelatedPosts(slug, limit)`, `allTags`). Each post renders through `pages/BlogPost.tsx` with `react-markdown` + `remark-gfm` and uses the `@tailwindcss/typography` `prose` preset.

Initial 6-post launch (each ~10–13 min read, optimized for top-of-funnel and buyer-intent queries):

1. **AI Requirements Management: A Buyer's Guide for 2026** — buyer's-guide intent, RM-tool evaluation criteria, comparison framing.
2. **IEC 62304: Medical Device Software Lifecycle Guide (2026)** — standards-research intent, software safety classification (Class A/B/C), required deliverables.
3. **SOC 2 vs ISO 27001: Which Framework Should You Choose?** — high-volume comparison query, decision matrix.
4. **Generating Requirements from Legacy Code** — modernization use case targeting COBOL / legacy estate audiences.
5. **Top 10 IBM DOORS Alternatives (2026)** — "alternatives" SERP capture, head-to-head comparison.
6. **HIPAA Software Compliance Requirements Checklist** — checklist intent, healthcare buyer persona.

Tag taxonomy spans Requirements Management, AI, Buyer's Guide, IEC 62304, Medical Devices, Compliance, SOC 2, ISO 27001, Security, Standards, Legacy Modernization, COBOL, Migration, Enterprise, Healthcare, HIPAA, IBM DOORS, Comparison, Checklist — driving related-post recirculation and tag-filter pages on `/blog`.

### Internal-linking use cases

- New shared `Navigation` includes Blog under Resources, surfacing fresh content to crawlers from every page.
- New `SiteFooter` ships four columns of real internal links (Platform / Solutions / Company / Resources) plus a `sitemap.xml` link, replacing the prior `href="#"` placeholders.
- Each blog post links to up to 3 related posts via `getRelatedPosts(slug)` (tag-overlap scoring), creating an internal hub-and-spoke graph.
- Breadcrumb JSON-LD on every blog post explicitly declares the `Home → Blog → Post` hierarchy to search engines.

## Auth, Workspaces & Billing

Auditee uses Clerk (Replit-managed white-label) for authentication and a workspace-scoped seat-based billing model.

### Plans

| Plan | Price | Seats |
|---|---|---|
| Free | $0 | 1 user |
| Professional | $499/mo | 4 users |
| Enterprise | $2,599/mo | 20 users |

`PLAN_TIERS` and `PLAN_SEATS` live in `lib/db/src/schema/workspaces.ts` so the cap is a single source of truth across schema + API + UI.

### Auth flow

- `eltegra-site` is wrapped in `<ClerkProvider>` with a branded `shadcn` appearance (Auditee purple `#6366f1`, Inter Tight font, custom logo at `public/logo.svg`).
- `/sign-in` and `/sign-up` are public routes rendering Clerk's `<SignIn>` / `<SignUp>`. Both hard-code `routing="path"` plus the artifact base path so wouter routing stays correct.
- Marketing nav (`Chrome.tsx`) shows "Sign in" + "Get started" when signed-out and "Launch Platform" when signed-in via Clerk's `<Show when="signed-in|signed-out">`.
- `/app/*` is gated client-side via `<Show>`; signed-out users redirect to `/sign-in`. **All sensitive mutations are also enforced server-side** — client gating is UX only.
- The api-server proxies Clerk's frontend requests via `clerkProxyMiddleware` mounted at `CLERK_PROXY_PATH`, then `clerkMiddleware()` reads sessions on every API call.
- CORS uses an explicit allowlist (REPLIT_DEV_DOMAIN, SITE_URL, `auditee.eltegra.ai`, localhost) — never `origin: true` with credentials.

### Workspaces & seat enforcement

- `workspaces` table: one row per owner, enforced by a unique index on `owner_user_id`.
- `workspace_members` table: one row per (workspace, user), enforced by a unique index on `(workspace_id, user_id)`.
- A free workspace is auto-provisioned on the first authenticated request via `getOrCreateWorkspace()`. Concurrent first-time calls are serialized by the unique index + `ON CONFLICT DO NOTHING` + re-select fallback.
- Invite flow: owner POSTs an email; we insert a member row with `userId = "pending:<email>"`. On that user's first sign-in, `reconcilePendingInvites()` swaps the placeholder for their real Clerk userId.
- All seat-cap checks (invite, plan downgrade) wrap a `SELECT … FOR UPDATE` on the workspace row + `count(*)` over members inside a transaction. This serializes concurrent invites/plan changes against one another, preventing the workspace from exceeding `seatLimit`.
- Owner-only mutations (`POST /workspace/members`, `DELETE /workspace/members/:id`, `POST /workspace/plan`) are rejected with 403 server-side for non-owners.

### Billing & Team page (`/app/billing`)

Single page that shows the current plan + seat usage, three plan cards with "Activate" buttons, an invite-by-email form (disabled at cap), and a members table with remove buttons (owner only). Uses `useAuth().getToken()` to attach a Bearer token to every API call as a defense-in-depth alongside the Clerk session cookie.

### Free-trial AI credits

The Free plan and unauthenticated visitors share a hard-capped 6-generation budget so prospects can experience AI generation before signing up:

- **Anonymous visitors**: on first call to a credit-gated endpoint the API mints a UUID `trial_id`, stores `(trial_id, credits_used=0)` in `anonymous_trials`, and sets a signed HttpOnly `auditee_trial` cookie (HMAC over the id with `SESSION_SECRET`). Subsequent calls atomically increment `credits_used` under the global cap. After 6, the API returns `402 { requiresLogin: true, … }` and the frontend's global `<UpsellDialog>` shows a "Sign up — it's free" CTA.
- **Signed-in Free plan**: the same atomic conditional UPDATE pattern runs against `workspaces.creditsUsed`. After 6 the API returns `402 { requiresUpgrade: true, … }` and the modal shows an "Upgrade plan" CTA pointing to `/app/billing`.
- **Professional / Enterprise**: limit is `-1` sentinel = unlimited; the middleware skips the DB write entirely and just sets `x-credits-remaining: -1`.
- **Reserve + refund**: `consumeCredit` increments before the route handler runs, then registers `res.on('finish')` to atomically decrement when the response status is `>=400` — so failed validations or AI outages don't burn the user's allowance.
- **Gated endpoints**: every AI-costly route — `/ai/generate-requirements`, `/ai/compliance-audit`, `/ai/traceability-audit`, `/ai/gap-analysis`, `/ai/interview/questions`, `/ai/analyze-code`, `/ai/legacy-extract`, `/ai/ask`, `/ai/estimate-effort`, `/reports/generate`, `/reports/:id/refine` — runs the middleware.
- **Frontend**: `creditAwareFetch` (in `lib/credits.ts`) wraps `aiFetch` and `jfetch`. It always sends `credentials: "include"` so the trial cookie + Clerk session flow with each call, and dispatches the `auditee:upsell` window event on 402. The `<UpsellDialog>` mounted in `App.tsx` listens for that event and shows the appropriate modal — no per-feature error-handling required.
- The Billing page surfaces "AI credits: X / Y used" alongside seat usage; Free tier shows "Unlimited" for paid plans.

### Pending integrations (require user action)

- **Microsoft OAuth**: Replit-managed Clerk gives Google for free; for Microsoft sign-in, the user must open the Auth pane and add their Azure AD application credentials.
- **Stripe billing**: `POST /api/workspace/plan` currently activates plans directly. To swap in real Stripe Checkout + webhook-driven plan activation, the user must connect Stripe via the Integrations panel.

## External Dependencies

- **OpenAI**: Used for all AI features via Replit AI Integrations proxy, specifically `gpt-5.2` in JSON mode.
- **PostgreSQL**: Primary database for all application data.
- **Various RM Tools**: DOORS Next, DOORS Classic, Jama, Polarion, Codebeamer, Helix RM, Visure, Azure DevOps, Jira (for requirements).
- **Various Defect Management Tools**: Jira, Azure DevOps, Bugzilla, Mantis, Redmine, YouTrack, ClickUp, Linear, ServiceNow, ALM Octane, GitHub Issues, GitLab Issues.