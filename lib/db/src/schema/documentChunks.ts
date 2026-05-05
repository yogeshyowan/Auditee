import { pgTable, text, integer, timestamp, jsonb, customType, index } from "drizzle-orm/pg-core";

// pgvector custom type — encodes/decodes float arrays to the `vector(N)` Postgres column.
// pgvector returns "[0.1,0.2,...]" string literals; we parse them back to number[].
export const vector = customType<{
  data: number[];
  driverData: string;
  config: { dimensions: number };
}>({
  dataType(config) {
    return `vector(${config?.dimensions ?? 1536})`;
  },
  toDriver(value: number[]): string {
    return `[${value.join(",")}]`;
  },
  fromDriver(value: unknown): number[] {
    if (Array.isArray(value)) return value as number[];
    if (typeof value === "string") {
      const trimmed = value.replace(/^\[|\]$/g, "");
      if (!trimmed) return [];
      return trimmed.split(",").map((n) => Number(n));
    }
    return [];
  },
});

// One semantic chunk of an ingested project source file. Chunks are produced
// by the RAG ingestion pipeline (see lib/rag.ts) and embedded with
// text-embedding-3-small (1536 dims). A per-project query then retrieves the
// top-K most relevant chunks via cosine distance instead of dumping the full
// raw source text into the LLM prompt.
export const documentChunksTable = pgTable(
  "document_chunks",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id").notNull(),
    sourceId: text("source_id").notNull(),
    sourceFileId: text("source_file_id").notNull(),
    path: text("path").notNull(),
    chunkIndex: integer("chunk_index").notNull().default(0),
    content: text("content").notNull(),
    embedding: vector("embedding", { dimensions: 1536 }),
    tokens: integer("tokens").notNull().default(0),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    byProject: index("document_chunks_project_idx").on(t.projectId),
    bySource: index("document_chunks_source_idx").on(t.sourceId),
    byFile: index("document_chunks_file_idx").on(t.sourceFileId),
  }),
);

export type DocumentChunk = typeof documentChunksTable.$inferSelect;
