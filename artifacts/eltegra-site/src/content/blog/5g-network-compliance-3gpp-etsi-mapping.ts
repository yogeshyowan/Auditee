import type { BlogPost } from "./index";

export const post: BlogPost = {
  slug: "5g-network-compliance-3gpp-etsi-mapping",
  title: "5G Network Compliance: A Practical 3GPP + ETSI + NIST Mapping",
  description:
    "How operators and 5G core vendors map their architecture against 3GPP TS 23.501, 33.501, ETSI EN 303 645, and NIST CSF — and where shared traceability cuts months off launch.",
  date: "2026-02-15",
  author: "Auditee Research",
  tags: ["Telecom", "5G", "3GPP", "ETSI", "NIST CSF", "Compliance"],
  readingTimeMin: 12,
  excerpt:
    "Launching a 5G core means satisfying half a dozen overlapping standards bodies. The teams who survive build a single requirement graph and let the mappings derive from it.",
  body: `## Why 5G compliance is harder than it looks

Most 5G core programmes underestimate the standards surface. A typical commercial 5G launch must demonstrate conformance against:

- **3GPP TS 23.501** — System architecture for the 5G System.
- **3GPP TS 23.502** — Procedures for the 5G System.
- **3GPP TS 33.501** — Security architecture and procedures.
- **3GPP TS 24.501 / 38.331** — NAS and RRC protocol layers.
- **ETSI EN 303 645** — Cyber Security for Consumer IoT.
- **ETSI TS 103 645 / TS 103 701** — Cyber Security baseline for connected devices.
- **NIST CSF 2.0** — National-level cyber framework, frequently mandated by enterprise customers.
- **ISO/IEC 27001:2022** and **IEC 62443** — for the surrounding management and OT integration.
- **3GPP TR 33.926** — Threat modelling guidance for network products.

That's before you add country-specific telecom regulations (FCC, OFCOM, TRAI, ANATEL).

## The mapping problem

Every requirement in your 5G core typically maps to *multiple* standards. A single AMF requirement to enforce subscriber concealed-identifier handling might satisfy:

- 3GPP TS 33.501 §6.12 (SUCI / SUPI handling)
- 3GPP TS 23.501 §5.9 (privacy)
- ETSI EN 303 645 §5.8 (data protection)
- NIST CSF PR.DS-1 (data-at-rest protection)

Maintained as separate matrices for each standard, this duplicates effort by the count of standards. Maintained as a single requirement with multiple standard-clause links, it is one entry.

## A defensible architecture: one graph, many views

The teams that scale build a single requirement graph and *project* the audit views from it:

\`\`\`text
Requirement REQ-AMF-019
  ├── satisfies ──> 3GPP TS 33.501 §6.12.2
  ├── satisfies ──> 3GPP TS 23.501 §5.9.1
  ├── satisfies ──> ETSI EN 303 645 §5.8
  ├── satisfies ──> NIST CSF PR.DS-1
  ├── implementedBy ──> service/amf/suci.go
  ├── verifiedBy   ──> tst/amf/test_suci_concealment.go
  └── threatModeledIn ──> TR 33.926 §K.2.3.4
\`\`\`

When the certification body asks "show me your TS 33.501 §6.12 evidence," the answer is a graph traversal, not a parallel document.

## What "5G core compliance ready" actually means

A reasonable internal definition for being ready for a Tier-1 launch:

1. **100% of mandatory 3GPP procedures** mapped to at least one requirement, code unit, and passing system test.
2. **TR 33.926 threat catalogue** — every relevant threat has a documented control or accepted-risk note.
3. **NESAS/SCAS** — Security Assurance Specification testing complete with no open critical findings.
4. **Logs and tracing** — every NF (Network Function) emits structured audit events to a tamper-evident store.
5. **Privacy controls** — SUPI/SUCI handling, IMEI handling, location privacy all covered with evidence.
6. **Operational runbooks** — incident, recovery, lawful intercept handling, key-management — each tied to a requirement and a procedure.
7. **Change-management** — every 3GPP minor-release alignment goes through a documented impact assessment.

## Common failure modes

Patterns observed across operator-vendor relationships:

1. **3GPP version drift.** Vendor implements Release 17; operator's RFP referenced Release 18. The gap is large and undocumented.
2. **NESAS/SCAS findings are recurring.** A SAS test fails the same way in two consecutive cycles because the underlying control was never re-engineered.
3. **Logs exist but are not queryable.** "We have logs" is not the same as "we have an audit-grade evidence trail."
4. **Threat model decoupled from requirements.** TR 33.926 was reviewed once at design time and never re-walked after architecture changes.
5. **Lawful-intercept compliance is opaque.** The capability exists, but the evidence chain — who configured it, who reviewed access — is not audit-ready.

## Where AI-native RM helps a 5G programme

Modern RM platforms specifically reduce 5G compliance overhead:

- **Standard-aware ingestion.** Drop 3GPP, ETSI, NIST documents into the platform; clauses are parsed and indexed for direct linkage.
- **Multi-mapping by default.** A requirement can satisfy several standards; the audit views are generated per-standard from the same source of truth.
- **Threat-to-requirement traceability.** TR 33.926 threats become first-class nodes, linked to the controls and tests that mitigate them.
- **Release alignment.** When 3GPP publishes a new release, the platform diffs the procedure deltas and surfaces affected requirements.
- **Grounded Q&A.** "Show me every requirement affected by handover latency, with the SAS test result" — answered in seconds with citations.

## A realistic 90-day path for a 5G core team

If you are mid-program with an existing requirement set:

1. **Days 0–14** — Ingest 3GPP TS 23.501, 33.501, ETSI EN 303 645, NIST CSF into the platform. Index by clause.
2. **Days 14–35** — Map existing requirements to clauses; surface uncovered clauses.
3. **Days 35–55** — Close coverage gaps; add tests where missing; threat-model deltas.
4. **Days 55–75** — Internal SAS-equivalent dry-run; close critical findings; CAPA the rest.
5. **Days 75–90** — External NESAS audit. Pass.

The teams that execute this find the next 3GPP release alignment is no longer a fire drill — it is a Tuesday morning.

[See grounded 5G compliance on the Sirius demo](/demo-videos/ask) — every answer cited to PRD, 3GPP clause, test, and CAPA.
`,
};
