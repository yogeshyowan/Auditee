/**
 * Per-project RAG (retrieval-augmented generation) layer.
 *
 * Closes architectural gap 1 vs eltegra.ai: instead of dumping raw source
 * text into LLM prompts, project sources are chunked, embedded with
 * text-embedding-3-small (1536 dims), and stored in pgvector. AI routes then
 * retrieve only the top-K most semantically relevant chunks for a given
 * question / generation prompt.
 *
 * The pipeline is best-effort and idempotent:
 *   - If OPENAI_API_KEY is not set, ingestion is a no-op and retrieval
 *     returns an empty result. Callers fall back to legacy raw-text context.
 *   - Re-indexing a sourceId fully replaces its chunks (transactional).
 */
import { randomUUID } from "node:crypto";
import { sql, eq, and, inArray } from "drizzle-orm";
import { db, sourceFilesTable, documentChunksTable, projectSourcesTable } from "@workspace/db";
import { embedTexts, embedQuery, isEmbeddingsAvailable } from "./embeddings.js";
import { logger } from "./logger.js";

// ---- Chunking ---------------------------------------------------------------

const TARGET_CHARS = 1800; // ~450 tokens
const OVERLAP_CHARS = 200;

/**
 * Split text into roughly TARGET_CHARS chunks with OVERLAP_CHARS overlap.
 * Prefers paragraph / line boundaries so chunks remain semantically coherent.
 * Code is split on blank-line / brace boundaries when possible.
 */
export function chunkText(text: string, language?: string | null): string[] {
  const t = text.replace(/\r\n/g, "\n").trim();
  if (!t) return [];
  if (t.length <= TARGET_CHARS) return [t];

  const isCode = language ? !["md", "mdx", "txt", "rst"].includes(language.toLowerCase()) : false;
  const splitter = isCode ? /\n\n+|\n(?=(?:function |class |def |public |private |protected |export ))/g : /\n\n+/g;

  const paragraphs = t.split(splitter).filter(Boolean);
  const out: string[] = [];
  let buf = "";
  for (const p of paragraphs) {
    if ((buf + "\n\n" + p).length <= TARGET_CHARS) {
      buf = buf ? buf + "\n\n" + p : p;
      continue;
    }
    if (buf) out.push(buf);
    if (p.length <= TARGET_CHARS) {
      buf = p;
    } else {
      // Hard-split a paragraph that is itself too large.
      for (let i = 0; i < p.length; i += TARGET_CHARS - OVERLAP_CHARS) {
        out.push(p.slice(i, i + TARGET_CHARS));
      }
      buf = "";
    }
  }
  if (buf) out.push(buf);

  // Apply soft overlap: prefix each chunk after the first with the tail of
  // the previous chunk so retrieved snippets carry adjacent context.
  if (out.length <= 1) return out;
  const overlapped: string[] = [out[0]];
  for (let i = 1; i < out.length; i++) {
    const prevTail = out[i - 1].slice(-OVERLAP_CHARS);
    overlapped.push(prevTail + "\n" + out[i]);
  }
  return overlapped;
}

// ---- Indexing ---------------------------------------------------------------

/**
 * Re-index every text file under a single source as RAG chunks.
 * Wipes existing chunks for the source first (atomic), then inserts new
 * embeddings in batches. Safe to call from a background task — exceptions
 * are logged and swallowed so ingestion never blocks the user-facing flow.
 */
export async function indexSourceForRAG(projectId: string, sourceId: string): Promise<{ chunks: number; skipped: boolean }> {
  if (!isEmbeddingsAvailable()) {
    return { chunks: 0, skipped: true };
  }
  try {
    const files = await db
      .select()
      .from(sourceFilesTable)
      .where(eq(sourceFilesTable.sourceId, sourceId));

    type Pending = { fileId: string; path: string; chunkIndex: number; content: string };
    const pending: Pending[] = [];
    for (const f of files) {
      if (!f.content || f.isBinary === "true") continue;
      const chunks = chunkText(f.content, f.language);
      chunks.forEach((c, i) => {
        pending.push({ fileId: f.id, path: f.path, chunkIndex: i, content: c });
      });
    }

    if (pending.length === 0) {
      await db.delete(documentChunksTable).where(eq(documentChunksTable.sourceId, sourceId));
      return { chunks: 0, skipped: false };
    }

    // Embed in batches.
    const BATCH = 64;
    const embeddings: number[][] = [];
    for (let i = 0; i < pending.length; i += BATCH) {
      const slice = pending.slice(i, i + BATCH);
      const vecs = await embedTexts(slice.map((p) => p.content));
      if (!vecs) return { chunks: 0, skipped: true };
      embeddings.push(...vecs);
    }

    // Wipe + insert (transactional).
    await db.transaction(async (tx) => {
      await tx.delete(documentChunksTable).where(eq(documentChunksTable.sourceId, sourceId));
      // Insert in chunks of 200 rows to keep parameter count safe.
      const ROW_BATCH = 200;
      for (let i = 0; i < pending.length; i += ROW_BATCH) {
        const slice = pending.slice(i, i + ROW_BATCH);
        await tx.insert(documentChunksTable).values(
          slice.map((p, j) => ({
            id: randomUUID(),
            projectId,
            sourceId,
            sourceFileId: p.fileId,
            path: p.path,
            chunkIndex: p.chunkIndex,
            content: p.content,
            embedding: embeddings[i + j],
            tokens: Math.round(p.content.length / 4),
            metadata: {},
          })),
        );
      }
    });

    logger.info({ projectId, sourceId, chunks: pending.length }, "RAG: indexed source");
    return { chunks: pending.length, skipped: false };
  } catch (err) {
    logger.error({ err, projectId, sourceId }, "RAG: indexSourceForRAG failed");
    return { chunks: 0, skipped: true };
  }
}

/**
 * Re-index every source under a project. Used by background backfill jobs.
 */
export async function indexProjectForRAG(projectId: string): Promise<{ totalChunks: number }> {
  const sources = await db
    .select({ id: projectSourcesTable.id })
    .from(projectSourcesTable)
    .where(eq(projectSourcesTable.projectId, projectId));
  let total = 0;
  for (const s of sources) {
    const r = await indexSourceForRAG(projectId, s.id);
    total += r.chunks;
  }
  return { totalChunks: total };
}

// ---- Retrieval --------------------------------------------------------------

export type RetrievedChunk = {
  id: string;
  path: string;
  content: string;
  sourceId: string;
  score: number; // cosine similarity in [0, 1]
};

/**
 * Retrieve the top-K most relevant chunks across a project for a query.
 * Uses pgvector cosine distance (`<=>`) and converts to similarity (1 - d).
 */
export async function retrieveChunks(
  projectId: string,
  query: string,
  topK = 8,
): Promise<RetrievedChunk[]> {
  if (!isEmbeddingsAvailable()) return [];
  const qVec = await embedQuery(query);
  if (!qVec) return [];
  const literal = `[${qVec.join(",")}]`;

  // Raw SQL because drizzle's expression language doesn't model the `<=>` op.
  // Parameters are still safely bound. embedding can be NULL for failed rows
  // — filter them out so they don't pollute the ranking.
  try {
    const rows = await db.execute(sql`
      SELECT id, path, content, source_id AS "sourceId",
             1 - (embedding <=> ${literal}::vector) AS score
      FROM document_chunks
      WHERE project_id = ${projectId}
        AND embedding IS NOT NULL
      ORDER BY embedding <=> ${literal}::vector
      LIMIT ${topK}
    `);
    return (rows.rows as RetrievedChunk[]).map((r) => ({
      id: r.id,
      path: r.path,
      content: r.content,
      sourceId: r.sourceId,
      score: typeof r.score === "string" ? Number(r.score) : (r.score ?? 0),
    }));
  } catch (err) {
    logger.warn({ err, projectId }, "RAG: retrieveChunks failed");
    return [];
  }
}

/**
 * Format retrieved chunks as a single LLM-ready context block with source
 * citations the model can quote back. Truncates at maxChars to fit the
 * downstream prompt budget.
 */
export function formatChunksAsContext(chunks: RetrievedChunk[], maxChars = 12000): string {
  if (chunks.length === 0) return "";
  const blocks: string[] = [];
  let used = 0;
  for (const c of chunks) {
    const header = `--- source: ${c.path} (relevance ${c.score.toFixed(2)}) ---`;
    const block = `${header}\n${c.content}`;
    if (used + block.length > maxChars) break;
    blocks.push(block);
    used += block.length + 2;
  }
  return blocks.join("\n\n");
}

/**
 * Drop all RAG chunks for a source — called when a source is deleted.
 */
export async function deleteSourceChunks(sourceIds: string[]): Promise<void> {
  if (sourceIds.length === 0) return;
  await db.delete(documentChunksTable).where(inArray(documentChunksTable.sourceId, sourceIds));
}

/**
 * Drop all RAG chunks for a project.
 */
export async function deleteProjectChunks(projectId: string): Promise<void> {
  await db.delete(documentChunksTable).where(eq(documentChunksTable.projectId, projectId));
}
