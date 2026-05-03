import { post as buyersGuide } from "./ai-requirements-management-buyers-guide-2026";
import { post as iec62304 } from "./iec-62304-medical-device-software-lifecycle-guide";
import { post as soc2VsIso } from "./soc-2-vs-iso-27001-which-framework-should-you-choose";
import { post as fromCode } from "./generating-requirements-from-legacy-code";
import { post as doorsAlternatives } from "./top-10-ibm-doors-alternatives-2026";
import { post as hipaaChecklist } from "./hipaa-software-compliance-requirements-checklist";
import { post as pdlcAuditChecklist } from "./enterprise-pdlc-audit-checklist";
import { post as spreadsheetsBeatRm } from "./why-spreadsheets-still-beat-rm-tools";
import { post as legacyCobol } from "./legacy-cobol-modernization-with-ai";
import { post as fifteenPrompts } from "./15-ai-prompts-for-requirements-gathering";
import { post as poorReqsCostBillions } from "./poor-software-requirements-cost-billions";
import { post as iso26262Asil } from "./iso-26262-asil-classification-practical-guide";
import { post as do178cPrimer } from "./do-178c-software-certification-2026-primer";
import { post as traceabilityMatrix } from "./bidirectional-traceability-matrix-complete-guide";
import { post as capaLifecycle } from "./capa-lifecycle-from-finding-to-closure";
import { post as continuousCompliance } from "./continuous-compliance-vs-quarterly-audits";
import { post as pdlcVsSdlc } from "./pdlc-vs-sdlc-for-regulated-teams";
import { post as aiHallucinations } from "./ai-hallucinations-in-regulated-software-playbook";
import { post as fiveGCompliance } from "./5g-network-compliance-3gpp-etsi-mapping";
import { post as euAiAct } from "./eu-ai-act-2026-software-team-checklist";
import { post as jiraToReqs } from "./from-jira-tickets-to-compliant-requirements";

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string; // ISO 8601
  updated?: string;
  author: string;
  tags: string[];
  readingTimeMin: number;
  heroImage?: string;
  excerpt: string;
  body: string; // markdown
}

export const POSTS: BlogPost[] = [
  buyersGuide,
  iec62304,
  soc2VsIso,
  fromCode,
  doorsAlternatives,
  hipaaChecklist,
  pdlcAuditChecklist,
  spreadsheetsBeatRm,
  legacyCobol,
  fifteenPrompts,
  poorReqsCostBillions,
  iso26262Asil,
  do178cPrimer,
  traceabilityMatrix,
  capaLifecycle,
  continuousCompliance,
  pdlcVsSdlc,
  aiHallucinations,
  fiveGCompliance,
  euAiAct,
  jiraToReqs,
].sort((a, b) => (a.date < b.date ? 1 : -1));

export function getPost(slug: string): BlogPost | undefined {
  return POSTS.find((p) => p.slug === slug);
}

export function getRelatedPosts(slug: string, limit = 3): BlogPost[] {
  const current = getPost(slug);
  if (!current) return POSTS.slice(0, limit);
  return POSTS.filter((p) => p.slug !== slug)
    .map((p) => ({
      post: p,
      score: p.tags.filter((t) => current.tags.includes(t)).length,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.post);
}

export function allTags(): string[] {
  const s = new Set<string>();
  POSTS.forEach((p) => p.tags.forEach((t) => s.add(t)));
  return Array.from(s).sort();
}
