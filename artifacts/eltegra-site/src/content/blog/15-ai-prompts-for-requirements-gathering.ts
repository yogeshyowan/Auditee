import type { BlogPost } from "./index";

export const post: BlogPost = {
  slug: "15-ai-prompts-for-requirements-gathering",
  title: "15 AI Prompts Senior BAs Actually Use for Requirements Gathering",
  description:
    "A working library of 15 AI prompts that Senior Business Analysts use for requirements discovery, classification, gap detection, BRD/PRD drafting and stakeholder validation — copy, paste, ship.",
  date: "2026-04-01",
  author: "Auditee Research",
  tags: ["Business Analysis", "AI Prompts", "BRD", "Requirements"],
  readingTimeMin: 8,
  excerpt:
    "Skip the LinkedIn-influencer prompt lists. These are 15 prompts Senior BAs are actually pasting into ChatGPT, Claude and (better) into structured tools every day, with the failure modes and the fixes.",
  body: `## How to use this list

Each prompt below is split into three parts:
- **Use case** — when to reach for it
- **Prompt template** — paste-ready, with variables in \`{curly braces}\`
- **Failure mode** — the way it goes wrong, and the structural fix

> Heads up: pure-LLM prompts top out fast on regulated work. Our Auditee Smart Interview is a structured version of these prompts that always cites sources, classifies output and traces back to the source artefact. Use these prompts to learn the patterns; use a structured tool for production.

---

### 1. Discovery from a one-paragraph idea

**Use case.** Stakeholder describes a feature in 3 sentences and expects a draft BRD by Friday.

**Prompt.**
\`\`\`
You are a Senior Business Analyst. The stakeholder description is:

"{paragraph}"

Generate 5 follow-up questions you must ask before drafting requirements.
For each question, explain why answering it changes the requirement set.
\`\`\`

**Failure mode.** GPT will skip mandatory regulatory questions for healthcare/fintech. Add: \`Industry: {industry}. Compliance frameworks: {list}.\`

---

### 2. Stakeholder identification

**Prompt.**
\`\`\`
For the project "{name}: {one-line description}", list every stakeholder
type (internal, external, regulatory) likely to have functional or
non-functional requirements. For each, list 3 representative requirements.
\`\`\`

---

### 3. Use-case enumeration

**Prompt.**
\`\`\`
List the top 20 use cases for "{system}". For each include: actor,
trigger, primary flow (3-5 steps), 2 alternative flows, and 1 exception
flow. Format as JSON.
\`\`\`

---

### 4. Functional requirement extraction from a BRD

**Prompt.**
\`\`\`
Extract all functional requirements from the document below.
For each, output: id, title, description (≤1 line), priority (MoSCoW),
type (functional|business rule|integration), source (paragraph number).

Document:
"""
{paste BRD}
"""
\`\`\`

**Failure mode.** Loses requirements buried in tables/figures. Convert to plain text first or use Auditee's Intelligent Document Analysis which handles tables and OCR'd PDFs.

---

### 5. Non-functional requirement (NFR) generation

**Prompt.**
\`\`\`
For "{system description}", generate non-functional requirements covering:
performance, scalability, availability, security, accessibility (WCAG 2.2 AA),
internationalisation, observability and disaster recovery. For each include
target and acceptance criteria.
\`\`\`

---

### 6. Acceptance-criteria expansion

**Prompt.**
\`\`\`
Convert this user story into Gherkin acceptance criteria including
2 happy-path, 2 alternate-path and 2 negative-path scenarios:

User story: "{story}"
\`\`\`

---

### 7. Gap detection across requirements

**Prompt.**
\`\`\`
Review the requirement set below. For "{system context}", list missing
requirements grouped by category: security, privacy, accessibility,
internationalisation, error handling, observability, performance.
Flag any contradictions.

Requirements:
{paste list}
\`\`\`

**Failure mode.** Without retrieval over a knowledge base of regulatory standards, GPT will miss IEC 62304 / SOC 2 / PCI-specific gaps. This is why purpose-built gap detection wins on regulated work.

---

### 8. Conflict & duplication detection

**Prompt.**
\`\`\`
List requirement pairs in the set below that are: (a) duplicates,
(b) overlap >50%, (c) directly conflict. For each pair, recommend
resolution.

Requirements:
{paste list}
\`\`\`

---

### 9. Requirement quality scoring

**Prompt.**
\`\`\`
Score each requirement on the INVEST + IEEE 830 dimensions:
unambiguous, verifiable, traceable, complete, consistent, atomic.
Score 1-5. Suggest one rewrite for each requirement scoring <3 on any dimension.
\`\`\`

---

### 10. BRD draft from requirements

**Prompt.**
\`\`\`
Produce a Business Requirements Document for "{project}" from the
requirements set below. Include: executive summary, business context,
scope, in/out of scope, stakeholders, business rules, functional
requirements grouped by capability, NFRs, assumptions, constraints,
risks. Use formal tone.
\`\`\`

---

### 11. PRD draft from BRD

**Prompt.**
\`\`\`
Convert the BRD below into a Product Requirements Document focused on
the user-facing solution: personas, jobs-to-be-done, user journeys,
solution overview, feature set, success metrics, release plan.
\`\`\`

---

### 12. Compliance crosswalk

**Prompt.**
\`\`\`
Map each requirement below to the controls it satisfies in:
SOC 2 Trust Services Criteria, ISO 27001:2022 Annex A, HIPAA Security
Rule (45 CFR 164.308-312). Output a markdown table.
\`\`\`

---

### 13. Test-case generation per requirement

**Prompt.**
\`\`\`
For each requirement below, generate test cases covering positive,
negative, boundary and edge cases. Each test case has: id,
preconditions, steps, expected result, severity.
\`\`\`

---

### 14. Stakeholder review prompt

**Prompt.**
\`\`\`
You are reviewing the requirement set below in the role of "{persona}"
(e.g., Compliance Officer, Site Reliability Engineer, Security Architect).
List the 5 most concerning gaps or risks from your perspective. Be specific.
\`\`\`

---

### 15. Requirement-to-code mapping (for legacy)

**Prompt.**
\`\`\`
Given the source code module below, derive the requirements it
implements. For each requirement: functional or NFR? source line
range? business rule or technical?

Code:
\`\`\`{language}
{paste code}
\`\`\`
\`\`\`

**Failure mode.** Pure-LLM prompts on >2000-line files lose context. This is why production reverse-engineering needs a code-graph index (which Auditee builds for [legacy modernization](/app/legacy)).

---

## What separates production from playground

The 15 prompts above are great for prototyping. They struggle on production work because:

1. **No memory.** Each prompt forgets the last one.
2. **No retrieval.** Standards aren't in the model's recall.
3. **No traceability.** Output isn't linked back to source.
4. **No structure.** You re-format every result.
5. **No collaboration.** Three BAs running the same prompt get three different outputs.

This is the gap purpose-built tools fill. Auditee's [Smart Interview](/app/interview), [Requirements](/app/requirements) and [Reports](/app/reports) modules are essentially these prompts, structured, with retrieval, classification, traceability and review baked in.

Try the prompts above in your favourite LLM. When you hit the wall — [book a walkthrough](/contact).`,
};
