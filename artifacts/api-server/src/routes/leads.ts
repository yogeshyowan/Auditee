import { Router, type IRouter } from "express";
import { randomUUID } from "node:crypto";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db, leadCapturesTable, type LeadCaptureSource } from "@workspace/db";
import { CaptureLeadBody } from "@workspace/api-zod";
import type { Request } from "express";
import {
  requireAuth,
  requireWorkspace,
  canonicalRole,
  type AuthedRequest,
  type WorkspaceCtx,
} from "../lib/authContext";
import { postToGoogleSheet } from "../lib/googleSheetSync";
import { isLeadAdminEmail } from "../lib/leadAdmin";
import { clerkClient } from "@clerk/express";

const router: IRouter = Router();

router.post("/leads/capture", requireAuth, async (req, res) => {
  const body = CaptureLeadBody.parse(req.body);
  const ctx = (req as AuthedRequest).auth_ctx!;

  let name = "";
  let email = ctx.email ?? "";
  try {
    const user = await clerkClient.users.getUser(ctx.userId);
    const first = user.firstName ?? "";
    const last = user.lastName ?? "";
    name = [first, last].filter(Boolean).join(" ") || user.username || email || "Anonymous";
    if (!email) {
      email =
        user.primaryEmailAddress?.emailAddress ??
        user.emailAddresses[0]?.emailAddress ??
        "";
    }
  } catch (err) {
    req.log.warn({ err: err instanceof Error ? err.message : String(err) }, "clerk user lookup failed");
    name = email || "Anonymous";
  }

  if (!email) {
    res.status(400).json({ error: "no_email_on_clerk_user" });
    return;
  }
  // Normalize email so casing differences (Foo@x.com vs foo@x.com) don't
  // create duplicate rows that bypass the unique (email, source) constraint.
  email = email.trim().toLowerCase();

  const source = body.source as LeadCaptureSource;
  const id = randomUUID();
  const inserted = await db
    .insert(leadCapturesTable)
    .values({ id, clerkUserId: ctx.userId, name, email, source })
    .onConflictDoNothing({ target: [leadCapturesTable.email, leadCapturesTable.source] })
    .returning();

  const captured = inserted.length > 0;
  let targetRow: typeof leadCapturesTable.$inferSelect | undefined = inserted[0];

  // On dedupe, look up the pre-existing row so we can still attempt a
  // backfill sync if it was never forwarded to the sheet (e.g. an earlier
  // capture happened before the webhook env vars were configured).
  if (!captured) {
    const existing = await db
      .select()
      .from(leadCapturesTable)
      .where(and(eq(leadCapturesTable.email, email), eq(leadCapturesTable.source, source)))
      .limit(1);
    targetRow = existing[0];
  }

  // Fire-and-forget Google Sheet sync; never block the response on it.
  // Skip the sync entirely if the row already has a successful forward.
  if (targetRow && !targetRow.forwardedToFormAt) {
    const rowId = targetRow.id;
    const capturedAtIso = targetRow.createdAt.toISOString();
    void (async () => {
      const result = await postToGoogleSheet({
        name,
        email,
        id: ctx.userId,
        source,
        capturedAt: capturedAtIso,
      });
      if (!result.attempted) return;
      if (result.ok) {
        await db
          .update(leadCapturesTable)
          .set({ forwardedToFormAt: new Date(), forwardError: null })
          .where(eq(leadCapturesTable.id, rowId));
      } else {
        await db
          .update(leadCapturesTable)
          .set({
            forwardError: result.error ?? `status_${result.status ?? "unknown"}`,
          })
          .where(eq(leadCapturesTable.id, rowId));
      }
    })().catch((err) => {
      req.log.error(
        { err: err instanceof Error ? err.message : String(err) },
        "lead sheet sync failed",
      );
    });
  }

  if (captured) {
    res.status(201).json({ captured: true, deduped: false, id: targetRow!.id });
  } else {
    res.json({ captured: false, deduped: true });
  }
});

router.get("/leads/captures", requireAuth, async (req, res) => {
  const ctx = (req as AuthedRequest).auth_ctx!;
  // Privacy: a user can only read their own capture rows.
  const rows = await db
    .select()
    .from(leadCapturesTable)
    .where(and(eq(leadCapturesTable.clerkUserId, ctx.userId)));
  res.json(rows);
});

/**
 * Admin authorization for the captured-leads endpoints.
 *
 * The task literally asks for "gated to workspace owners", so we require the
 * caller to be the owner of their workspace. But `lead_captures` is a single
 * GLOBAL table (not workspace-scoped) and `requireWorkspace` auto-creates a
 * workspace where the caller is owner — so an owner-only check by itself is
 * not enough to prevent any signed-in user from reading every other user's
 * signup PII. We additionally require the caller's email to be on the
 * `LEAD_ADMIN_EMAILS` allowlist (safe-by-default: empty/unset = no admins).
 */
function isLeadAdmin(ctx: WorkspaceCtx): boolean {
  return (
    canonicalRole(ctx.role) === "owner" && isLeadAdminEmail(ctx.email)
  );
}

// Lightweight check the frontend can call to decide whether to render the
// admin "Captured Leads" sidebar item. Returns false unless the user is both
// a workspace owner AND on the LEAD_ADMIN_EMAILS allowlist.
router.get(
  "/leads/admin/me",
  requireAuth,
  requireWorkspace,
  async (req, res) => {
    const ctx = (req as Request & { ws_ctx: WorkspaceCtx }).ws_ctx;
    res.json({ isAdmin: isLeadAdmin(ctx) });
  },
);

// Admin: list every captured lead, newest first. Restricted to workspace
// owners on the LEAD_ADMIN_EMAILS allowlist — see isLeadAdmin() above for
// why both checks are required.
router.get(
  "/leads/captures/all",
  requireAuth,
  requireWorkspace,
  async (req, res) => {
    const ctx = (req as Request & { ws_ctx: WorkspaceCtx }).ws_ctx;
    if (!isLeadAdmin(ctx)) {
      res
        .status(403)
        .json({ error: "Workspace owner + internal admin access required." });
      return;
    }
    const rows = await db
      .select()
      .from(leadCapturesTable)
      .orderBy(desc(leadCapturesTable.createdAt));
    res.json({ leads: rows, count: rows.length });
  },
);

// Admin: re-runs the Google Sheet sync for every row that was never
// successfully forwarded. Useful when the sheet was misconfigured during
// the initial captures and we want to backfill without losing any rows.
router.post(
  "/leads/resync-unforwarded",
  requireAuth,
  requireWorkspace,
  async (req, res) => {
    const ctx = (req as Request & { ws_ctx: WorkspaceCtx }).ws_ctx;
    if (!isLeadAdmin(ctx)) {
      res
        .status(403)
        .json({ error: "Workspace owner + internal admin access required." });
      return;
    }
    const pending = await db
      .select()
      .from(leadCapturesTable)
      .where(isNull(leadCapturesTable.forwardedToFormAt))
      .orderBy(desc(leadCapturesTable.createdAt));

    let attempted = 0;
    let synced = 0;
    let failed = 0;
    let skipped = 0;

    // Process sequentially so we don't slam the Google Sheets API and so any
    // transient quota errors surface as a single failure rather than cascading.
    for (const row of pending) {
      const result = await postToGoogleSheet({
        name: row.name,
        email: row.email,
        id: row.clerkUserId ?? row.id,
        source: row.source,
        capturedAt: row.createdAt.toISOString(),
      });
      if (!result.attempted) {
        skipped++;
        continue;
      }
      attempted++;
      if (result.ok) {
        synced++;
        await db
          .update(leadCapturesTable)
          .set({ forwardedToFormAt: new Date(), forwardError: null })
          .where(eq(leadCapturesTable.id, row.id));
      } else {
        failed++;
        await db
          .update(leadCapturesTable)
          .set({
            forwardError: result.error ?? `status_${result.status ?? "unknown"}`,
          })
          .where(eq(leadCapturesTable.id, row.id));
      }
    }

    req.log.info(
      { pending: pending.length, attempted, synced, failed, skipped, actor: ctx.userId },
      "lead resync run complete",
    );

    res.json({
      pending: pending.length,
      attempted,
      synced,
      failed,
      skipped,
    });
  },
);

export default router;
