import { pgTable, text, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { projectsTable } from "./projects";

export const PROJECT_ROLES = ["manager", "developer", "reviewer", "auditor"] as const;
export type ProjectRole = (typeof PROJECT_ROLES)[number];

export const projectMembersTable = pgTable(
  "project_members",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projectsTable.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    email: text("email"),
    role: text("role").notNull(),
    addedBy: text("added_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    byProject: index("project_members_project_idx").on(t.projectId),
    uniqueUser: uniqueIndex("project_members_project_user_uq").on(t.projectId, t.userId),
  }),
);

export type ProjectMember = typeof projectMembersTable.$inferSelect;
