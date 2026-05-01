import { post as buyersGuide } from "./ai-requirements-management-buyers-guide-2026";
import { post as iec62304 } from "./iec-62304-medical-device-software-lifecycle-guide";
import { post as soc2VsIso } from "./soc-2-vs-iso-27001-which-framework-should-you-choose";
import { post as fromCode } from "./generating-requirements-from-legacy-code";
import { post as doorsAlternatives } from "./top-10-ibm-doors-alternatives-2026";
import { post as hipaaChecklist } from "./hipaa-software-compliance-requirements-checklist";
import { post as marketingChecklist } from "./auditee-site-all-in-one-marketing-checklist";

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
  marketingChecklist,
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
