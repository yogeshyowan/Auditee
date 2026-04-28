import { pgTable, text, integer, timestamp, uniqueIndex, boolean } from "drizzle-orm/pg-core";

export const WORKSPACE_ROLES = ["owner", "admin", "editor", "viewer"] as const;
export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number];

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

// Per-workspace lifetime AI generation credits. -1 = unlimited.
// Anonymous (signed-out) browsers get the same Free allowance (6) tracked in
// localStorage on the client and verified server-side via a request header.
export const ANON_CREDIT_LIMIT = 6;
export const PLAN_CREDITS: Record<PlanTier, number> = {
  free: 6,
  professional: -1,
  enterprise: -1,
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
    creditsUsed: integer("credits_used").notNull().default(0),
    ssoEnabled: boolean("sso_enabled").notNull().default(false),
    ssoDomain: text("sso_domain"),
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
