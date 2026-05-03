import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { randomUUID, createHash } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db, scimTokensTable, workspaceMembersTable, workspacesTable, type PlanTier } from "@workspace/db";
import { clerkClient } from "@clerk/express";
import { planAllows } from "../lib/permissions";
import { logger } from "../lib/logger";
import { auditLog, logSecurityEvent } from "../lib/auditLog";

/**
 * SCIM v2 (RFC 7644) endpoints for IdP-driven user provisioning. Bearer-token
 * authenticated using the `scim_tokens` table; each workspace can mint
 * multiple tokens with labels for rotation.
 *
 * Maps the SCIM User resource onto our `workspace_members` rows and (on
 * create) provisions a matching Clerk user. Group support is read-only —
 * we expose a single synthetic group per workspace.
 */
const router: IRouter = Router();

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

interface ScimCtx {
  workspaceId: string;
  tokenId: string;
}

async function authenticate(req: Request, res: Response): Promise<ScimCtx | null> {
  const auth = req.headers.authorization;
  if (!auth || !auth.toLowerCase().startsWith("bearer ")) {
    res.status(401).json({ schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], status: "401", detail: "Missing bearer token" });
    return null;
  }
  const token = auth.slice(7).trim();
  const rows = await db
    .select()
    .from(scimTokensTable)
    .where(eq(scimTokensTable.tokenHash, hashToken(token)))
    .limit(1);
  const row = rows[0];
  if (!row) {
    await logSecurityEvent(req, { action: "security.scim_token_invalid" });
    res.status(401).json({ schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], status: "401", detail: "Invalid token" });
    return null;
  }
  // Workspace must still be on Enterprise to use SCIM.
  const wsRows = await db.select().from(workspacesTable).where(eq(workspacesTable.id, row.workspaceId)).limit(1);
  const ws = wsRows[0];
  if (!ws || !planAllows(ws.plan as PlanTier, "scim")) {
    res.status(402).json({ schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], status: "402", detail: "SCIM is an Enterprise feature." });
    return null;
  }
  await db
    .update(scimTokensTable)
    .set({ lastUsedAt: new Date() })
    .where(eq(scimTokensTable.id, row.id));
  return { workspaceId: row.workspaceId, tokenId: row.id };
}

function memberToScimUser(m: {
  id: string;
  workspaceId: string;
  userId: string;
  email: string | null;
  role: string;
  addedAt: Date;
}) {
  const [given, ...rest] = (m.email ?? "").split("@")[0]?.split(".") ?? [""];
  return {
    schemas: ["urn:ietf:params:scim:schemas:core:2.0:User"],
    id: m.id,
    externalId: m.userId.startsWith("pending:") ? null : m.userId,
    userName: m.email ?? m.userId,
    name: { givenName: given ?? "", familyName: rest.join(" ") },
    emails: m.email ? [{ value: m.email, primary: true, type: "work" }] : [],
    active: !m.userId.startsWith("pending:"),
    meta: {
      resourceType: "User",
      created: m.addedAt.toISOString(),
      lastModified: m.addedAt.toISOString(),
      location: `/scim/v2/Users/${m.id}`,
    },
    "urn:ietf:params:scim:schemas:extension:auditee:2.0:User": { role: m.role },
  };
}

// ─── Discovery endpoints (RFC 7644 §4) ─────────────────────────────────────
router.get("/scim/v2/ServiceProviderConfig", (_req, res) => {
  res.json({
    schemas: ["urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig"],
    documentationUri: "https://auditee.site/docs/scim",
    patch: { supported: true },
    bulk: { supported: false, maxOperations: 0, maxPayloadSize: 0 },
    filter: { supported: true, maxResults: 200 },
    changePassword: { supported: false },
    sort: { supported: false },
    etag: { supported: false },
    authenticationSchemes: [
      { name: "OAuth Bearer Token", description: "Bearer token in Authorization header.", type: "oauthbearertoken" },
    ],
  });
});

router.get("/scim/v2/ResourceTypes", (_req, res) => {
  res.json({
    schemas: ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
    totalResults: 2,
    Resources: [
      { schemas: ["urn:ietf:params:scim:schemas:core:2.0:ResourceType"], id: "User", name: "User", endpoint: "/Users", schema: "urn:ietf:params:scim:schemas:core:2.0:User" },
      { schemas: ["urn:ietf:params:scim:schemas:core:2.0:ResourceType"], id: "Group", name: "Group", endpoint: "/Groups", schema: "urn:ietf:params:scim:schemas:core:2.0:Group" },
    ],
  });
});

router.get("/scim/v2/Schemas", (_req, res) => {
  res.json({
    schemas: ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
    totalResults: 2,
    Resources: [
      { id: "urn:ietf:params:scim:schemas:core:2.0:User", name: "User" },
      { id: "urn:ietf:params:scim:schemas:core:2.0:Group", name: "Group" },
    ],
  });
});

// ─── Users ────────────────────────────────────────────────────────────────
router.get("/scim/v2/Users", async (req, res) => {
  const ctx = await authenticate(req, res); if (!ctx) return;
  const filter = String(req.query.filter ?? "");
  const startIndex = Math.max(1, Number(req.query.startIndex ?? 1));
  const count = Math.min(200, Number(req.query.count ?? 100));

  let members = await db
    .select()
    .from(workspaceMembersTable)
    .where(eq(workspaceMembersTable.workspaceId, ctx.workspaceId));

  // Minimal SCIM filter support: userName eq "x@y" and externalId eq "..."
  const m = filter.match(/^(userName|externalId|emails\[type eq "work"\]\.value)\s+eq\s+"([^"]+)"$/i);
  if (m) {
    const field = m[1].toLowerCase();
    const value = m[2].toLowerCase();
    members = members.filter((row) => {
      if (field === "username" || field.startsWith("emails")) return (row.email ?? "").toLowerCase() === value;
      if (field === "externalid") return row.userId === m[2];
      return true;
    });
  }

  const slice = members.slice(startIndex - 1, startIndex - 1 + count);
  res.json({
    schemas: ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
    totalResults: members.length,
    startIndex,
    itemsPerPage: slice.length,
    Resources: slice.map(memberToScimUser),
  });
});

router.get("/scim/v2/Users/:id", async (req, res) => {
  const ctx = await authenticate(req, res); if (!ctx) return;
  const rows = await db
    .select()
    .from(workspaceMembersTable)
    .where(and(eq(workspaceMembersTable.workspaceId, ctx.workspaceId), eq(workspaceMembersTable.id, req.params.id)))
    .limit(1);
  if (!rows[0]) { res.status(404).json({ schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], status: "404", detail: "User not found" }); return; }
  res.json(memberToScimUser(rows[0]));
});

router.post("/scim/v2/Users", async (req, res, next: NextFunction) => {
  const ctx = await authenticate(req, res); if (!ctx) return;
  try {
    const body = req.body as { userName?: string; emails?: Array<{ value: string; primary?: boolean }>; active?: boolean };
    const email = (body.emails?.find((e) => e.primary)?.value ?? body.emails?.[0]?.value ?? body.userName ?? "").toLowerCase().trim();
    if (!email || !email.includes("@")) {
      res.status(400).json({ schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], status: "400", detail: "userName or primary email required" });
      return;
    }

    // Provision Clerk user (idempotent on email).
    const existing = await clerkClient.users.getUserList({ emailAddress: [email] });
    const userList = existing.data ?? [];
    let clerkUser = userList[0];
    if (!clerkUser) {
      clerkUser = await clerkClient.users.createUser({ emailAddress: [email], skipPasswordRequirement: true });
    }

    const id = randomUUID();
    const [member] = await db
      .insert(workspaceMembersTable)
      .values({
        id,
        workspaceId: ctx.workspaceId,
        userId: clerkUser.id,
        email,
        role: "editor",
        invitedBy: "scim",
      })
      .onConflictDoNothing({ target: [workspaceMembersTable.workspaceId, workspaceMembersTable.userId] })
      .returning();

    const finalRow = member ?? (await db.select().from(workspaceMembersTable)
      .where(and(eq(workspaceMembersTable.workspaceId, ctx.workspaceId), eq(workspaceMembersTable.userId, clerkUser.id)))
      .limit(1))[0];
    if (!finalRow) { res.status(500).json({ schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], status: "500", detail: "Insert failed" }); return; }

    await auditLog({
      workspaceId: ctx.workspaceId,
      actorUserId: "scim",
      actorEmail: null,
      action: "scim.user_created",
      resourceType: "member",
      resourceId: finalRow.id,
      metadata: { email, scimTokenId: ctx.tokenId },
    });
    res.status(201).json(memberToScimUser(finalRow));
  } catch (err) { next(err); }
});

router.patch("/scim/v2/Users/:id", async (req, res) => {
  const ctx = await authenticate(req, res); if (!ctx) return;
  const body = req.body as { Operations?: Array<{ op: string; path?: string; value: unknown }> };
  const ops = body.Operations ?? [];
  const update: { role?: string; email?: string } = {};
  for (const op of ops) {
    if (op.op?.toLowerCase() === "replace" && op.path === "active" && op.value === false) {
      // Treat deactivation as removal.
      await db
        .delete(workspaceMembersTable)
        .where(and(eq(workspaceMembersTable.workspaceId, ctx.workspaceId), eq(workspaceMembersTable.id, req.params.id)));
      await auditLog({
        workspaceId: ctx.workspaceId, actorUserId: "scim", actorEmail: null,
        action: "scim.user_deactivated", resourceType: "member", resourceId: req.params.id,
      });
      res.status(204).send();
      return;
    }
  }
  if (Object.keys(update).length > 0) {
    await db
      .update(workspaceMembersTable)
      .set(update)
      .where(and(eq(workspaceMembersTable.workspaceId, ctx.workspaceId), eq(workspaceMembersTable.id, req.params.id)));
  }
  const rows = await db
    .select()
    .from(workspaceMembersTable)
    .where(and(eq(workspaceMembersTable.workspaceId, ctx.workspaceId), eq(workspaceMembersTable.id, req.params.id)))
    .limit(1);
  if (!rows[0]) { res.status(404).json({ schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], status: "404", detail: "Not found" }); return; }
  res.json(memberToScimUser(rows[0]));
});

router.delete("/scim/v2/Users/:id", async (req, res) => {
  const ctx = await authenticate(req, res); if (!ctx) return;
  await db
    .delete(workspaceMembersTable)
    .where(and(eq(workspaceMembersTable.workspaceId, ctx.workspaceId), eq(workspaceMembersTable.id, req.params.id)));
  await auditLog({
    workspaceId: ctx.workspaceId, actorUserId: "scim", actorEmail: null,
    action: "scim.user_deleted", resourceType: "member", resourceId: req.params.id,
  });
  res.status(204).send();
});

// ─── Groups (read-only synthetic group per workspace) ────────────────────
router.get("/scim/v2/Groups", async (req, res) => {
  const ctx = await authenticate(req, res); if (!ctx) return;
  const members = await db
    .select()
    .from(workspaceMembersTable)
    .where(eq(workspaceMembersTable.workspaceId, ctx.workspaceId));
  res.json({
    schemas: ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
    totalResults: 1,
    startIndex: 1,
    itemsPerPage: 1,
    Resources: [
      {
        schemas: ["urn:ietf:params:scim:schemas:core:2.0:Group"],
        id: ctx.workspaceId,
        displayName: "Workspace Members",
        members: members.map((m) => ({ value: m.id, display: m.email ?? m.userId })),
        meta: { resourceType: "Group", location: `/scim/v2/Groups/${ctx.workspaceId}` },
      },
    ],
  });
});

router.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err }, "[scim] unhandled error");
  res.status(500).json({ schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], status: "500", detail: "Internal error" });
});

export default router;
