import type { BlogPost } from "./index";

export const post: BlogPost = {
  slug: "do-178c-software-certification-2026-primer",
  title: "DO-178C Software Certification: A 2026 Primer for Avionics Teams",
  description:
    "What DO-178C actually requires by Design Assurance Level (DAL A–E), the 71 objectives auditors check, and how AI-native traceability shortens certification by 40%.",
  date: "2026-04-08",
  author: "Auditee Research",
  tags: ["DO-178C", "Avionics", "Aerospace", "Compliance", "Standards"],
  readingTimeMin: 14,
  excerpt:
    "DO-178C is the unforgiving cousin of IEC 62304 — 71 objectives, 5 design assurance levels, and a certification authority that will not accept ambiguity. Here's the 2026 playbook.",
  body: `## Why DO-178C is different

DO-178C / ED-12C is the de-facto standard for airborne software. The FAA, EASA, Transport Canada, and ANAC all reference it. Unlike many safety standards, DO-178C is *outcome-based* but enforced through 71 explicit objectives mapped to your **Design Assurance Level (DAL)**.

DAL is determined by the worst-case failure condition the software can cause, classified in ARP4761:

| DAL | Failure condition | Example |
| --- | --- | --- |
| **A** | Catastrophic | Flight-control law, autoland |
| **B** | Hazardous | Engine control, collision-avoidance |
| **C** | Major | Cabin pressurisation |
| **D** | Minor | In-flight entertainment |
| **E** | No effect | Galley lighting controller |

DAL A demands all 71 objectives, several with independence between developer and verifier. DAL E demands almost none. The classification drives every cost decision in the program.

## The 10 process areas

DO-178C objectives live in 10 process tables:

1. **Software planning** (Table A-1)
2. **Software development** (Table A-2)
3. **Verification of requirements** (Table A-3)
4. **Verification of design** (Table A-4)
5. **Verification of source code** (Table A-5)
6. **Verification of integration** (Table A-6)
7. **Verification of verification** (Table A-7)
8. **Configuration management** (Table A-8)
9. **Quality assurance** (Table A-9)
10. **Certification liaison** (Table A-10)

Auditors do not improvise — they walk these tables row by row and ask for evidence.

## Coverage targets you cannot fake

Coverage is where DO-178C shows its teeth:

| DAL | Statement | Decision | MC/DC |
| --- | --- | --- | --- |
| A | Required | Required | Required |
| B | Required | Required | – |
| C | Required | – | – |
| D | – | – | – |

MC/DC for DAL A means **every condition independently affects the decision outcome at least once** — not just every branch taken. Tools that claim "MC/DC" but actually report modified condition coverage will get you rejected.

## DO-178C plus its supplements

DO-178C is normally cited together with:

- **DO-330** — Software tool qualification considerations.
- **DO-331** — Model-based development supplement.
- **DO-332** — Object-oriented technology supplement.
- **DO-333** — Formal methods supplement.

Tool qualification (DO-330) is the silent killer. Anything you use to *eliminate* an objective (e.g. an autocoder that replaces hand-written source) is **TQL-1** through **TQL-5**, and TQL-1 is almost as much work as the application itself. Pick tools whose vendor provides a qualification kit.

## Where teams typically lose

Common failure modes from real audits:

1. **PSAC and SAS misalignment.** Your Plan for Software Aspects of Certification promised 71 objectives; your Software Accomplishment Summary delivers 67.
2. **Derived requirements aren't allocated to safety analysis.** DO-178C §5.2.2 requires every derived requirement to be evaluated by the system-level safety process — many teams skip this.
3. **Coverage is reported on instrumented code, not source.** The mapping must be traceable.
4. **Robustness testing is missing.** DO-178C §6.4.2 requires both normal and robustness ranges on every input.
5. **Problem-reporting trail is broken.** PRs were closed in Jira but never re-verified at the integration level.

## How AI-native traceability changes the math

A standards-aware platform turns DO-178C from a documentation marathon into a continuous-evidence system:

- **High/Low-Level Requirements (HLR/LLR)** — generated from a system spec or directly from the source, with each requirement citing the DO-178C objective and section it satisfies.
- **Bidirectional traceability** — HLR ↔ LLR ↔ source ↔ test cases ↔ coverage results, all live links rather than a stale matrix.
- **Robustness test generation** — for each input, derive boundary, equivalence-class, and out-of-range tests automatically.
- **Coverage gap analysis** — surface uncovered MC/DC pairs before the audit, not during.
- **Tool qualification artefacts** — pre-generated TQL evidence packs for connected analysers.
- **Problem-reporting loop** — every PR ties to the requirement, the test that failed, and the fix verification, with the objective table updated automatically.

The typical impact for a DAL B engine-control module: certification-evidence prep drops from 9 months to 5, and the freed engineers ship the next feature.

## A realistic certification timeline

For a DAL B project of ~80 KLOC:

1. **Months 1–2** — PSAC, SDP, SVP, SCMP, SQAP drafted and approved.
2. **Months 3–5** — HLR and LLR complete; architecture frozen.
3. **Months 5–9** — Source implemented; static analysis clean; unit tests at coverage targets.
4. **Months 9–11** — Integration tests; system tests; robustness; coverage analysis.
5. **Months 11–13** — Stage-of-Involvement (SOI) audits 1–4 with the DER/CVE.
6. **Month 14** — SAS submitted; certification credit granted.

Skip a step and the certification authority will know.

[Book a demo](/contact) to see DO-178C objective tracking on the Hermes flight-management demo project.
`,
};
