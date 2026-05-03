import type { BlogPost } from "./index";

export const post: BlogPost = {
  slug: "eu-ai-act-2026-software-team-checklist",
  title: "EU AI Act 2026: A Software Team Checklist for High-Risk Systems",
  description:
    "What software teams shipping AI features into the EU must do in 2026: risk classification, technical documentation, logging, human oversight, conformity assessment, and post-market monitoring.",
  date: "2026-02-06",
  author: "Auditee Research",
  tags: ["EU AI Act", "AI Governance", "Compliance", "Risk Management"],
  readingTimeMin: 12,
  excerpt:
    "If your product reaches an EU user and contains an AI system, the EU AI Act applies. Here's the practical 2026 checklist — by role, by stage, by deliverable.",
  body: `## What changed in 2026

The EU AI Act entered force on 1 August 2024 with phased application. The practical landmarks for software teams in 2026:

- **2 February 2025** — Prohibited practices and AI literacy obligations applied.
- **2 August 2025** — General-purpose AI (GPAI) model obligations applied.
- **2 August 2026** — High-risk AI system obligations *fully* apply, including conformity assessment and CE marking for relevant systems.
- **2 August 2027** — Article 6(1) high-risk systems (those embedded in regulated products) fully apply.

If you ship an AI system that touches an EU user in 2026, the question is no longer "will it apply?" but "which articles apply to me?"

## Step 1 — Classify your AI system

The Act recognises four risk classes:

1. **Prohibited** — social scoring, real-time biometric ID in public (with exceptions), emotion recognition in workplace/education, predictive policing.
2. **High-risk** — Annex III systems (biometrics, critical infrastructure, education, employment, essential services, law enforcement, migration, justice) and Annex I (safety components of regulated products).
3. **Limited-risk** — chatbots, deepfakes (transparency obligations).
4. **Minimal-risk** — everything else.

Most B2B SaaS AI features are limited or minimal risk. AI used in HR, healthcare triage, credit scoring, education, or critical infrastructure is almost always high-risk.

## Step 2 — Map your obligations

For **high-risk systems** (Articles 8–17), you owe:

| Article | Obligation | What it looks like |
| --- | --- | --- |
| 9 | Risk management system | Living risk file for the AI system itself |
| 10 | Data governance | Documented data sources, validation, bias evaluation |
| 11 | Technical documentation | Annex IV-conformant doc set |
| 12 | Record-keeping (logs) | Reproducible output trail |
| 13 | Transparency to users | Clear, accessible system notice |
| 14 | Human oversight | Designed-in oversight points and competent overseers |
| 15 | Accuracy, robustness, cybersecurity | Tested and documented |
| 16 | Quality management system | Connected to risk and post-market |
| 17 | Conformity assessment | Internal or notified-body, depending on Annex III sub-class |

For **limited-risk systems** (Article 50), the bar is much lower but still real: users must be informed they are interacting with AI; AI-generated content must be labelled.

## Step 3 — The technical documentation pack (Annex IV)

The Annex IV technical documentation is the single biggest preparation item. It must cover:

1. General description (intended purpose, providers, version).
2. Detailed description (system architecture, training data, validation, accuracy metrics).
3. Monitoring, functioning and control.
4. Risk management system (Article 9 evidence).
5. Changes through lifecycle.
6. Standards applied (e.g. ISO/IEC 42001 AI Management System).
7. EU declaration of conformity.
8. Post-market monitoring plan.

Treat this pack as a *product* with a maintainer, not a one-off submission.

## Step 4 — Logging that is actually reproducible

Article 12 requires logs that allow events to be reconstructed. For AI features that means:

- **Input snapshot** at each inference call.
- **Model version** identifier.
- **Retrieval context** if the system uses retrieval augmentation.
- **Output** with timestamps.
- **Reviewer action** if human-in-the-loop.

This is a far higher bar than typical application logging. Plan storage, retention, and access controls accordingly. The retention default of six months in the Act is a *floor*, not a ceiling.

## Step 5 — Human oversight that the Act will accept

Article 14 expects oversight that is:

- **Designed in** to the user interface (override controls, abort).
- **Comprehensible** — the operator can interpret the output and its limits.
- **Resourced** — the overseer has the time and authority to intervene.
- **Trained** — competence is documented.

A reviewer who has 90 seconds to triage 100 AI suggestions does not satisfy Article 14. Process design and tool design must be aligned.

## Step 6 — Connect to your existing QMS

Article 17 requires a quality management system covering the AI lifecycle. The good news: if you operate ISO 13485, ISO 9001, ISO/IEC 27001, or are SOC 2 mature, you already have most of the spine. Map your existing QMS clauses to Article 17 sub-points and identify the deltas.

ISO/IEC 42001 (AI Management System) is the natural standard to adopt for the AI-specific deltas.

## Step 7 — Post-market monitoring

Article 72 requires a post-market monitoring plan and reactive measures. Practically:

- A defined channel for serious incident reports.
- Trend analysis on outputs (drift, regression, fairness signals).
- A path from incident to risk-file update to engineering correction.
- Reporting obligations to the relevant national competent authority within defined windows (15 days for serious incidents in many cases).

## Common failure patterns

What we see in early audits:

1. **Risk file is for the product, not the AI system.** They are different files.
2. **Training data lineage is lost.** Article 10 requires documented data governance; "we used the data the team had" is insufficient.
3. **Logs exist but cannot reconstruct an output.** Inputs were sampled; retrieval context wasn't captured.
4. **Human oversight is theoretical.** The override exists in the spec but not in the UI.
5. **Limited-risk systems with no transparency notice.** Even chatbots need to declare themselves.

## A 90-day readiness sprint

If 2 August 2026 is approaching and you are not ready:

1. **Days 0–10** — Classify every AI feature in your product against Annex III.
2. **Days 10–25** — For high-risk features, draft the Article 9 risk file and the Annex IV technical documentation skeleton.
3. **Days 25–45** — Implement Article 12 logging; backfill Article 13 transparency notices.
4. **Days 45–65** — Design Article 14 oversight points into the UI; train operators.
5. **Days 65–80** — Run the first internal conformity-assessment dry-run.
6. **Days 80–90** — Engage notified body if required (rare for in-house AI; more common for AI components in regulated products).

The teams that start this sprint in Q1 are calm in Q3. The teams that start in Q3 will not be.

[Book a demo](/contact) to see how AI risk-file and Annex IV evidence can be auto-generated and kept current.
`,
};
