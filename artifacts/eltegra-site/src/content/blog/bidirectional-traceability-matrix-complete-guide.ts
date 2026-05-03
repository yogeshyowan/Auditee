import type { BlogPost } from "./index";

export const post: BlogPost = {
  slug: "bidirectional-traceability-matrix-complete-guide",
  title: "The Bidirectional Traceability Matrix: A Complete Guide with Examples",
  description:
    "What a true bidirectional traceability matrix looks like, why spreadsheet matrices always rot, and how a graph-native approach makes traceability a side-effect of doing the work.",
  date: "2026-03-30",
  author: "Auditee Research",
  tags: ["Traceability", "Requirements", "Compliance", "Standards"],
  readingTimeMin: 11,
  excerpt:
    "Every regulated standard requires bidirectional traceability. Almost every team builds it as a spreadsheet — and almost every team fails the audit because of it. Here's the modern way.",
  body: `## What "bidirectional" actually means

Forward traceability answers: *which design, code, and test artefacts implement this requirement?*

Backward traceability answers: *which requirement justifies this code, this test, this design choice?*

Bidirectional traceability requires *both*, kept consistent in real time. Every regulated standard — IEC 62304, ISO 26262, DO-178C, FDA QSR, IEC 61508, EN 50128 — mandates it explicitly.

## The minimum link types

A defensible matrix needs at least these link classes:

- **Stakeholder need ↔ user requirement** (BRS to PRD)
- **User requirement ↔ system requirement** (PRD to FRD)
- **System requirement ↔ software requirement** (FRD to SRS)
- **Software requirement ↔ design element** (SRS to architecture/detailed design)
- **Design element ↔ source unit** (file, function, module)
- **Source unit ↔ unit test**
- **Software requirement ↔ system test**
- **Hazard ↔ risk control measure ↔ requirement**
- **Standard clause ↔ requirement**
- **Defect ↔ requirement and test**
- **CAPA ↔ defect, hazard, or audit finding**

Notice how many of those exist in different tools today: requirements in DOORS, design in Confluence, code in Git, tests in TestRail, defects in Jira, CAPAs in QMS. The matrix lives nowhere — and that is exactly why audits fail.

## Why spreadsheet matrices always rot

The classic approach is one large Excel sheet:

| Req ID | Title | Linked Code | Linked Tests | Verified |
| --- | --- | --- | --- | --- |
| REQ-001 | Login required | login.tsx | TST-001 | ✓ |
| REQ-002 | … | … | … | – |

Three weeks after the sheet is "done":

- A developer renames \`login.tsx\` to \`auth.tsx\`. The matrix doesn't notice.
- A test was deleted. The matrix still claims coverage.
- A new requirement was added to a sub-feature. Nobody updated the sheet.
- A hazard from the risk file was tightened. The matrix doesn't link to risks at all.

By audit week the spreadsheet is theatre, and everyone knows it.

## What a graph-native traceability layer looks like

Treat every artefact as a node in a typed graph and every dependency as a typed edge:

\`\`\`text
Hazard HAZ-04  ─┐
                ├── controls ──> ReqSW SRS-019
StandardClause ─┘                       │
                                        ├── implementedBy ──> SourceUnit src/dose.ts:calcDose()
                                        ├── verifiedBy   ──> Test  TST-209
                                        └── linkedTo     ──> Defect DEF-031 ──> CAPA CPA-014
\`\`\`

Now every audit question becomes a graph traversal:

- "Show coverage of HAZ-04" — one hop forward.
- "Why does this code exist?" — one hop backward from the source unit.
- "What breaks if PRD-031 changes?" — multi-hop impact analysis.

You don't *maintain* the matrix. The matrix is a view onto the live graph, generated on demand.

## How to bootstrap one in an existing project

If you have a spreadsheet matrix today:

1. **Inventory your sources.** Where do requirements live? Code? Tests? Risks? CAPAs?
2. **Adopt stable IDs everywhere.** A requirement without an ID cannot be linked. A test labelled "Login flow happy path" cannot be cited.
3. **Connect the systems read-only first.** GitHub, Jira, DOORS, Polarion, TestRail, Confluence. Let the platform parse what is already there.
4. **Run a coverage report.** You will be surprised how much already exists implicitly — "this commit message references REQ-031" is enough for an inferred edge.
5. **Close the gaps.** The remaining gaps are the real work; everything else was already there, just not surfaced.
6. **Make new edges automatic.** PR templates that name the requirement, test naming conventions that name the function — these turn discipline into infrastructure.

## Common questions auditors ask

Be ready for these. With a graph, each is a five-second answer:

- **Forward:** Show me every implementation and test for SRS-027.
- **Backward:** Why does this function exist? Which requirement?
- **Coverage:** What percentage of Class C requirements have at least one passing system test?
- **Impact:** PRD-031 was modified yesterday — what should be re-verified?
- **Provenance:** This released binary — which requirement baseline does it correspond to?
- **Risk closure:** HAZ-04 — show every risk control, the requirements that implement them, and verification evidence.

## How AI-native platforms change the cost curve

Modern RM systems treat traceability as an *emergent property* of doing the work, not a separate task:

- **Auto-link inference.** When a PR contains "fixes SRS-019", the link is created without manual matrix entry.
- **Standards-aware classification.** A new requirement is auto-tagged with the clauses it satisfies.
- **Live coverage rings** that recompute on every commit — so coverage regressions are noticed by Friday rather than three days before the audit.
- **Impact previews** before merging — "this change touches code linked to 4 Class C requirements; 2 of their tests have not been re-run."
- **Evidence export** — one click renders the matrix in the format the auditor expects (BRS↔PRD↔FRD, hazard analysis, coverage table, defect register).

The objective is not "have a matrix." It is "*never need to build one again*."

[See it on the Titan demo project](/demo-videos/traceability) — every IEC 61508 SIL-3 requirement walked from spec to test to evidence in a live graph.
`,
};
