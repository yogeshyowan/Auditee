import { pgTable, text, timestamp, integer, jsonb, boolean } from "drizzle-orm/pg-core";

// A workflow definition is a versioned, reusable template of steps.
// Step shape (jsonb):
// {
//   id: string,
//   name: string,
//   type: "task" | "approval" | "ai_action" | "branch" | "stop",
//   assignee?: string,
//   // For "branch": list of { when: <expr>, goto: <stepId> }; default goto = next step.
//   branches?: Array<{ when: string; goto: string }>,
//   // For "stop": list of predicates that must be true before run can advance.
//   blockedUntil?: Array<{ expr: string; reason: string }>,
//   // For "ai_action": prompt + outputKey written into context.
//   aiPrompt?: string,
//   outputKey?: string,
//   // For "task"/"approval": dueOffsetDays (used by dynamic due dates).
//   dueOffsetDays?: number,
// }
export const workflowsTable = pgTable("workflows", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  version: integer("version").notNull().default(1),
  status: text("status").notNull().default("active"), // active | archived
  trigger: text("trigger").notNull().default("manual"), // manual | on_capa_created | on_audit_completed | on_requirement_status_change
  definition: jsonb("definition").$type<{
    steps: Array<{
      id: string;
      name: string;
      type: "task" | "approval" | "ai_action" | "branch" | "stop";
      assignee?: string;
      branches?: Array<{ when: string; goto: string }>;
      blockedUntil?: Array<{ expr: string; reason: string }>;
      aiPrompt?: string;
      outputKey?: string;
      dueOffsetDays?: number;
    }>;
  }>().notNull().default({ steps: [] }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const workflowRunsTable = pgTable("workflow_runs", {
  id: text("id").primaryKey(),
  workflowId: text("workflow_id").notNull(),
  projectId: text("project_id"),
  status: text("status").notNull().default("running"), // running | blocked | completed | failed | cancelled
  currentStepId: text("current_step_id"),
  blockedReason: text("blocked_reason"),
  context: jsonb("context").$type<Record<string, unknown>>().notNull().default({}),
  startedBy: text("started_by").notNull().default("system"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const workflowStepRunsTable = pgTable("workflow_step_runs", {
  id: text("id").primaryKey(),
  runId: text("run_id").notNull(),
  stepId: text("step_id").notNull(),
  stepName: text("step_name").notNull(),
  stepType: text("step_type").notNull(),
  status: text("status").notNull().default("pending"), // pending | in_progress | done | skipped | blocked | failed
  assignee: text("assignee"),
  output: jsonb("output").$type<Record<string, unknown>>().notNull().default({}),
  blockedReason: text("blocked_reason"),
  dueAt: timestamp("due_at", { withTimezone: true }),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export type Workflow = typeof workflowsTable.$inferSelect;
export type WorkflowRun = typeof workflowRunsTable.$inferSelect;
export type WorkflowStepRun = typeof workflowStepRunsTable.$inferSelect;
