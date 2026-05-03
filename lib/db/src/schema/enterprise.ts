import { pgTable, text, timestamp, boolean, index, uniqueIndex } from "drizzle-orm/pg-core";
import { workspacesTable } from "./workspaces";

/**
 * Per-workspace BYO-LLM configuration. Customers on the Enterprise plan can
 * route Auditee's AI calls through their own provider (Azure OpenAI, AWS
 * Bedrock, on-prem inference) so prompts/completions never leave their
 * boundary. The `apiKeyEncrypted` column stores the secret using
 * `lib/fieldEncryption` (AES-256-GCM); never read it raw.
 */
export const LLM_PROVIDERS = [
  "openai",
  "anthropic",
  "azure_openai",
  "bedrock",
  "openrouter",
  "custom",
] as const;
export type LlmProvider = (typeof LLM_PROVIDERS)[number];

export const workspaceLlmConfigsTable = pgTable(
  "workspace_llm_configs",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspacesTable.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    apiKeyEncrypted: text("api_key_encrypted"),
    baseUrl: text("base_url"),
    model: text("model"),
    enabled: boolean("enabled").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    byWorkspace: index("workspace_llm_configs_workspace_idx").on(t.workspaceId),
  }),
);

export type WorkspaceLlmConfig = typeof workspaceLlmConfigsTable.$inferSelect;

/**
 * SCIM v2 bearer tokens for IdP-driven user provisioning. Tokens are stored
 * as SHA-256 hashes; the plaintext is shown to the admin only at creation.
 */
export const scimTokensTable = pgTable(
  "scim_tokens",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspacesTable.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    label: text("label"),
    createdBy: text("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  },
  (t) => ({
    byWorkspace: index("scim_tokens_workspace_idx").on(t.workspaceId),
    uniqHash: uniqueIndex("scim_tokens_hash_uniq").on(t.tokenHash),
  }),
);

export type ScimToken = typeof scimTokensTable.$inferSelect;

/**
 * Per-tick uptime samples for the SLA dashboard. Populated by the in-process
 * scheduler every 60s. We compute rolling 30/90-day uptime % from this table
 * and surface it in the enterprise SLA tab. `kind` is currently always
 * "platform" but is reserved so we can later split api/db/ai checks out.
 */
export const uptimeSamplesTable = pgTable(
  "uptime_samples",
  {
    id: text("id").primaryKey(),
    kind: text("kind").notNull().default("platform"),
    sampledAt: timestamp("sampled_at", { withTimezone: true }).notNull().defaultNow(),
    healthy: boolean("healthy").notNull(),
    durationMs: text("duration_ms"),
    note: text("note"),
  },
  (t) => ({
    bySampledAt: index("uptime_samples_sampled_at_idx").on(t.sampledAt),
  }),
);
export type UptimeSample = typeof uptimeSamplesTable.$inferSelect;

/**
 * Snapshot metadata for the enterprise backup/DR dashboard. Auditee runs
 * point-in-time pg_dump snapshots of every workspace's data on a daily
 * schedule (and on-demand via the API); each snapshot is recorded here
 * with size + storage location so customers can prove their RPO.
 */
export const backupSnapshotsTable = pgTable(
  "backup_snapshots",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspacesTable.id, { onDelete: "cascade" }),
    kind: text("kind").notNull().default("scheduled"), // scheduled | manual | dsar_export
    sizeBytes: text("size_bytes"),
    location: text("location"),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    byWorkspace: index("backup_snapshots_workspace_idx").on(t.workspaceId),
  }),
);
export type BackupSnapshot = typeof backupSnapshotsTable.$inferSelect;
