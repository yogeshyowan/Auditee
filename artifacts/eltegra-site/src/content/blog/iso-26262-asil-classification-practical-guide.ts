import type { BlogPost } from "./index";

export const post: BlogPost = {
  slug: "iso-26262-asil-classification-practical-guide",
  title: "ISO 26262 ASIL Classification: A Practical Guide for Software Teams (2026)",
  description:
    "How to classify automotive software items under ISO 26262 — Severity × Exposure × Controllability, ASIL decomposition, and the documentation auditors actually look for.",
  date: "2026-04-22",
  author: "Auditee Research",
  tags: ["ISO 26262", "Automotive", "Functional Safety", "Compliance", "Standards"],
  readingTimeMin: 12,
  excerpt:
    "ASIL classification governs every safety argument in your automotive software. Get it wrong and you over-engineer Class B code at ASIL D cost — or under-engineer Class C and lose the audit.",
  body: `## What ASIL really is

ASIL — *Automotive Safety Integrity Level* — is a risk classification defined in ISO 26262 Part 3. It is a function of three factors evaluated for each potential hazardous event:

- **Severity (S0–S3)** — how bad the harm is if the hazard manifests.
- **Exposure (E0–E4)** — how often the operational situation occurs.
- **Controllability (C0–C3)** — how reliably the driver (or another agent) can avoid the harm.

Combine the three and you get ASIL A, B, C, D — or QM (Quality Management) when no specific ASIL applies.

## The classification table you actually need

| | C1 | C2 | C3 |
| --- | --- | --- | --- |
| **S1 / E1** | QM | QM | QM |
| **S1 / E2** | QM | QM | QM |
| **S1 / E3** | QM | QM | A |
| **S1 / E4** | QM | A | B |
| **S2 / E2** | QM | QM | A |
| **S2 / E3** | QM | A | B |
| **S2 / E4** | A | B | C |
| **S3 / E3** | A | B | C |
| **S3 / E4** | B | C | D |

The most common scoping mistake teams make is treating *the entire ECU* at the highest ASIL identified anywhere on it. This is wrong, expensive, and discouraged by the standard.

## ASIL decomposition — and when it actually saves you work

Part 9, Clause 5 allows you to decompose an ASIL D safety requirement into:

- ASIL B(D) + ASIL B(D)
- ASIL C(D) + ASIL A(D)
- ASIL D(D) + QM(D)

The (D) annotation tells future auditors the requirement *originated* at ASIL D and the integrity of each decomposed element must be argued accordingly.

Decomposition is only valid if you can prove **independence** between the decomposed elements. In practice that means:

- No shared resources that can fail-cause both elements.
- No common-mode failures (same compiler bug, same memory region, same clock).
- A documented argument backed by FMEDA or DFA.

If your two "independent" elements live in the same C++ namespace and share a malloc arena, you do not have independence and the decomposition argument will be rejected.

## What goes in the safety case

Every ASIL-rated software item needs a defensible chain of evidence:

1. **Item definition** — boundaries, interfaces, operating modes.
2. **HARA** — hazards, S/E/C ratings, ASIL determination, safety goals.
3. **Functional safety requirements** — derived from safety goals.
4. **Technical safety requirements** — allocated to hardware and software.
5. **Software safety requirements** — refined and traced.
6. **Architecture & design** — with freedom-from-interference arguments.
7. **Implementation evidence** — coding rules (MISRA C:2023), static analysis results, code reviews.
8. **Verification & validation** — unit, integration, system tests with coverage targets per ASIL.

Coverage targets that auditors will check:

| ASIL | Statement | Branch | MC/DC |
| --- | --- | --- | --- |
| A | Recommended | – | – |
| B | Required | Recommended | – |
| C | Required | Required | Recommended |
| D | Required | Required | Required |

## Where teams typically fail

After dozens of customer audits across ISO 26262 implementations, the failure modes cluster:

1. **No traceable link from safety goal to test.** "It's covered by test plan TP-12" is not enough; the link must be queryable down to the individual test case.
2. **MC/DC coverage claimed but not measured.** Only branch coverage was actually instrumented.
3. **SOUP and AUTOSAR BSWs aren't argued.** If you depend on supplier code, you owe a qualification argument or a hazard analysis showing the dependency is QM-acceptable.
4. **Tool qualification is missing.** Your code generator and test harness need TCL classification and qualification evidence (ISO 26262-8, Clause 11).
5. **Configuration baseline is informal.** "We tag releases in git" is not a configuration management plan.

## How AI-native RM closes the gap

A standards-aware platform removes most of the manual book-keeping:

- **HARA generation** — ingest the item definition, surface candidate hazards from the function model, ask the engineer to confirm S/E/C ratings.
- **Safety-requirement decomposition** — propose decomposed pairs and flag shared dependencies that would invalidate the independence argument.
- **Coverage matrix** — every safety goal → safety requirement → software requirement → unit test → coverage % live and queryable.
- **Tool qualification packs** — pre-generated TCL evidence for connected code generators and test runners.
- **CAPA loops** — defects that violate a safety requirement open a CAPA automatically with the right ASIL, owner, and due date.

When your auditor asks "show me how Safety Goal SG-02 propagates into your release," the answer becomes a five-second drill-down rather than a two-week archaeology project.

## A 60-day path to "ASIL-ready"

For a typical ECU project the realistic sequence:

1. **Days 0–10** — Item definition complete. HARA drafted; S/E/C confirmed in workshop.
2. **Days 10–25** — Functional and technical safety requirements derived; safety goals allocated.
3. **Days 25–40** — Software safety requirements refined; architectural design complete with freedom-from-interference argument.
4. **Days 40–55** — Implementation against MISRA + coverage targets; static-analysis baseline clean.
5. **Days 55–60** — Pre-assessment audit; CAPAs closed; safety case package exported.

This is the difference between shipping the next-gen ADAS feature on time and pushing it a quarter.

[Book a demo](/contact) to see ISO 26262 generation end-to-end on the Apollo and Ares demo projects.
`,
};
