export type PromptCategory =
  | "Discovery"
  | "Gap Detection"
  | "BRD / PRD Drafting"
  | "Stakeholder Validation"
  | "Compliance";

export type LibraryPrompt = {
  id: string;
  title: string;
  category: PromptCategory;
  summary: string;
  prompt: string;
  variables: string[];
};

export const PROMPT_LIBRARY: LibraryPrompt[] = [
  {
    id: "discovery-stakeholder-map",
    title: "Stakeholder map from a brief",
    category: "Discovery",
    summary: "Extract every stakeholder, their goals, and their pain points from a raw business brief.",
    prompt:
      "Read the business brief below and produce a stakeholder map. For each stakeholder return: name, role, primary goal, top three pains, and the success signal that would convince them this initiative worked.\n\nBrief:\n{{brief}}",
    variables: ["brief"],
  },
  {
    id: "discovery-jobs-to-be-done",
    title: "Jobs-to-be-done extraction",
    category: "Discovery",
    summary: "Convert a product brief into a structured JTBD list with situation, motivation, and outcome.",
    prompt:
      "From the brief below, extract the top 8 jobs-to-be-done. For each: situation, motivation, expected outcome, and the metric you would track.\n\nBrief:\n{{brief}}",
    variables: ["brief"],
  },
  {
    id: "discovery-domain-glossary",
    title: "Domain glossary builder",
    category: "Discovery",
    summary: "Build a 20-term domain glossary from any uploaded source material so requirements stay consistent.",
    prompt:
      "Read the source material and produce a 20-term domain glossary. For each term: canonical name, two-sentence definition, synonyms to avoid, and an example sentence.\n\nSource:\n{{source}}",
    variables: ["source"],
  },
  {
    id: "gap-missing-nfrs",
    title: "Missing non-functional requirements",
    category: "Gap Detection",
    summary: "Inspect a requirements list and flag every NFR category (performance, security, accessibility, …) that is missing.",
    prompt:
      "Inspect the requirements list. List every non-functional requirement category that is missing or under-specified. For each gap: category, why it matters for this domain, and a draft NFR statement.\n\nRequirements:\n{{requirements}}\n\nDomain: {{domain}}",
    variables: ["requirements", "domain"],
  },
  {
    id: "gap-conflict-finder",
    title: "Conflicting requirements finder",
    category: "Gap Detection",
    summary: "Find pairs of requirements that contradict each other, with explanation and proposed reconciliation.",
    prompt:
      "Find every pair of requirements that conflict or contradict each other. For each conflict: the two requirement codes, why they conflict, and a proposed reconciliation that preserves both intents where possible.\n\nRequirements:\n{{requirements}}",
    variables: ["requirements"],
  },
  {
    id: "gap-edge-cases",
    title: "Edge case generator",
    category: "Gap Detection",
    summary: "For one user story, generate the edge and failure cases the happy path doesn't cover.",
    prompt:
      "For the user story below, generate 12 edge / failure cases the happy path does not cover. Group as: input edges, state edges, integration edges, security edges, regulatory edges.\n\nUser story:\n{{userStory}}",
    variables: ["userStory"],
  },
  {
    id: "brd-executive-summary",
    title: "BRD executive summary",
    category: "BRD / PRD Drafting",
    summary: "Draft a tight 1-page executive summary for a Business Requirements Document.",
    prompt:
      "Draft a one-page BRD executive summary for the project below. Sections: business context, objective, scope, success metrics, risks, decision needed.\n\nProject:\n{{projectContext}}",
    variables: ["projectContext"],
  },
  {
    id: "prd-feature-spec",
    title: "PRD feature specification",
    category: "BRD / PRD Drafting",
    summary: "Generate a complete PRD-style feature spec with goals, UX flows, requirements, metrics.",
    prompt:
      "Write a PRD section for the feature below. Sections: problem, goal, non-goals, primary user flow, functional requirements, NFRs, analytics, rollout plan.\n\nFeature:\n{{feature}}",
    variables: ["feature"],
  },
  {
    id: "brd-user-stories",
    title: "User stories from feature description",
    category: "BRD / PRD Drafting",
    summary: "Decompose a feature into INVEST-compliant user stories with acceptance criteria.",
    prompt:
      "Decompose the feature into 6-12 INVEST-compliant user stories. Each: as-a / I-want / so-that, plus 2-4 acceptance criteria in Given/When/Then.\n\nFeature:\n{{feature}}",
    variables: ["feature"],
  },
  {
    id: "validation-review-questions",
    title: "Stakeholder review question set",
    category: "Stakeholder Validation",
    summary: "Generate the questions to ask a stakeholder so they can confirm a draft requirement set.",
    prompt:
      "Generate a 15-question stakeholder review checklist for the requirement set below. Questions must be plain language, force a yes/no/clarify answer, and cover correctness, completeness, priority, and acceptance.\n\nRequirements:\n{{requirements}}",
    variables: ["requirements"],
  },
  {
    id: "validation-sign-off-doc",
    title: "Sign-off document draft",
    category: "Stakeholder Validation",
    summary: "Produce a clean sign-off document ready to circulate with stakeholder signature blocks.",
    prompt:
      "Draft a sign-off document for the scope below. Include: scope summary, in-scope list, out-of-scope list, assumptions, risks, sign-off table (Name / Role / Decision / Date).\n\nScope:\n{{scope}}",
    variables: ["scope"],
  },
  {
    id: "validation-traceability-summary",
    title: "Traceability summary for stakeholders",
    category: "Stakeholder Validation",
    summary: "One-page narrative of how every requirement is covered by design, code, and tests.",
    prompt:
      "Write a one-page traceability narrative for the stakeholder. For each requirement code: which design artefact, which code module, which test cases. Flag any unlinked requirement explicitly.\n\nTraceability matrix:\n{{matrix}}",
    variables: ["matrix"],
  },
  {
    id: "compliance-control-mapping",
    title: "Requirement → control mapping",
    category: "Compliance",
    summary: "Map each requirement to the relevant clauses of a chosen standard (e.g. ISO 27001, IEC 62304).",
    prompt:
      "Map each requirement to the relevant clauses of {{standard}}. Output as table: requirement code, clause id, clause title, fit (full / partial / none), justification.\n\nRequirements:\n{{requirements}}",
    variables: ["requirements", "standard"],
  },
  {
    id: "compliance-evidence-checklist",
    title: "Audit evidence checklist",
    category: "Compliance",
    summary: "Build the evidence checklist an auditor will ask for, given a chosen framework.",
    prompt:
      "For an upcoming audit against {{standard}}, list every evidence artefact the assessor will request. Group by clause. Mark each as: required / recommended.\n\nProject context: {{projectContext}}",
    variables: ["standard", "projectContext"],
  },
  {
    id: "compliance-capa-draft",
    title: "CAPA action plan from a finding",
    category: "Compliance",
    summary: "Turn a single audit finding into a complete CAPA (Corrective and Preventive Action) plan.",
    prompt:
      "Draft a CAPA plan for the finding below. Sections: finding summary, root cause analysis, corrective actions (with owners, due dates), preventive actions, verification of effectiveness.\n\nFinding:\n{{finding}}",
    variables: ["finding"],
  },
];
