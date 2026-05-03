import { Router, type IRouter, type Request } from "express";
import { randomUUID, randomBytes, createHash } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import {
  db,
  workspacesTable,
  workspaceLlmConfigsTable,
  scimTokensTable,
  LLM_PROVIDERS,
  type PlanTier,
} from "@workspace/db";
import {
  requireAuth,
  requireWorkspace,
  canonicalRole,
  type WorkspaceCtx,
} from "../lib/authContext";
import { permissionsFor, planAllows, isAtLeast } from "../lib/permissions";
import { auditLog } from "../lib/auditLog";
import { encryptField } from "../lib/fieldEncryption";
import { dispatchToSiem, type SiemEvent } from "../lib/siemDispatch";

/**
 * Consolidated enterprise-config routes:
 *   - SAML IdP metadata upload
 *   - SCIM bearer token CRUD
 *   - SIEM webhook config + test
 *   - BYO-LLM provider config
 *   - MFA enforcement policy
 *   - Data residency
 *   - Customer-managed encryption key id
 *
 * All routes require admin role + Enterprise plan, and write to the audit log.
 */
const router: IRouter = Router();

function ctxOf(req: Request): WorkspaceCtx {
  return (req as Request & { ws_ctx: WorkspaceCtx }).ws_ctx;
}

function ensureAdminEnterprise(ctx: WorkspaceCtx, feature: Parameters<typeof planAllows>[1]):
  | { ok: true }
  | { ok: false; status: number; body: { error: string; requiresUpgrade?: boolean } } {
  if (!isAtLeast(canonicalRole(ctx.role), "admin")) {
    return { ok: false, status: 403, body: { error: "Admin or owner role required." } };
  }
  if (!planAllows(ctx.workspace.plan as PlanTier, feature)) {
    return { ok: false, status: 402, body: { error: "This is an Enterprise feature.", requiresUpgrade: true } };
  }
  return { ok: true };
}

// ─── SAML IdP config ──────────────────────────────────────────────────────
const SamlBody = z.object({
  samlIdpEntityId: z.string().trim().min(1).max(2048).nullable().optional(),
  samlIdpSsoUrl: z.string().trim().url().max(2048).nullable().optional(),
  samlIdpX509Cert: z.string().trim().max(64_000).nullable().optional(),
  samlIdpMetadataXml: z.string().trim().max(256_000).nullable().optional(),
});

router.post("/workspace/saml-config", requireAuth, requireWorkspace, async (req, res) => {
  const ctx = ctxOf(req);
  const gate = ensureAdminEnterprise(ctx, "saml");
  if (!gate.ok) { res.status(gate.status).json(gate.body); return; }
  const body = SamlBody.parse(req.body);
  const [updated] = await db
    .update(workspacesTable)
    .set({
      samlIdpEntityId: body.samlIdpEntityId ?? null,
      samlIdpSsoUrl: body.samlIdpSsoUrl ?? null,
      samlIdpX509Cert: body.samlIdpX509Cert ?? null,
      samlIdpMetadataXml: body.samlIdpMetadataXml ?? null,
    })
    .where(eq(workspacesTable.id, ctx.workspace.id))
    .returning();
  await auditLog({
    workspaceId: ctx.workspace.id, actorUserId: ctx.userId, actorEmail: ctx.email,
    action: "saml.configured", resourceType: "workspace", resourceId: ctx.workspace.id,
    metadata: { hasMetadata: Boolean(body.samlIdpMetadataXml), hasCert: Boolean(body.samlIdpX509Cert) },
    req,
  });
  res.json({
    samlIdpEntityId: updated.samlIdpEntityId,
    samlIdpSsoUrl: updated.samlIdpSsoUrl,
    samlIdpMetadataConfigured: Boolean(updated.samlIdpMetadataXml || updated.samlIdpX509Cert),
  });
});

// ─── SCIM tokens ──────────────────────────────────────────────────────────
router.get("/workspace/scim-tokens", requireAuth, requireWorkspace, async (req, res) => {
  const ctx = ctxOf(req);
  const gate = ensureAdminEnterprise(ctx, "scim");
  if (!gate.ok) { res.status(gate.status).json(gate.body); return; }
  const rows = await db
    .select({ id: scimTokensTable.id, label: scimTokensTable.label, createdAt: scimTokensTable.createdAt, lastUsedAt: scimTokensTable.lastUsedAt })
    .from(scimTokensTable)
    .where(eq(scimTokensTable.workspaceId, ctx.workspace.id))
    .orderBy(desc(scimTokensTable.createdAt));
  res.json({ tokens: rows });
});

router.post("/workspace/scim-tokens", requireAuth, requireWorkspace, async (req, res) => {
  const ctx = ctxOf(req);
  const gate = ensureAdminEnterprise(ctx, "scim");
  if (!gate.ok) { res.status(gate.status).json(gate.body); return; }
  const body = z.object({ label: z.string().trim().min(1).max(120) }).parse(req.body);
  const token = `scim_${randomBytes(32).toString("base64url")}`;
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const id = randomUUID();
  await db.insert(scimTokensTable).values({
    id, workspaceId: ctx.workspace.id, tokenHash, label: body.label, createdBy: ctx.userId,
  });
  await auditLog({
    workspaceId: ctx.workspace.id, actorUserId: ctx.userId, actorEmail: ctx.email,
    action: "scim.token_created", resourceType: "scim_token", resourceId: id,
    metadata: { label: body.label }, req,
  });
  res.status(201).json({ id, label: body.label, token }); // token shown once, never again
});

router.delete("/workspace/scim-tokens/:id", requireAuth, requireWorkspace, async (req, res) => {
  const ctx = ctxOf(req);
  const gate = ensureAdminEnterprise(ctx, "scim");
  if (!gate.ok) { res.status(gate.status).json(gate.body); return; }
  const tokenId = String(req.params.id);
  const result = await db
    .delete(scimTokensTable)
    .where(and(eq(scimTokensTable.workspaceId, ctx.workspace.id), eq(scimTokensTable.id, tokenId)))
    .returning({ id: scimTokensTable.id });
  if (result.length === 0) { res.status(404).json({ error: "Token not found" }); return; }
  await auditLog({
    workspaceId: ctx.workspace.id, actorUserId: ctx.userId, actorEmail: ctx.email,
    action: "scim.token_revoked", resourceType: "scim_token", resourceId: tokenId, req,
  });
  res.status(204).send();
});

// ─── SIEM webhook config + test ───────────────────────────────────────────
const SIEM_FORMATS = ["generic", "splunk_hec", "datadog", "elastic"] as const;
const SiemBody = z.object({
  url: z.string().trim().url().max(2048).nullable(),
  secret: z.string().trim().min(8).max(512).nullable().optional(),
  format: z.enum(SIEM_FORMATS).optional(),
});

router.post("/workspace/siem", requireAuth, requireWorkspace, async (req, res) => {
  const ctx = ctxOf(req);
  const gate = ensureAdminEnterprise(ctx, "siem");
  if (!gate.ok) { res.status(gate.status).json(gate.body); return; }
  const body = SiemBody.parse(req.body);
  await db
    .update(workspacesTable)
    .set({
      siemWebhookUrl: body.url,
      siemWebhookSecret: body.secret ?? null,
      ...(body.format ? { siemFormat: body.format } : {}),
    })
    .where(eq(workspacesTable.id, ctx.workspace.id));
  await auditLog({
    workspaceId: ctx.workspace.id, actorUserId: ctx.userId, actorEmail: ctx.email,
    action: "siem.configured", resourceType: "workspace", resourceId: ctx.workspace.id,
    metadata: { hasUrl: Boolean(body.url), hasSecret: Boolean(body.secret), format: body.format ?? null }, req,
  });
  res.json({ ok: true });
});

router.post("/workspace/siem/test", requireAuth, requireWorkspace, async (req, res) => {
  const ctx = ctxOf(req);
  const gate = ensureAdminEnterprise(ctx, "siem");
  if (!gate.ok) { res.status(gate.status).json(gate.body); return; }
  if (!ctx.workspace.siemWebhookUrl) {
    res.status(412).json({ error: "Configure a SIEM webhook URL first." });
    return;
  }
  const event: SiemEvent = {
    id: randomUUID(),
    workspaceId: ctx.workspace.id,
    actorUserId: ctx.userId,
    actorEmail: ctx.email,
    action: "siem.test_event",
    resourceType: "workspace",
    resourceId: ctx.workspace.id,
    metadata: { test: true },
    ip: null,
    userAgent: null,
    integrityHash: createHash("sha256").update(randomUUID()).digest("hex"),
    createdAt: new Date().toISOString(),
  };
  await dispatchToSiem(
    ctx.workspace.siemWebhookUrl,
    ctx.workspace.siemWebhookSecret,
    event,
    (ctx.workspace.siemFormat ?? "generic") as "generic" | "splunk_hec" | "datadog" | "elastic",
  );
  res.json({ ok: true, dispatched: true });
});

// ─── BYO-LLM ──────────────────────────────────────────────────────────────
router.get("/workspace/llm-configs", requireAuth, requireWorkspace, async (req, res) => {
  const ctx = ctxOf(req);
  const gate = ensureAdminEnterprise(ctx, "byo_llm");
  if (!gate.ok) { res.status(gate.status).json(gate.body); return; }
  const rows = await db
    .select({
      id: workspaceLlmConfigsTable.id,
      provider: workspaceLlmConfigsTable.provider,
      baseUrl: workspaceLlmConfigsTable.baseUrl,
      model: workspaceLlmConfigsTable.model,
      enabled: workspaceLlmConfigsTable.enabled,
      hasKey: workspaceLlmConfigsTable.apiKeyEncrypted,
      createdAt: workspaceLlmConfigsTable.createdAt,
    })
    .from(workspaceLlmConfigsTable)
    .where(eq(workspaceLlmConfigsTable.workspaceId, ctx.workspace.id))
    .orderBy(desc(workspaceLlmConfigsTable.createdAt));
  res.json({
    configs: rows.map((r) => ({
      id: r.id, provider: r.provider, baseUrl: r.baseUrl, model: r.model,
      enabled: r.enabled, hasKey: Boolean(r.hasKey), createdAt: r.createdAt,
    })),
  });
});

const LlmBody = z.object({
  provider: z.enum(LLM_PROVIDERS),
  apiKey: z.string().trim().max(2048).optional(),
  baseUrl: z.string().trim().url().max(2048).optional().nullable(),
  model: z.string().trim().max(120).optional().nullable(),
  enabled: z.boolean().optional(),
});

router.post("/workspace/llm-configs", requireAuth, requireWorkspace, async (req, res) => {
  const ctx = ctxOf(req);
  const gate = ensureAdminEnterprise(ctx, "byo_llm");
  if (!gate.ok) { res.status(gate.status).json(gate.body); return; }
  const body = LlmBody.parse(req.body);
  const id = randomUUID();
  // Disable any other enabled config for this workspace if this one is enabled.
  if (body.enabled !== false) {
    await db
      .update(workspaceLlmConfigsTable)
      .set({ enabled: false })
      .where(eq(workspaceLlmConfigsTable.workspaceId, ctx.workspace.id));
  }
  await db.insert(workspaceLlmConfigsTable).values({
    id,
    workspaceId: ctx.workspace.id,
    provider: body.provider,
    apiKeyEncrypted: body.apiKey ? encryptField(body.apiKey) : null,
    baseUrl: body.baseUrl ?? null,
    model: body.model ?? null,
    enabled: body.enabled ?? true,
  });
  await auditLog({
    workspaceId: ctx.workspace.id, actorUserId: ctx.userId, actorEmail: ctx.email,
    action: "llm_config.created", resourceType: "llm_config", resourceId: id,
    metadata: { provider: body.provider, model: body.model }, req,
  });
  res.status(201).json({ id });
});

router.delete("/workspace/llm-configs/:id", requireAuth, requireWorkspace, async (req, res) => {
  const ctx = ctxOf(req);
  const gate = ensureAdminEnterprise(ctx, "byo_llm");
  if (!gate.ok) { res.status(gate.status).json(gate.body); return; }
  const configId = String(req.params.id);
  await db
    .delete(workspaceLlmConfigsTable)
    .where(and(eq(workspaceLlmConfigsTable.workspaceId, ctx.workspace.id), eq(workspaceLlmConfigsTable.id, configId)));
  await auditLog({
    workspaceId: ctx.workspace.id, actorUserId: ctx.userId, actorEmail: ctx.email,
    action: "llm_config.deleted", resourceType: "llm_config", resourceId: configId, req,
  });
  res.status(204).send();
});

// ─── MFA enforcement policy ───────────────────────────────────────────────
router.post("/workspace/mfa", requireAuth, requireWorkspace, async (req, res) => {
  const ctx = ctxOf(req);
  // MFA policy is owner-only (more restrictive than admin).
  if (canonicalRole(ctx.role) !== "owner") {
    res.status(403).json({ error: "Only the workspace owner can change the MFA policy." });
    return;
  }
  if (!planAllows(ctx.workspace.plan as PlanTier, "mfa_policy")) {
    res.status(402).json({ error: "MFA enforcement policy is an Enterprise feature.", requiresUpgrade: true });
    return;
  }
  const body = z.object({ mfaRequired: z.boolean() }).parse(req.body);
  await db
    .update(workspacesTable)
    .set({ mfaRequired: body.mfaRequired })
    .where(eq(workspacesTable.id, ctx.workspace.id));
  await auditLog({
    workspaceId: ctx.workspace.id, actorUserId: ctx.userId, actorEmail: ctx.email,
    action: "mfa_policy.changed", resourceType: "workspace", resourceId: ctx.workspace.id,
    metadata: { mfaRequired: body.mfaRequired }, req,
  });
  res.json({ mfaRequired: body.mfaRequired });
});

// ─── Data residency ──────────────────────────────────────────────────────
router.post("/workspace/region", requireAuth, requireWorkspace, async (req, res) => {
  const ctx = ctxOf(req);
  const gate = ensureAdminEnterprise(ctx, "data_residency");
  if (!gate.ok) { res.status(gate.status).json(gate.body); return; }
  const body = z.object({ dataRegion: z.enum(["us", "eu", "in", "ap"]) }).parse(req.body);
  await db
    .update(workspacesTable)
    .set({ dataRegion: body.dataRegion })
    .where(eq(workspacesTable.id, ctx.workspace.id));
  await auditLog({
    workspaceId: ctx.workspace.id, actorUserId: ctx.userId, actorEmail: ctx.email,
    action: "data_region.changed", resourceType: "workspace", resourceId: ctx.workspace.id,
    metadata: { from: ctx.workspace.dataRegion, to: body.dataRegion }, req,
  });
  res.json({ dataRegion: body.dataRegion });
});

// ─── OIDC SSO config ─────────────────────────────────────────────────────
const OidcBody = z.object({
  oidcIssuer: z.string().trim().url().max(2048).nullable(),
  oidcClientId: z.string().trim().min(1).max(512).nullable(),
  oidcClientSecret: z.string().trim().max(2048).nullable().optional(),
});
router.get("/workspace/oidc-config", requireAuth, requireWorkspace, async (req, res) => {
  const ctx = ctxOf(req);
  const gate = ensureAdminEnterprise(ctx, "oidc");
  if (!gate.ok) { res.status(gate.status).json(gate.body); return; }
  res.json({
    oidcIssuer: ctx.workspace.oidcIssuer,
    oidcClientId: ctx.workspace.oidcClientId,
    hasClientSecret: Boolean(ctx.workspace.oidcClientSecretEncrypted),
  });
});
router.post("/workspace/oidc-config", requireAuth, requireWorkspace, async (req, res) => {
  const ctx = ctxOf(req);
  const gate = ensureAdminEnterprise(ctx, "oidc");
  if (!gate.ok) { res.status(gate.status).json(gate.body); return; }
  const body = OidcBody.parse(req.body);
  const set: Record<string, unknown> = {
    oidcIssuer: body.oidcIssuer,
    oidcClientId: body.oidcClientId,
  };
  // Only overwrite the encrypted secret when the admin explicitly sends a
  // non-empty new value. Sending `null` clears it; omitting/empty leaves it.
  if (body.oidcClientSecret === null) set.oidcClientSecretEncrypted = null;
  else if (body.oidcClientSecret && body.oidcClientSecret.length > 0) {
    set.oidcClientSecretEncrypted = encryptField(body.oidcClientSecret);
  }
  await db.update(workspacesTable).set(set).where(eq(workspacesTable.id, ctx.workspace.id));
  await auditLog({
    workspaceId: ctx.workspace.id, actorUserId: ctx.userId, actorEmail: ctx.email,
    action: "oidc.configured", resourceType: "workspace", resourceId: ctx.workspace.id,
    metadata: { hasIssuer: Boolean(body.oidcIssuer), hasClientId: Boolean(body.oidcClientId) }, req,
  });
  res.json({ ok: true });
});

// ─── Customer-managed encryption key id ──────────────────────────────────
router.post("/workspace/encryption-key", requireAuth, requireWorkspace, async (req, res) => {
  const ctx = ctxOf(req);
  const gate = ensureAdminEnterprise(ctx, "cmk");
  if (!gate.ok) { res.status(gate.status).json(gate.body); return; }
  const body = z.object({
    cmkKid: z.string().trim().min(1).max(512).nullable(),
  }).parse(req.body);
  await db
    .update(workspacesTable)
    .set({ cmkKid: body.cmkKid })
    .where(eq(workspacesTable.id, ctx.workspace.id));
  await auditLog({
    workspaceId: ctx.workspace.id, actorUserId: ctx.userId, actorEmail: ctx.email,
    action: "cmk.changed", resourceType: "workspace", resourceId: ctx.workspace.id,
    metadata: { hasKey: Boolean(body.cmkKid) }, req,
  });
  res.json({ cmkKid: body.cmkKid });
});

export default router;
