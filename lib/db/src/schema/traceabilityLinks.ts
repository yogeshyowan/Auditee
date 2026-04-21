import { pgTable, text } from "drizzle-orm/pg-core";

export const traceabilityLinksTable = pgTable("traceability_links", {
  id: text("id").primaryKey(),
  requirementId: text("requirement_id").notNull(),
  codeArtifactId: text("code_artifact_id").notNull(),
  kind: text("kind").notNull().default("implements"),
});

export type TraceabilityLink = typeof traceabilityLinksTable.$inferSelect;
