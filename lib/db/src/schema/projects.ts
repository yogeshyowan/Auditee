import { pgTable, text, integer, timestamp, index, boolean } from "drizzle-orm/pg-core";
import { workspacesTable } from "./workspaces";

export const projectsTable = pgTable(
  "projects",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspacesTable.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description").notNull(),
    owner: text("owner"),
    complianceScore: integer("compliance_score").notNull().default(0),
    /**
     * Demo projects are seeded at startup and are visible (read-only, auditor
     * role) to every authenticated user regardless of workspace. They belong to
     * the system workspace `ws-demo` and can never be mutated via the API.
     */
    isDemo: boolean("is_demo").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    byWorkspace: index("projects_workspace_idx").on(t.workspaceId),
  }),
);

export type Project = typeof projectsTable.$inferSelect;
