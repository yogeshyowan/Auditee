import type { BlogPost } from "./index";

export const post: BlogPost = {
  slug: "from-jira-tickets-to-compliant-requirements",
  title: "From Jira Tickets to Compliant Requirements: A Working Conversion Guide",
  description:
    "Why Jira and similar issue trackers are not requirements management — and a step-by-step conversion path that preserves engineering velocity while meeting ISO/IEC/IEEE 29148.",
  date: "2026-01-28",
  author: "Auditee Research",
  tags: ["Requirements", "Jira", "ALM", "ISO/IEC 29148", "DevOps"],
  readingTimeMin: 10,
  excerpt:
    "Engineering organisations love Jira because it ships work. Auditors hate Jira because it does not specify it. Here is how to bridge the two without slowing the team down.",
  body: `## Why Jira is not requirements management

Jira (or Linear, Azure Boards, Shortcut, GitHub Issues — same shape) is excellent at:

- Tracking *work to do*.
- Routing work between contributors.
- Capturing decisions made *during* delivery.
- Reporting velocity and burndown.

It is structurally weak at:

- Stable, versioned identifiers for the *thing being built* rather than the work item.
- Bidirectional links between specification, design, code, test, and verification.
- Baselining a coherent set as a release candidate.
- Standards-clause classification.
- Distinguishing *requirement* from *implementation task*.

ISO/IEC/IEEE 29148:2018 — the international standard for requirements engineering — calls out properties Jira lacks by default: necessity, implementation independence, completeness, singularity, feasibility, traceability, and verifiability.

That does not mean abandon Jira. It means stop pretending the Jira ticket *is* the requirement.

## The right division of labour

A working pattern observed across regulated and non-regulated teams:

- **Requirements** live in a requirements platform with stable IDs (e.g. \`PRD-031\`), version history, and links to standards.
- **Implementation work** lives in Jira, where each ticket carries a link back to the requirement(s) it implements or modifies.
- **Defects** in Jira link back to the requirement(s) and test(s) they violate.
- **Tests** live in your test management system and link back to the requirements they verify.
- **Releases** are baselines of the requirements set with a corresponding Jira version.

This division gives engineers Jira (no friction) and gives auditors the requirements graph (defensible).

## Step-by-step conversion path

If you are starting from a Jira-only world today:

### 1. Inventory your "requirement-shaped" tickets

Filter Jira for items that are *specifications*, not *tasks*:

- Stories marked "spec", "PRD", "requirement", or carrying acceptance criteria.
- Confluence pages linked from Jira that contain the actual specification.
- Documents in shared drives.

This is the seed corpus.

### 2. Choose stable IDs

Decide a naming convention before importing:

- \`BRS-XXX\` — business / stakeholder needs.
- \`PRD-XXX\` — product requirements (user-visible behaviour).
- \`FRD-XXX\` — functional requirements (system-internal).
- \`SRS-XXX\` — software requirements (where IEC 62304/DO-178C apply).
- \`NFR-XXX\` — non-functional.

Every imported requirement gets an ID at this point. From here, IDs are immutable.

### 3. Decompose stories into requirements

A typical "user story" decomposes into:

- 1–3 user-visible PRDs.
- Several FRDs.
- Acceptance criteria becoming candidate test cases.
- Non-functional concerns lifted into NFRs.

Don't over-decompose. The smallest useful unit is "this is independently testable."

### 4. Re-link Jira to the new IDs

Every existing Jira ticket gets a link field (\`Implements\`, \`Verifies\`, \`Affects\`) populated with the requirement IDs.

New tickets follow a template that requires this field.

### 5. Wire your CI

Each PR description carries the requirement IDs touched. CI rejects PRs without them. Now your requirement graph is updated as a side effect of doing the work.

### 6. Baseline a release

Snapshot the requirement set at release time. The baseline is what your safety case, audit packet, or change-control process refers to.

## Where teams stall

Common pitfalls:

1. **"We'll add the link later."** Later is never. Make it merge-blocking.
2. **Requirements written in Jira issue notation.** "AC: User can log in" is not a requirement; "PRD-019 — The system shall authenticate users via SSO with MFA, returning a session token within 500ms p95" is.
3. **Dual maintenance.** Updating both the Jira ticket *and* the requirement. Pick one source of truth per field; reflect the other read-only.
4. **No baseline.** "Latest" is not a release artefact.
5. **Standards classification skipped.** A regulated team without standards links has done half the work.

## What AI-native RM does for the Jira-heavy team

The conversion is much faster with the right tooling:

- **Jira ingestion.** Pull the existing ticket corpus, classify which tickets are requirement-shaped vs task-shaped, propose IDs.
- **Decomposition.** Suggest BRS/PRD/FRD/NFR splits with the original Jira link preserved.
- **Standards classification.** Auto-tag each new requirement with the relevant ISO/IEC clauses.
- **Bidirectional sync.** Jira ticket \`KEY-123\` automatically links to its requirements; updating the requirement updates the ticket's reference.
- **CI gates.** PR templates and merge checks ensure new tickets carry the link.

What used to take a quarter takes two weeks.

## The upgrade in audit posture

After conversion the auditor experience changes shape. "Where is your specification for this feature?" used to require a hunt across Jira, Confluence and three Slack threads. Now it is a single page with stable IDs, links to the implementation tickets and tests, and a baseline that matches the released binary.

[See the Smart Interview workflow on the Aesop demo](/demo-videos/interview) — Jira-style stories converted to ICH-GCP and 21 CFR Part 11 conformant requirements in minutes.
`,
};
