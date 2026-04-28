import type { BlogPost } from "./index";

export const post: BlogPost = {
  slug: "iec-62304-medical-device-software-lifecycle-guide",
  title: "IEC 62304: Medical Device Software Lifecycle Guide (2026)",
  description:
    "A practical guide to IEC 62304 — software safety classification (Class A/B/C), required deliverables, traceability obligations, and how AI-native tools shorten compliance from months to weeks.",
  date: "2026-04-15",
  author: "Auditee Research",
  tags: ["IEC 62304", "Medical Devices", "Compliance", "Standards"],
  readingTimeMin: 13,
  excerpt:
    "IEC 62304 governs every line of software inside a medical device. Here's what the standard actually demands — by class, by phase, by deliverable — and how AI-native platforms close the gap fast.",
  body: `## What IEC 62304 actually is

IEC 62304:2006 (with the 2015 Amendment 1) is the international standard for *medical device software lifecycle processes*. It is harmonized under the EU Medical Devices Regulation (MDR 2017/745), and it is referenced by the US FDA in their software-validation guidance and the new QMSR (21 CFR Part 820 alignment with ISO 13485).

In practice: if your software runs in, on, or as a medical device — implantable, diagnostic, therapeutic, surgical, monitoring, or general-purpose health software — you almost certainly need to demonstrate conformance with IEC 62304.

## Software safety classification (Class A / B / C)

Before you write a single requirement, classify each *software item*. The classification governs how much rigour and documentation you owe.

| Class | Possible harm | Examples |
| --- | --- | --- |
| **Class A** | No injury or damage to health is possible | UI logging, non-clinical telemetry |
| **Class B** | Non-serious injury is possible | Patient-data display, dosing reminders |
| **Class C** | Death or serious injury is possible | Infusion control, defibrillator firmware |

You can *decompose* a Class C system into Class A subsystems if you can prove segregation. AI-native platforms make this argument far easier because the boundary between modules is captured as graph edges rather than buried in slide decks.

## The mandatory deliverables (by phase)

### §5.1 Software development planning

- Software development plan
- Software risk-management plan (cross-references ISO 14971)
- Software configuration-management plan
- Software problem-resolution plan

### §5.2 Software requirements analysis

- Software requirements specification covering: functional/capability, software-system inputs/outputs, interfaces, alarms/warnings, security, user interface, data definition, installation/acceptance, operation/maintenance.
- Each requirement must be *uniquely identifiable* and *verifiable*.
- Risk-control measures from your hazard analysis must be traceable into requirements.

### §5.3 Software architectural design (Class B and C)

- Architecture transforming the requirements into software items.
- Identify SOUP (Software Of Unknown Provenance) and document its requirements & known anomalies.

### §5.4 Software detailed design (Class C)

- Detailed design for each software unit.

### §5.5 Software unit implementation & verification (Class C)

- Implement units, verify acceptance criteria.

### §5.6 Software integration testing (Class B and C)

- Integrate units, run integration tests, document results.

### §5.7 Software system testing

- System tests covering every requirement.
- Pass/fail evidence retained.

### §5.8 Software release

- Verify all anomalies have been evaluated.
- Document the release version, archive build environment, and known residual anomalies.

### §6 Software maintenance

- Establish a maintenance process.
- Re-classify post-release feedback through risk-management.

### §7 Software risk-management process

- Identify hazardous situations contributed to by software.
- Define risk-control measures and evidence.
- Maintain a risk-traceability table linking hazards → requirements → tests.

### §8 Configuration management

- Identify configuration items.
- Maintain a record of all changes with rationale.

### §9 Problem resolution

- Capture problem reports, investigate, implement corrections, re-verify, and trend-analyse.

## Where teams typically fail an audit

After hundreds of customer audits across MDR, FDA, MDSAP, and notified-body inspections, the failure modes cluster:

1. **Traceability matrix is stale.** Requirements moved, tests were renamed, the matrix wasn't updated.
2. **SOUP catalogue is incomplete.** That one MIT-licensed dependency you forgot to declare derails an entire submission.
3. **Risk-control evidence is implicit.** "It's covered by test TST-43" is not enough; the connection must be a queryable link.
4. **Class C components weren't decomposed.** The whole system was conservatively labelled Class C, multiplying documentation effort by 3–5×.
5. **Maintenance loop is broken.** Field reports aren't fed back into requirements and risk re-evaluation.

## How AI-native RM closes the gap

A standards-aware platform helps in every section of the standard:

- **§5.2 Requirements analysis** — generate IEC 62304-conformant requirements from a brief or directly from the existing source code, with each requirement covering a specific clause and citing it inline.
- **§5.7 System testing** — auto-generate test cases tied to each requirement with pass/fail tracking.
- **§7 Risk management** — maintain hazard-to-requirement-to-test links as graph edges, not as a spreadsheet.
- **§8 Configuration management** — ingest from GitHub or DOORS/Jama/Polarion so the configuration record is exactly the live source of truth.
- **§9 Problem resolution** — drive CAPA workflows from defect findings, with evidence attached to each step.

When auditors ask "show me how this requirement is covered," the answer becomes a one-click drill-down rather than a forensic exercise.

## A 30-day path to "audit-ready"

If you're starting from scratch, this is the realistic sequence:

1. **Day 0–3** — Connect your code and any existing RM source. Run gap analysis.
2. **Day 3–10** — Generate IEC 62304-conformant requirements from your code (every selected clause, every coverage topic).
3. **Day 10–17** — Generate the test-case set; close coverage gaps.
4. **Day 17–24** — Run a compliance audit; address findings via auto-opened CAPAs.
5. **Day 24–30** — Export the BRD, PRD, FRD, traceability matrix, and audit report. Submit.

This used to take six months. With an AI-native platform it takes a month, and the artefacts are *better* — every link is live, every clause is cited, every change is captured.

[Try the ROI calculator](/roi-calculator) to see what the savings look like for your team, or [book a demo](/contact) to see IEC 62304 generation end-to-end.
`,
};
