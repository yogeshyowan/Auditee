import { Router, type IRouter } from "express";
import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db, leadCapturesTable, type LeadCaptureSource } from "@workspace/db";
import { CaptureLeadBody } from "@workspace/api-zod";
import { requireAuth, type AuthedRequest } from "../lib/authContext";
import { postToGoogleSheet } from "../lib/googleSheetSync";
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

export default router;
