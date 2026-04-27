import { pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const defectsTable = pgTable(
  "defects",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id").notNull(),
    // Always provenance-tagged: every defect comes from a connected
    // defect-management tool (Jira, Azure DevOps Bugs, Bugzilla, etc.).
    sourceId: text("source_id").notNull(),
    externalId: text("external_id").notNull(),
    externalUrl: text("external_url"),
    externalSystem: text("external_system").notNull(),
    key: text("key").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    status: text("status").notNull().default("open"),
    severity: text("severity").notNull().default("major"),
    priority: text("priority").notNull().default("p2"),
    component: text("component"),
    raisedAt: timestamp("raised_at", { withTimezone: true }),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    // Same partial-unique pattern as requirements: re-syncs cannot duplicate
    // an external defect, but every row always carries provenance so this
    // index is effectively total.
    provenanceUnique: uniqueIndex("defects_provenance_unique")
      .on(t.projectId, t.sourceId, t.externalId)
      .where(sql`${t.externalId} IS NOT NULL`),
  }),
);

export type Defect = typeof defectsTable.$inferSelect;
