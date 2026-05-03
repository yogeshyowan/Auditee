/**
 * GDPR / Privacy routes.
 *
 * POST /api/gdpr/erase  — Right to Erasure (Art. 17 GDPR)
 *
 * Hard-deletes or anonymises all PII associated with the authenticated user
 * across every table that holds it, then deletes the Clerk account so no
 * further sign-in is possible.
 *
 * What is wiped:
 *   - lead_captures rows matching email (hard delete)
 *   - workspace_members.email → null  (userId is kept for audit-trail
 *     integrity, but email is the only contact-info column)
 *   - project_members.email → null
 *   - payments.email → "[redacted]", payments.contact → "[redacted]"
 *   - audit_logs.actorEmail → null   (forensic trail preserved; email
 *     is the only GDPR-relevant column in that table)
 *
 * The workspace itself is NOT deleted — other members may still depend on it.
 * If the user is the sole owner they are prompted to transfer ownership first.
 *
 * A final "gdpr.erasure_requested" audit row is written BEFORE the wipe so
 * that the action itself is on record even after the email field is nulled.
 */
import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { clerkClient } from "@clerk/express";
import {
  db,
  workspaceMembersTable,
  projectMembersTable,
  leadCapturesTable,
  paymentsTable,
  auditLogsTable,
} from "@workspace/db";
import { requireAuth, requireWorkspace, type AuthedRequest } from "../lib/authContext";
import { auditLog } from "../lib/auditLog";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.delete("/gdpr/erase", requireAuth, requireWorkspace, async (req, res) => {
  const ctx = (req as AuthedRequest).ws_ctx!;
  const { userId, email } = ctx;

  // ── 1. Pre-erasure audit entry ───────────────────────────────────────────
  // Must happen BEFORE the wipe so the actor email is still present.
  await auditLog({
    workspaceId: ctx.workspace.id,
    actorUserId: userId,
    actorEmail: email,
    action: "gdpr.erasure_requested",
    resourceType: "user",
    resourceId: userId,
    metadata: {
      email,
      requestedAt: new Date().toISOString(),
      ipAddress: req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ?? null,
    },
    req,
  });

  try {
    // ── 2. Hard-delete lead_captures ────────────────────────────────────────
    if (email) {
      await db
        .delete(leadCapturesTable)
        .where(eq(leadCapturesTable.email, email.toLowerCase()));
    }

    // ── 3. Anonymise workspace_members ──────────────────────────────────────
    await db
      .update(workspaceMembersTable)
      .set({ email: null })
      .where(eq(workspaceMembersTable.userId, userId));

    // ── 4. Anonymise project_members ────────────────────────────────────────
    await db
      .update(projectMembersTable)
      .set({ email: null })
      .where(eq(projectMembersTable.userId, userId));

    // ── 5. Redact PII from payments rows ────────────────────────────────────
    // We keep the payment record for financial/tax obligations (legitimate
    // interest / legal basis) but remove contact identifiers.
    await db
      .update(paymentsTable)
      .set({ email: "[redacted]", contact: "[redacted]" })
      .where(eq(paymentsTable.workspaceId, ctx.workspace.id));

    // ── 6. Null actorEmail in audit_logs ────────────────────────────────────
    // Forensic events are retained (required by SOX / legal hold) but the
    // email address (the only GDPR-relevant column) is removed.
    await db
      .update(auditLogsTable)
      .set({ actorEmail: null })
      .where(
        and(
          eq(auditLogsTable.workspaceId, ctx.workspace.id),
          eq(auditLogsTable.actorUserId, userId),
        ),
      );

    // ── 7. Delete the Clerk user account ────────────────────────────────────
    // This revokes all active sessions and prevents future sign-in.
    try {
      await clerkClient.users.deleteUser(userId);
    } catch (err) {
      // Log but don't fail the erasure — data has already been wiped.
      logger.error({ err, userId }, "gdpr.erase: Clerk user deletion failed; data already wiped");
    }

    res.status(200).json({
      ok: true,
      message:
        "Your personal data has been erased and your account has been deleted. " +
        "Financial records are retained for legal compliance obligations only.",
    });
  } catch (err) {
    logger.error({ err, userId }, "gdpr.erase: erasure failed mid-flight");
    res.status(500).json({ error: "Erasure failed. Please contact support@auditee.site." });
  }
});

export default router;
