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
- **Standards-aware Generation**: All AI generators (`/api/reports/generate`, `/api/ai/generate-requirements`, `/api/ai/interview/questions`) accept a multi-standard selection (`frameworkIds[]` for reports, `applicableFrameworkIds[]` for requirements/interview). Each selected framework is matched to a blueprint in `lib/standards-blueprints.ts` declaring required document sections, requirement-coverage topics, and citation hints. The blueprint addendum is appended to the system prompt so generated artefacts genuinely conform to HIPAA, IEC 62304, SOC 2, ISO 27001, FDA 21 CFR Part 11, GDPR, PCI DSS, NIST CSF/800-53, ISO 13485/26262, IEC 61508/62443, DO-178C, ASPICE, CMMI, EU AI Act, NIS2, DORA, etc. Requirement-count cap scales with the total coverage-topic count (capped at 60) so multi-standard selections are mathematically satisfiable. `compliance_audit` reports require ≥1 standard (server returns 400; UI disables submit). The shared `<StandardsMultiSelect>` component (Popover + Checkbox) wires the selector into Reports, Requirements (Generate-from-brief), and Interview pages.
- **Source-aware Filtering**: The Requirements page filters by source (manual or external RM tools).
- **Standard-aware CAPA Filters**: The CAPA page filters actions by compliance framework.
- **Per-framework Traceability Filter**: The Traceability page scopes the graph to a single compliance framework.
- **Standard-native Audit Ratings**: Compliance audits return `nativeRating` blocks expressed in the audited framework's vocabulary, derived deterministically from `compliancePercentage` and per-control verdicts.
- **Marketing site**: `/` Home, `/features`, plus five capability deep-link pages — `/ai-product-development` (PDLC pipeline with stage cards), `/automated-compliance` (continuous evidence + 23-framework grid + 5-step "how it works"), `/ai-requirements-management` (9-capability grid + 10 RM-tool connector cards + 5-step flow), `/missing-requirements-analysis` (4 finding-type cards + 8-category scan + Gap-Detection deep dive), `/test-case-generation` (TC anatomy table + 6-capability grid + 4-step QA flow). Plus `/pricing`, `/roi-calculator`, `/about`, `/contact`. All five capability pages are surfaced from the Home page Platform nav dropdown.

## External Dependencies

- **OpenAI**: Used for all AI features via Replit AI Integrations proxy, specifically `gpt-5.2` in JSON mode.
- **PostgreSQL**: Primary database for all application data.
- **Various RM Tools**: DOORS Next, DOORS Classic, Jama, Polarion, Codebeamer, Helix RM, Visure, Azure DevOps, Jira (for requirements).
- **Various Defect Management Tools**: Jira, Azure DevOps, Bugzilla, Mantis, Redmine, YouTrack, ClickUp, Linear, ServiceNow, ALM Octane, GitHub Issues, GitLab Issues.