import { pgTable, text, integer, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const PLAN_TIERS = ["free", "professional", "enterprise"] as const;
export type PlanTier = (typeof PLAN_TIERS)[number];

export const PLAN_SEATS: Record<PlanTier, number> = {
  free: 1,
  professional: 4,
  enterprise: 20,
};

export const PLAN_PRICE_USD: Record<PlanTier, number> = {
  free: 0,
  professional: 499,
  enterprise: 2599,
};

export const workspacesTable = pgTable(
  "workspaces",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    plan: text("plan").notNull().default("free"),
    seatLimit: integer("seat_limit").notNull().default(1),
    ownerUserId: text("owner_user_id").notNull(),
    planActivatedAt: timestamp("plan_activated_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniqOwner: uniqueIndex("workspaces_owner_user_id_uniq").on(t.ownerUserId),
  }),
);

export const workspaceMembersTable = pgTable(
  "workspace_members",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspacesTable.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    email: text("email"),
    role: text("role").notNull().default("member"),
    invitedBy: text("invited_by"),
    addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniqMember: uniqueIndex("workspace_members_workspace_user_uniq").on(t.workspaceId, t.userId),
  }),
);

export type Workspace = typeof workspacesTable.$inferSelect;
export type WorkspaceMember = typeof workspaceMembersTable.$inferSelect;
