/**
 * Multi-step document extraction pipeline.
 *
 * Closes architectural gap 2 vs eltegra.ai: requirement generation from a
 * raw business document used to be a single LLM call ("here is the doc,
 * give me requirements"). That collapses three distinct cognitive tasks:
 *   1. classify the document and split it into logical sections
 *   2. extract structured entities (actors, features, constraints, risks)
 *   3. synthesise standards-aware requirements from the entity set
 *
 * The pipeline runs each stage as its own model call (cheap, focused
 * prompts), passing structured JSON between them so each stage can be
 * inspected, retried, or replaced without re-doing the others. The final
 * stage receives a much smaller, denser prompt — which materially improves
 * requirement quality on long documents.
 */
import { jsonCompletion } from "./ai.js";

export type DocumentClassification = {
  documentType: string;
  domain: string;
  sections: { title: string; summary: string; content: string }[];
};

export type ExtractedEntities = {
  actors: { name: string; role: string }[];
  features: { name: string; description: string }[];
  constraints: { type: string; statement: string }[];
  risks: { severity: "low" | "medium" | "high"; statement: string }[];
  dataObjects: { name: string; description: string }[];
  externalSystems: string[];
};

export type StructuredRequirement = {
  title: string;
  description: string;
  type: "BRD" | "PRD" | "FRD" | "NFR";
  priority: "low" | "medium" | "high" | "critical";
  acceptanceCriteria: string[];
  tags: string[];
  rationale: string;
  linkedEntities: string[];
};

export type ExtractionResult = {
  classification: DocumentClassification;
  entities: ExtractedEntities;
  requirements: StructuredRequirement[];
};

const MAX_DOC_CHARS = 24000;

/**
 * Stage 1: classify document type, domain, and split into sections.
 * Cheap call — small JSON, descriptive prompt.
 */
async function classifyDocument(rawText: string): Promise<DocumentClassification> {
  const sys = `You are a senior business analyst. Classify the document and decompose it into 3-12 logical sections.
Return strict JSON:
{"documentType":string,"domain":string,"sections":[{"title":string,"summary":string,"content":string}]}
Rules:
- documentType: e.g. "Product Requirements Document", "Business Brief", "RFP", "Process SOP", "Regulatory Notice".
- domain: e.g. "Healthcare", "Banking", "Automotive Safety", "Telecom".
- sections must collectively cover the document. Keep each section.content short (<=600 chars summary, not full text).
- Output JSON only.`;
  const user = `Document:\n${rawText.slice(0, MAX_DOC_CHARS)}`;
  return jsonCompletion<DocumentClassification>(sys, user);
}

/**
 * Stage 2: extract structured entities from the classified document.
 * Sees only the section summaries (Stage 1 output), not the raw text — keeps
 * the prompt focused.
 */
async function extractEntities(cls: DocumentClassification): Promise<ExtractedEntities> {
  const sys = `You are a requirements engineer. From the classified document, extract structured entities.
Return strict JSON:
{"actors":[{"name":string,"role":string}],"features":[{"name":string,"description":string}],"constraints":[{"type":string,"statement":string}],"risks":[{"severity":"low"|"medium"|"high","statement":string}],"dataObjects":[{"name":string,"description":string}],"externalSystems":[string]}
Rules:
- actors: human or system roles that interact with the product.
- features: distinct user-facing or system-facing capabilities.
- constraints: regulatory / technical / business constraints (type = "regulatory" | "technical" | "business" | "performance" | "security").
- risks: things that could fail, harm, or non-comply.
- dataObjects: nouns that the system stores or transmits.
- Return only entities the document supports. Output JSON only.`;
  const sectionDigest = cls.sections.map((s, i) => `Section ${i + 1}: ${s.title}\n${s.summary}`).join("\n\n");
  const user = `Document type: ${cls.documentType}\nDomain: ${cls.domain}\n\n${sectionDigest}`;
  return jsonCompletion<ExtractedEntities>(sys, user);
}

/**
 * Stage 3: synthesise standards-aware requirements from the entity set.
 * Final prompt is small and dense — entities + classification only, no raw text.
 */
async function synthesiseRequirements(
  cls: DocumentClassification,
  entities: ExtractedEntities,
  standards: string[],
  targetCount = 12,
): Promise<StructuredRequirement[]> {
  const sys = `You are an enterprise requirements engineer. Synthesise structured requirements from the extracted entities. Conform to the listed standards where applicable.
Return strict JSON:
{"requirements":[{"title":string,"description":string,"type":"BRD"|"PRD"|"FRD"|"NFR","priority":"low"|"medium"|"high"|"critical","acceptanceCriteria":[string],"tags":[string],"rationale":string,"linkedEntities":[string]}]}
Rules:
- Generate ${targetCount} requirements covering features, constraints, risks and data objects.
- Each must have 2-5 acceptance criteria written in "Given/When/Then" or imperative style.
- linkedEntities: list the actor / feature / constraint names you used.
- tags: include the document domain plus any matched standard codes.
- type: BRD = business outcome, PRD = product capability, FRD = functional behaviour, NFR = non-functional quality.
- priority: critical for safety/compliance constraints, high for primary features, medium for secondary, low for nice-to-have.
- Output JSON only.`;
  const user = JSON.stringify({
    documentType: cls.documentType,
    domain: cls.domain,
    standards,
    actors: entities.actors,
    features: entities.features,
    constraints: entities.constraints,
    risks: entities.risks,
    dataObjects: entities.dataObjects,
    externalSystems: entities.externalSystems,
  });
  const resp = await jsonCompletion<{ requirements: StructuredRequirement[] }>(sys, user);
  return resp.requirements ?? [];
}

/**
 * Run the full pipeline. Each stage's output is preserved in the result so
 * callers (audit trail, debugging UI) can inspect the intermediate steps.
 *
 * If any individual stage fails, the error propagates — callers should wrap
 * in their own try/catch and fall back to the legacy single-prompt path.
 */
export async function extractRequirementsFromDocument(
  rawText: string,
  opts: { standards?: string[]; targetCount?: number } = {},
): Promise<ExtractionResult> {
  const standards = opts.standards ?? [];
  const targetCount = opts.targetCount ?? 12;

  const classification = await classifyDocument(rawText);
  const entities = await extractEntities(classification);
  const requirements = await synthesiseRequirements(classification, entities, standards, targetCount);

  return { classification, entities, requirements };
}
