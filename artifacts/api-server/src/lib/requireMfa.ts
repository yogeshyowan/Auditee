import type { Request, Response, NextFunction } from "express";
import { clerkClient } from "@clerk/express";
import { logger } from "./logger";
import type { AuthedRequest } from "./authContext";

/**
 * Workspace-policy MFA enforcement. Applied to mutating routes when the
 * workspace owner has flipped `mfa_required = true`. Verifies the signed-in
 * Clerk user has a second factor enrolled; otherwise returns 403 with a
 * `requiresMfa` hint the frontend uses to bounce the user to Clerk's MFA
 * setup screen.
 *
 * No-op for workspaces that haven't enabled the policy, so overhead on the
 * default code path is one boolean check.
 */
export async function enforceMfaIfRequired(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const ctx = (req as AuthedRequest).ws_ctx;
  if (!ctx || !ctx.workspace.mfaRequired) return next();
  try {
    const user = await clerkClient.users.getUser(ctx.userId);
    // Clerk represents enrolled second factors via these flags.
    const hasMfa =
      Boolean(user.totpEnabled) ||
      Boolean(user.backupCodeEnabled) ||
      (Array.isArray(user.phoneNumbers) &&
        user.phoneNumbers.some((p) => p.reservedForSecondFactor));
    if (!hasMfa) {
      res.status(403).json({
        error:
          "Multi-factor authentication is required by your workspace. " +
          "Enable 2FA in your account settings to continue.",
        requiresMfa: true,
      });
      return;
    }
    next();
  } catch (err) {
    logger.error({ err }, "[mfa] enforcement check failed");
    res.status(503).json({ error: "MFA verification temporarily unavailable." });
  }
}
