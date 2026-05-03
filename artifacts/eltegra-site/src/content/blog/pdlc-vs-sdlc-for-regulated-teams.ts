import type { BlogPost } from "./index";

export const post: BlogPost = {
  slug: "pdlc-vs-sdlc-for-regulated-teams",
  title: "PDLC vs SDLC: Why Product Lifecycle Wins for Regulated Teams",
  description:
    "SDLC is necessary but not sufficient in a regulated environment. The PDLC view — Ideation through Governance — is what survives audits, payer demands, and post-market surveillance.",
  date: "2026-03-04",
  author: "Auditee Research",
  tags: ["PDLC", "SDLC", "Product Management", "Compliance", "MedTech"],
  readingTimeMin: 10,
  excerpt:
    "Engineering organisations love SDLC because it ends at release. Regulators do not. PDLC carries the artefact through governance and post-market — and that is exactly where most software fails its audit.",
  body: `## SDLC ends too early

The classic Software Development Lifecycle covers requirements → design → build → test → deploy. It is excellent at managing engineering risk, and most modern teams execute it well.

The problem is that most regulators care more about what happens *outside* SDLC than inside it:

- Did Ideation include the right stakeholders, including patient/customer voice?
- Was the Design reviewed against the safety case, not just the engineering wishlist?
- Was the Launch authorised by the right governance body, with the right evidence?
- Once Launched, are field signals being fed back into the next iteration?

SDLC handles "build the thing right." PDLC handles "build the right thing and keep it right."

## The six PDLC stages we use

Different domains call them different names; the architecture is consistent:

1. **Ideation** — Problem, target user, regulatory scope, initial risk.
2. **Design** — Functional and non-functional requirements, architecture, hazard analysis, safety case skeleton.
3. **Development** — Implementation, unit and integration tests, design reviews, traceability live.
4. **Testing** — System V&V against requirements; standards conformance; usability and human-factors validation.
5. **Launch** — Release authorisation, regulatory submission, customer onboarding, training.
6. **Governance** — Post-market surveillance, complaint handling, periodic review, update planning.

Each stage has gate criteria. You don't move forward without them, and the gate signature is itself an audit artefact.

## What changes per industry

The shape stays. The contents differ:

- **Medical (IEC 62304 + ISO 13485 + MDR/FDA QSR).** Ideation includes Intended Use Statement and intended-user definition. Launch includes regulatory submission (510(k), MDR technical file). Governance includes Periodic Safety Update Reports.
- **Automotive (ISO 26262 + ISO 21434 + UN R155/R156).** Ideation includes Item Definition. Launch includes ASPICE assessment. Governance includes cybersecurity incident response and OTA update governance.
- **Avionics (DO-178C + ARP4754A).** Ideation includes safety assessment basis. Launch includes Stage-of-Involvement audits. Governance includes airworthiness directives.
- **Financial services (DORA + PCI DSS + MiCA).** Ideation includes operational-resilience analysis. Launch includes BCP attestation. Governance includes ICT third-party risk re-assessment.

The pattern repeats across regulated domains because the underlying *governance need* repeats: who authorised this, on what evidence, who is accountable now.

## Where SDLC-only teams fail

Common failures observable from the outside:

1. **No traceable Intended Use.** Engineering shipped features the safety case never anticipated.
2. **Risk file disconnected from requirements.** The hazard analysis and the requirements set evolved separately and disagree.
3. **Launch authorised informally.** "We did a review" with no signed gate document.
4. **No post-market loop.** Customer complaints go to support; field defects go to engineering; neither feeds back into requirements or risk.
5. **Periodic review is the audit.** The team only re-reads the requirements when an external auditor schedules a visit.

Each of these is invisible to SDLC metrics and lethal in regulatory inspection.

## A workable PDLC operating model

The model that survives audit and ships fast looks like this:

- **Ideation reviews** are brief but mandatory. Output: signed brief with intended use, scope, regulatory class, initial hazards, target users.
- **Design reviews** require the safety case skeleton be present. No safety skeleton, no Design exit.
- **Development** runs SDLC inside the PDLC frame; nothing changes for engineers day-to-day except that links to requirements and hazards are first-class.
- **Testing** combines verification (against requirements) and validation (against intended use). Failure to validate is a Launch blocker even if all V tests pass.
- **Launch authorisation** is signed by named individuals (Quality, Regulatory, Engineering, Product). The signature is captured with timestamp.
- **Governance** runs on a calendar — monthly complaints triage, quarterly post-market review, annual periodic safety update.

## What an AI-native platform does for each stage

- **Ideation.** Drafts intended-use statements and proposes regulatory class based on the brief.
- **Design.** Generates hazard analysis from the function model; cross-links every requirement to a hazard and a standard clause.
- **Development.** Maintains live traceability from requirement to source to test, so no engineer has to maintain a matrix.
- **Testing.** Generates the validation suite from intended-use; surfaces unvalidated user paths.
- **Launch.** Renders the Launch packet (technical file, design history file, software accomplishment summary) automatically.
- **Governance.** Aggregates complaints, defects, CAPAs, and field telemetry into the periodic review pack.

The engineering team gets back the time it used to spend on documentation theatre, and the quality and regulatory teams get a system of record that is actually current.

## A realistic transition

If you are SDLC-only today:

1. **Quarter 1.** Add Ideation gates to all new initiatives. Backfill an Intended Use for existing products.
2. **Quarter 2.** Connect risk file to requirements; force the link before any Design exit.
3. **Quarter 3.** Formalise Launch authorisation; capture signatures; archive packets.
4. **Quarter 4.** Stand up Governance cadence; first periodic review held.

Within a year your audit posture is a different organisation. So is the cost of a finding.

[See PDLC end-to-end on the Phoenix surgical-robotics demo](/demo-videos/pdlc) — Ideation through Governance with every gate signed.
`,
};
