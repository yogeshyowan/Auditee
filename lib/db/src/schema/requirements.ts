import { pgTable, text, timestamp, jsonb, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const requirementsTable = pgTable(
  "requirements",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id").notNull(),
    code: text("code").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    type: text("type").notNull(), // BRD | PRD | FRD | NFR
    status: text("status").notNull().default("draft"),
    priority: text("priority").notNull().default("medium"),
    owner: text("owner").notNull().default("Unassigned"),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    linkedFrameworks: jsonb("linked_frameworks").$type<string[]>().notNull().default([]),
    // Provenance for requirements pulled in from external requirements-management tools
    // (DOORS, Jama, Polarion, codeBeamer, Azure DevOps, ReqIF imports, etc.).
    // All four columns are nullable — manually-authored requirements leave them empty.
    sourceId: text("source_id"),
    externalId: text("external_id"),
    externalUrl: text("external_url"),
    externalSystem: text("external_system"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    // Partial unique index — guarantees that two concurrent RM-syncs cannot
    // produce duplicate rows for the same external item. Manually-created
    // requirements (sourceId/externalId both NULL) are ignored by this index.
    provenanceUnique: uniqueIndex("requirements_provenance_unique")
      .on(t.projectId, t.sourceId, t.externalId)
      .where(sql`${t.sourceId} IS NOT NULL AND ${t.externalId} IS NOT NULL`),
    // Hard guarantee that no two requirements in the same project share a
    // human-facing code. The `insertRequirement` helper in the API server
    // catches the resulting unique_violation (Postgres 23505) and retries
    // with the next free number, so concurrent inserts never collide.
    projectCodeUnique: uniqueIndex("requirements_project_code_unique").on(
      t.projectId,
      t.code,
    ),
  }),
);

export type Requirement = typeof requirementsTable.$inferSelect;
