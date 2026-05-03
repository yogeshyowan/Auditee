import { db, workspaceLlmConfigsTable, type WorkspaceLlmConfig } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import { decryptField } from "./fieldEncryption";

/**
 * Resolves the BYO-LLM config for a workspace, if one is enabled. Returns
 * `null` for workspaces on the platform-managed default chain.
 *
 * Returned `apiKey` is decrypted at the boundary; never store or log it.
 */
export interface ResolvedLlmConfig {
  provider: string;
  apiKey: string | null;
  baseUrl: string | null;
  model: string | null;
}

export async function getWorkspaceLlmConfig(
  workspaceId: string | null | undefined,
): Promise<ResolvedLlmConfig | null> {
  if (!workspaceId) return null;
  const rows = await db
    .select()
    .from(workspaceLlmConfigsTable)
    .where(
      and(
        eq(workspaceLlmConfigsTable.workspaceId, workspaceId),
        eq(workspaceLlmConfigsTable.enabled, true),
      ),
    )
    .limit(1);
  const row: WorkspaceLlmConfig | undefined = rows[0];
  if (!row) return null;
  return {
    provider: row.provider,
    apiKey: decryptField(row.apiKeyEncrypted),
    baseUrl: row.baseUrl,
    model: row.model,
  };
}
