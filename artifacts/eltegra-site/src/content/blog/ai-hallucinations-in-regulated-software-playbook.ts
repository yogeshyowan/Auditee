import type { BlogPost } from "./index";

export const post: BlogPost = {
  slug: "ai-hallucinations-in-regulated-software-playbook",
  title: "AI Hallucinations in Regulated Software: A Compliance Leader's Playbook",
  description:
    "Why generic LLMs are a regulatory liability for safety-critical work, and what grounding architecture — citations, retrieval, deterministic constraints — auditors will accept.",
  date: "2026-02-24",
  author: "Auditee Research",
  tags: ["AI", "LLM", "Compliance", "EU AI Act", "Governance"],
  readingTimeMin: 11,
  excerpt:
    "An LLM that confidently cites a non-existent requirement is more dangerous than no LLM at all. Here is the architecture and operating model that makes AI usable in a regulated environment.",
  body: `## Why hallucinations are a compliance problem, not a UX problem

In consumer settings a hallucinated answer is annoying. In a regulated workflow it is a finding. If your AI drafted a requirement that referenced "ISO 26262 §9.5.2.7" and that clause does not exist, you have:

- A safety case argument resting on a fabricated citation.
- A traceability link with no source of truth.
- A statement in a controlled document that an auditor *will* check.
- Potential exposure under the EU AI Act for high-risk system documentation.

The fix is not "tell users to verify." Verification at scale fails. The fix is architectural.

## The four root causes of hallucination

1. **No retrieval grounding.** The model is asked to answer from training memory.
2. **Stale or wrong context.** Retrieval ran but pulled the wrong document.
3. **Loose generation constraints.** The prompt allows free-form output where a structured schema would catch errors.
4. **Missing verifier.** Nothing checks the output against ground truth before it reaches the user.

Each cause has a counter-measure. A defensible AI feature uses *all four*.

## Counter-measure 1: Retrieval that returns ground-truth IDs

Every answer must be derived from your live system of record:

- Requirements stored with stable IDs and version history.
- Standards stored as parsed text with section and clause IDs.
- Code indexed with file, function, and commit pointers.
- Defects, tests, and CAPAs with their canonical IDs.

When a user asks "which requirements are affected by handover latency?", the retrieval step returns *PRD-031, PRD-044, FRD-112* — actual IDs in your graph. The LLM never invents a requirement.

## Counter-measure 2: Citation-required generation

The generation prompt must require citations and the output schema must enforce them:

\`\`\`json
{
  "answer": "...",
  "citations": [
    { "type": "Requirement", "id": "PRD-031", "url": "/app/requirements/PRD-031" },
    { "type": "StandardClause", "id": "3GPP TS 23.501 §5.3", "url": "..." }
  ]
}
\`\`\`

If the model returns an empty \`citations\` array, the answer is suppressed. If a citation ID does not resolve in the live graph, the answer is suppressed.

## Counter-measure 3: Structured outputs over prose

For safety-critical workflows, prefer structured JSON over free-form text:

- A *requirement* has fields (id, title, text, classification, links, standards). Generate the structure; reject free-form additions.
- A *test case* has preconditions, steps, and expected results. Same constraint.
- A *CAPA* has owner, due date, RCA, planned actions, effectiveness criteria.

This leaves much less room for the model to invent.

## Counter-measure 4: A deterministic verifier

Before any AI-drafted artefact lands, run a deterministic check:

- Does every cited ID exist?
- Does every cited clause exist?
- Are the linked requirements compatible (same project, same baseline)?
- Does the proposed change pass schema validation?
- Are conflicts with existing artefacts surfaced?

The verifier blocks publication and returns the AI to fix-it loop, not the human.

## Operating model: human-in-the-loop where it matters

Not every step needs review. Pick reviewers by risk:

| Action | Reviewer |
| --- | --- |
| Draft a non-safety requirement | Author |
| Draft a Class B/C requirement or hazard | Author + Quality |
| Edit a baselined requirement | Author + Quality + Regulatory |
| Auto-link existing artefacts | None — verifier-only |
| Generate a test case | Author |
| Generate an audit narrative | Author + Quality |
| Draft a CAPA | Author + CAPA owner |

Stage your reviews so they accelerate the team rather than create a queue.

## EU AI Act considerations

For systems classified as high-risk under the EU AI Act (Annex III), additional obligations apply:

- **Risk management system** for the AI system itself (Article 9).
- **Data governance** for training and grounding data (Article 10).
- **Technical documentation** of the AI system's capabilities and limitations (Article 11).
- **Logging** of outputs (Article 12) — every AI-drafted artefact must be reproducible.
- **Human oversight** (Article 14) — the operating model above.
- **Accuracy, robustness, cybersecurity** (Article 15).

If you are using AI to draft regulated artefacts, you are likely operating a high-risk AI system. Plan accordingly.

## What to ask vendors

Questions that distinguish a credible AI-RM platform from a chatbot wrapper:

1. Where do your answers come from? Show me the retrieval pipeline.
2. Can you show me an answer with no citations? (Correct: "no — the system suppresses uncited output.")
3. What happens if I ask for a requirement that does not exist? (Correct: "we surface that no matching requirement was found.")
4. How is your AI logged for reproducibility?
5. How do you handle baselined documents — can the AI propose changes without modifying the baseline?
6. What is your policy on customer data used in training?

If a vendor cannot answer these clearly, you have your answer.

## A 30-day rollout plan

1. **Days 0–7** — Inventory the AI use-cases on your roadmap by risk class.
2. **Days 7–14** — Pilot one low-risk workflow (test-case generation from existing requirements) end-to-end.
3. **Days 14–21** — Stand up the verifier and citation-enforcement layer.
4. **Days 21–28** — Promote the pilot to a Class B requirements workflow with reviewer-in-the-loop.
5. **Days 28–30** — Document the AI risk management file (EU AI Act §9 alignment) and run a tabletop with Quality.

[See grounded Q&A on the Sirius 5G demo](/demo-videos/ask) — every answer cited to live evidence, zero hallucinations.
`,
};
