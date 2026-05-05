/**
 * OpenAI embeddings wrapper for the RAG pipeline.
 *
 * Uses text-embedding-3-small (1536 dims) to match the document_chunks
 * vector column. Batches up to 100 inputs per call (OpenAI hard limit) and
 * silently returns null when no API key is configured so server boot still
 * succeeds in dev environments without keys.
 */
import OpenAI from "openai";
import { logger } from "./logger.js";

const EMBED_MODEL = "text-embedding-3-small";
const EMBED_DIM = 1536;
const MAX_BATCH = 96;
const MAX_INPUT_CHARS = 8000; // ~2k tokens per chunk; well under model limit

let cachedClient: OpenAI | null = null;
function getClient(): OpenAI | null {
  if (cachedClient) return cachedClient;
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  cachedClient = new OpenAI({ apiKey: key });
  return cachedClient;
}

export const EMBEDDING_DIMENSIONS = EMBED_DIM;

export function isEmbeddingsAvailable(): boolean {
  return getClient() !== null;
}

/**
 * Embed an array of strings, returning a parallel array of float[1536]
 * vectors. Returns null if no embedding provider is configured (caller
 * decides whether to skip RAG indexing or fall back to plain text context).
 */
export async function embedTexts(inputs: string[]): Promise<number[][] | null> {
  const client = getClient();
  if (!client) return null;
  if (inputs.length === 0) return [];

  const cleaned = inputs.map((s) => (s.length > MAX_INPUT_CHARS ? s.slice(0, MAX_INPUT_CHARS) : s));
  const out: number[][] = [];
  for (let i = 0; i < cleaned.length; i += MAX_BATCH) {
    const batch = cleaned.slice(i, i + MAX_BATCH);
    try {
      const resp = await client.embeddings.create({
        model: EMBED_MODEL,
        input: batch,
      });
      for (const item of resp.data) out.push(item.embedding as number[]);
    } catch (err) {
      logger.warn({ err, batchSize: batch.length }, "embedTexts batch failed");
      // Push zero vectors so result length matches input length — caller can
      // decide whether to drop them, but this keeps array indexes aligned.
      for (let j = 0; j < batch.length; j++) out.push(new Array(EMBED_DIM).fill(0));
    }
  }
  return out;
}

export async function embedQuery(text: string): Promise<number[] | null> {
  const r = await embedTexts([text]);
  if (!r || r.length === 0) return null;
  return r[0];
}
