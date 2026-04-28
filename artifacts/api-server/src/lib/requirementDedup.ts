// Lightweight similarity-based dedup for AI-generated requirements.
//
// Used by every AI endpoint that bulk-inserts requirements (Generate from
// brief, Generate from code, Smart Interview, Legacy extract, Gap promote)
// so the same project never accumulates two rows that are obvious paraphrases
// of the same thing — e.g. "User can sign in" + "User can log in".
//
// We deliberately keep the scoring purely lexical (no embeddings) so dedup
// is fast, deterministic, and adds zero token cost. It catches the obvious
// duplicates; near-duplicates that paraphrase aggressively still slip
// through and the user can merge them manually.
import { db, requirementsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const STOPWORDS = new Set([
  "the","a","an","of","for","to","and","or","in","on","at","by","is","are",
  "be","with","that","this","it","as","from","into","via","per","each",
  "must","shall","should","will","can","may","system","user","application",
  "app","feature","function","ability","support","provide","allow","enable",
]);

export function normalizeForCompare(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\u2019']s\b/g, "")            // possessives
    .replace(/[^a-z0-9\s]+/g, " ")           // strip punctuation
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(s: string): Set<string> {
  const out = new Set<string>();
  for (const w of normalizeForCompare(s).split(" ")) {
    if (w.length < 3) continue;            // drop ultra-short tokens
    if (STOPWORDS.has(w)) continue;
    out.add(w);
  }
  return out;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersect = 0;
  for (const t of a) if (b.has(t)) intersect++;
  const union = a.size + b.size - intersect;
  return union === 0 ? 0 : intersect / union;
}

type ExistingReq = { id: string; code: string; title: string; description: string | null };

export type DedupExisting = {
  row: ExistingReq;
  normTitle: string;
  titleTokens: Set<string>;
  combinedTokens: Set<string>;
};

export type DedupCandidate = {
  title: string;
  description?: string | null;
};

export type DedupMatch = {
  duplicateOfId: string;
  duplicateOfCode: string;
  duplicateOfTitle: string;
  score: number;
  reason: "exact_title" | "title_overlap" | "title_desc_overlap";
};

const TITLE_OVERLAP_THRESHOLD = 0.85;
const COMBINED_OVERLAP_THRESHOLD = 0.80;

/**
 * Pre-load and tokenise every requirement in the project so callers can
 * dedup a batch of N candidates with N*M comparisons in memory rather than
 * hitting the DB once per candidate.
 */
export async function loadProjectDedupIndex(projectId: string): Promise<DedupExisting[]> {
  const rows = await db
    .select({
      id: requirementsTable.id,
      code: requirementsTable.code,
      title: requirementsTable.title,
      description: requirementsTable.description,
    })
    .from(requirementsTable)
    .where(eq(requirementsTable.projectId, projectId));
  return rows.map((r) => {
    const normTitle = normalizeForCompare(r.title);
    const titleTokens = tokenize(r.title);
    const combinedTokens = tokenize(`${r.title} ${(r.description ?? "").slice(0, 280)}`);
    return { row: r, normTitle, titleTokens, combinedTokens };
  });
}

/**
 * Find the best matching existing requirement, or null if no match.
 * Mutates nothing — pure scoring.
 */
export function findDuplicate(
  candidate: DedupCandidate,
  index: DedupExisting[],
): DedupMatch | null {
  if (!candidate.title.trim()) return null;
  const candNormTitle = normalizeForCompare(candidate.title);
  const candTitleTokens = tokenize(candidate.title);
  const candCombinedTokens = tokenize(`${candidate.title} ${(candidate.description ?? "").slice(0, 280)}`);

  let best: DedupMatch | null = null;
  for (const ex of index) {
    // Tier 1 — exact normalised title match (cheapest, strongest signal).
    if (candNormTitle && candNormTitle === ex.normTitle) {
      return {
        duplicateOfId: ex.row.id,
        duplicateOfCode: ex.row.code,
        duplicateOfTitle: ex.row.title,
        score: 1,
        reason: "exact_title",
      };
    }
    // Tier 2 — strong title-token overlap (catches paraphrases).
    const titleScore = jaccard(candTitleTokens, ex.titleTokens);
    if (titleScore >= TITLE_OVERLAP_THRESHOLD) {
      if (!best || titleScore > best.score) {
        best = {
          duplicateOfId: ex.row.id,
          duplicateOfCode: ex.row.code,
          duplicateOfTitle: ex.row.title,
          score: titleScore,
          reason: "title_overlap",
        };
      }
      continue;
    }
    // Tier 3 — title + description overlap (catches reworded titles with
    // similar bodies, e.g. "Login flow" vs "Sign-in workflow" both
    // describing the same OAuth handshake).
    const combinedScore = jaccard(candCombinedTokens, ex.combinedTokens);
    if (combinedScore >= COMBINED_OVERLAP_THRESHOLD) {
      if (!best || combinedScore > best.score) {
        best = {
          duplicateOfId: ex.row.id,
          duplicateOfCode: ex.row.code,
          duplicateOfTitle: ex.row.title,
          score: combinedScore,
          reason: "title_desc_overlap",
        };
      }
    }
  }
  return best;
}

/**
 * Push a freshly-inserted requirement back into the in-memory index so
 * subsequent candidates in the same batch dedup against each other too
 * (e.g. the AI returned the same row twice in one response).
 */
export function indexNewRow(
  index: DedupExisting[],
  row: { id: string; code: string; title: string; description: string | null },
): void {
  index.push({
    row,
    normTitle: normalizeForCompare(row.title),
    titleTokens: tokenize(row.title),
    combinedTokens: tokenize(`${row.title} ${(row.description ?? "").slice(0, 280)}`),
  });
}
