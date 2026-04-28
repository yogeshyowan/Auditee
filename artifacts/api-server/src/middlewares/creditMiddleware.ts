import type { Request, Response, NextFunction } from "express";
import { randomUUID, createHmac, timingSafeEqual } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { getAuth, clerkClient } from "@clerk/express";
import {
  db,
  workspacesTable,
  workspaceMembersTable,
  anonymousTrialsTable,
  PLAN_CREDITS,
  PLAN_SEATS,
  ANON_CREDIT_LIMIT,
  type PlanTier,
} from "@workspace/db";

const REMAINING_HEADER = "x-credits-remaining";
const LIMIT_HEADER = "x-credits-limit";
const TRIAL_COOKIE = "auditee_trial";
const COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 365; // 1 year

const COOKIE_SECRET =
  process.env.SESSION_SECRET ?? process.env.CLERK_SECRET_KEY ?? "auditee-anon-fallback";

function signTrial(id: string): string {
  const sig = createHmac("sha256", COOKIE_SECRET).update(id).digest("hex").slice(0, 32);
  return `${id}.${sig}`;
}

function verifyTrial(token: string | undefined): string | null {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const id = token.slice(0, dot);
  const sigHex = token.slice(dot + 1);
  const expectedHex = createHmac("sha256", COOKIE_SECRET).update(id).digest("hex").slice(0, 32);
  if (sigHex.length !== expectedHex.length) return null;
  try {
    if (timingSafeEqual(Buffer.from(sigHex, "hex"), Buffer.from(expectedHex, "hex"))) return id;
  } catch {
    return null;
  }
  return null;
}

function readCookie(req: Request, name: string): string | undefined {
  const raw = req.headers.cookie;
  if (!raw) return undefined;
  for (const part of raw.split(/;\s*/)) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    if (part.slice(0, eq) === name) return decodeURIComponent(part.slice(eq + 1));
  }
  return undefined;
}

function setTrialCookie(res: Response, token: string): void {
  const isProd = process.env.NODE_ENV === "production";
  const parts = [
    `${TRIAL_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    `Max-Age=${COOKIE_MAX_AGE_SEC}`,
    "HttpOnly",
    "SameSite=Lax",
  ];
  if (isProd) parts.push("Secure");
  // Append cookie without overwriting any pre-existing Set-Cookie.
  const existing = res.getHeader("Set-Cookie");
  const cookieStr = parts.join("; ");
  if (Array.isArray(existing)) {
    res.setHeader("Set-Cookie", [...existing, cookieStr]);
  } else if (typeof existing === "string") {
    res.setHeader("Set-Cookie", [existing, cookieStr]);
  } else {
    res.setHeader("Set-Cookie", cookieStr);
  }
}

async function ensureWorkspace(userId: string, email: string | null) {
  const lookup = async () => {
    const rows = await db
      .select({ workspace: workspacesTable })
      .from(workspaceMembersTable)
      .innerJoin(workspacesTable, eq(workspaceMembersTable.workspaceId, workspacesTable.id))
      .where(eq(workspaceMembersTable.userId, userId))
      .limit(1);
    return rows[0]?.workspace ?? null;
  };

  const existing = await lookup();
  if (existing) return existing;

  const id = randomUUID();
  const inserted = await db
    .insert(workspacesTable)
    .values({
      id,
      name: email ? `${email.split("@")[0]}'s workspace` : "My workspace",
      plan: "free",
      seatLimit: PLAN_SEATS.free,
      ownerUserId: userId,
    })
    .onConflictDoNothing({ target: workspacesTable.ownerUserId })
    .returning();

  if (inserted.length === 0) {
    const after = await lookup();
    if (after) return after;
  } else {
    await db
      .insert(workspaceMembersTable)
      .values({
        id: randomUUID(),
        workspaceId: id,
        userId,
        email,
        role: "owner",
        invitedBy: userId,
      })
      .onConflictDoNothing({
        target: [workspaceMembersTable.workspaceId, workspaceMembersTable.userId],
      });
    return inserted[0];
  }
  throw new Error("ensureWorkspace_failed");
}

/**
 * Refund the credit consumed for this request if the response ends with a
 * failure (>=400). We register an `on('finish')` listener and decrement
 * atomically — we only ever roll back what we just incremented, so there's
 * no race against other concurrent requests' increments.
 */
function registerRefundOnFailure(
  res: Response,
  scope: { kind: "workspace"; id: string } | { kind: "trial"; id: string },
) {
  let alreadyHandled = false;
  res.on("finish", () => {
    if (alreadyHandled) return;
    alreadyHandled = true;
    if (res.statusCode < 400) return;
    if (scope.kind === "workspace") {
      void db
        .update(workspacesTable)
        .set({ creditsUsed: sql`GREATEST(${workspacesTable.creditsUsed} - 1, 0)` })
        .where(eq(workspacesTable.id, scope.id))
        .catch(() => {
          /* best-effort refund */
        });
    } else {
      void db
        .update(anonymousTrialsTable)
        .set({ creditsUsed: sql`GREATEST(${anonymousTrialsTable.creditsUsed} - 1, 0)` })
        .where(eq(anonymousTrialsTable.id, scope.id))
        .catch(() => {
          /* best-effort refund */
        });
    }
  });
}

/**
 * Gates AI generation endpoints by an idea-credit budget.
 *
 * - Anonymous users: server-side per-trial counter. The trial id is stored in
 *   an HttpOnly signed cookie so the count cannot be forged from the client.
 *   When exhausted: 402 with `{ requiresLogin: true, … }`.
 * - Signed-in users: each call atomically increments `workspaces.creditsUsed`
 *   under the plan's limit. Free=6, Professional/Enterprise=unlimited (-1).
 *   When exhausted: 402 with `{ requiresUpgrade: true, … }`.
 *
 * Reserve+refund: if the wrapped route fails (>=400), the consumed credit is
 * automatically refunded so botched calls don't burn the user's allowance.
 */
export function consumeCredit() {
  return async function (req: Request, res: Response, next: NextFunction) {
    const { userId } = getAuth(req);

    // ───────────── Anonymous ─────────────
    if (!userId) {
      // Resolve or mint trial id.
      let trialId = verifyTrial(readCookie(req, TRIAL_COOKIE));
      if (!trialId) {
        trialId = randomUUID();
        await db
          .insert(anonymousTrialsTable)
          .values({ id: trialId, creditsUsed: 0 })
          .onConflictDoNothing();
        setTrialCookie(res, signTrial(trialId));
      } else {
        // First-time use of a verified-but-unknown id (e.g. DB wiped) — insert.
        await db
          .insert(anonymousTrialsTable)
          .values({ id: trialId, creditsUsed: 0 })
          .onConflictDoNothing();
      }

      const updated = await db
        .update(anonymousTrialsTable)
        .set({ creditsUsed: sql`${anonymousTrialsTable.creditsUsed} + 1` })
        .where(
          sql`${anonymousTrialsTable.id} = ${trialId} AND ${anonymousTrialsTable.creditsUsed} < ${ANON_CREDIT_LIMIT}`,
        )
        .returning();

      if (updated.length === 0) {
        const [row] = await db
          .select()
          .from(anonymousTrialsTable)
          .where(eq(anonymousTrialsTable.id, trialId))
          .limit(1);
        const used = row?.creditsUsed ?? ANON_CREDIT_LIMIT;
        res.status(402).json({
          error: `You've used your ${ANON_CREDIT_LIMIT} free trial generations. Sign in to continue — sign-up is free.`,
          requiresLogin: true,
          creditsUsed: used,
          creditsLimit: ANON_CREDIT_LIMIT,
        });
        return;
      }

      const remaining = Math.max(0, ANON_CREDIT_LIMIT - updated[0].creditsUsed);
      res.setHeader(REMAINING_HEADER, String(remaining));
      res.setHeader(LIMIT_HEADER, String(ANON_CREDIT_LIMIT));
      registerRefundOnFailure(res, { kind: "trial", id: trialId });
      next();
      return;
    }

    // ───────────── Signed in ─────────────
    let email: string | null = null;
    try {
      const user = await clerkClient.users.getUser(userId);
      email = user.primaryEmailAddress?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? null;
    } catch {
      /* ignore */
    }

    const workspace = await ensureWorkspace(userId, email);
    const plan = workspace.plan as PlanTier;
    const limit = PLAN_CREDITS[plan] ?? PLAN_CREDITS.free;

    if (limit === -1) {
      res.setHeader(REMAINING_HEADER, "-1");
      res.setHeader(LIMIT_HEADER, "-1");
      next();
      return;
    }

    const updated = await db
      .update(workspacesTable)
      .set({ creditsUsed: sql`${workspacesTable.creditsUsed} + 1` })
      .where(sql`${workspacesTable.id} = ${workspace.id} AND ${workspacesTable.creditsUsed} < ${limit}`)
      .returning();

    if (updated.length === 0) {
      res.status(402).json({
        error: `You've used all ${limit} AI credits on the ${plan} plan. Upgrade your plan or top up to keep generating.`,
        requiresUpgrade: true,
        plan,
        creditsUsed: workspace.creditsUsed,
        creditsLimit: limit,
      });
      return;
    }

    const remaining = Math.max(0, limit - updated[0].creditsUsed);
    res.setHeader(REMAINING_HEADER, String(remaining));
    res.setHeader(LIMIT_HEADER, String(limit));
    registerRefundOnFailure(res, { kind: "workspace", id: workspace.id });
    next();
  };
}
