import type { BlogPost } from "./index";

export const post: BlogPost = {
  slug: "generating-requirements-from-legacy-code",
  title: "Generating Requirements from Legacy Code: A Modernization Playbook",
  description:
    "How to recover requirements from undocumented legacy code (COBOL, Java EE, .NET Framework, mainframe SQL) using AI — and turn the output into a standards-conformant baseline you can actually maintain.",
  date: "2026-04-01",
  author: "Auditee Research",
  tags: ["Legacy Modernization", "Requirements", "AI", "COBOL"],
  readingTimeMin: 10,
  excerpt:
    "Most enterprise legacy systems have lost their authors and their docs. AI can read the code and produce a structured, standards-aware requirements baseline — the prerequisite for any modernization program.",
  body: `## Why legacy code has no requirements

The patterns are familiar:

- A 1990s **COBOL** core in a bank or insurer that has outlived three rounds of analysts.
- A **Java EE** monolith in healthcare that grew by accretion of 200 developers over 15 years.
- A **.NET Framework** ERP customization with hundreds of stored procedures and no spec.
- An industrial SCADA system whose original requirements were a Word doc deleted in 2008.

Modernization programs stall here because step zero — *what is this system actually supposed to do?* — has no answer. You cannot replace what you cannot specify, and you cannot certify what you cannot trace.

## The traditional approach: read every line

Historically the answer has been a 6–18 month "requirements recovery" engagement: a small army of analysts reads the code, interviews the few remaining engineers, and produces a requirements document. By the time it ships:

- It is already out of date.
- It is unstructured prose, not a queryable graph.
- It has no traceability links back to specific files or routines.
- It cites no standards, so it cannot drive a compliance audit.

This is exactly the workload that modern AI does well — and unlike a human team, the AI does not need to be re-onboarded for each new module.

## A practical AI-driven workflow

### Step 1 — Get the code into the platform

Connect a GitHub repository, upload a ZIP, point at a folder, or — for tools like IBM DOORS, Jama, Polarion, codeBeamer — connect the existing RM source directly. The platform indexes once and reuses the index across every subsequent step.

### Step 2 — Pick the standards that apply

This is the step most teams get wrong. Before generating requirements, decide what standards the *modernized* system will be certified against. For a bank's core ledger that might be SOC 2, ISO 27001, PCI DSS. For a medical device firmware port, IEC 62304 and ISO 14971. For an automotive ECU, ASPICE and ISO 26262.

The standards selection drives:

- Which coverage topics the AI must produce requirements for.
- The required document sections in the eventual BRD/PRD/FRD.
- The citation hints embedded in each generated requirement.

### Step 3 — Generate requirements from a code subset

Pick a meaningful unit — a microservice, a module, a stored-procedure pack — and feed it to the AI. With a standards-aware platform, the prompt is augmented so the output:

1. Covers every required topic of every selected standard.
2. Cites the relevant clauses inline.
3. Is uniquely numbered, verifiable, and traceable to specific code files.

For a ~5,000-line module, this typically produces 30–60 requirements in a single pass. Repeat for each module.

### Step 4 — Run gap analysis against the recovered set

The same platform compares what was generated against existing tests, existing tickets, and any pre-existing documentation. The output:

- *Missing requirements* — behavior implied by code but not yet captured.
- *Conflicting requirements* — old docs that no longer match current behavior.
- *Orphan requirements* — old docs whose code has been removed.

### Step 5 — Generate test cases for each requirement

For each new requirement, generate a test case set. This becomes the validation harness for the modernization itself: when you reimplement the module, the tests must still pass.

### Step 6 — Produce the BRD/PRD/FRD

Now you have artefacts a modernization vendor (or your own team) can actually consume. Each document cites the original code locations, the standards it conforms to, and the test cases that validate each requirement.

### Step 7 — Drive the modernization with CAPAs

As the rebuild progresses, every gap or deviation opens a tracked CAPA. The closing evidence is the new code's test results.

## Pitfalls to avoid

### Don't dump the whole monolith into a single prompt

Even modern long-context models lose fidelity past ~30k characters of dense source. Slice by module, generate per-module requirements, then merge.

### Don't skip the standards selection

A pile of generated requirements that doesn't conform to *any* standard is no better than the prose document you already have. Standards-aware generation is what makes the output certifiable.

### Don't accept the AI's output unreviewed

A senior engineer should spend ~10 minutes reviewing the output of each generation pass. They will catch hallucinated capabilities (the model inferred a feature from a function name that's actually dead code), misclassified safety levels, and missing risk-control measures.

### Don't ignore the SOUP catalogue

Every legacy system has dependencies whose own provenance is unclear — old open-source libraries, vendor SDKs, in-house forks of public projects. A standards-aware platform should generate requirements describing these, including known anomalies and version constraints.

## Realistic timelines

| Code base | Manual recovery | AI-assisted recovery |
| --- | --- | --- |
| 50k LOC microservice cluster | 4–6 weeks | 2–4 days |
| 500k LOC Java monolith | 6–9 months | 3–4 weeks |
| 2M LOC COBOL banking core | 12–18 months | 8–12 weeks |
| Mixed-language enterprise estate | 12–24 months | 8–16 weeks |

The savings are not just calendar time — they are *quality*. The AI-generated baseline is a queryable graph cited against standards; the manual baseline is a 600-page Word doc that no one reads.

## Where to start

If you have a legacy modernization program on the roadmap, the lowest-risk first step is to pick *one* module, generate requirements from its code with a standards selection, and review the output. Most teams are surprised how quickly the bench-test convinces stakeholders to invest properly.

[See requirements-from-code in action →](/ai-product-development) · [Talk to us about a modernization pilot →](/contact)
`,
};
