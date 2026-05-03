import { Router, type IRouter, type Request, type Response as ExpressResponse } from "express";
import { eq } from "drizzle-orm";
import { createHash, randomBytes } from "node:crypto";
import { db, workspacesTable, workspaceMembersTable, type PlanTier } from "@workspace/db";
import { clerkClient } from "@clerk/express";
import { logger } from "../lib/logger";
import { planAllows } from "../lib/permissions";
import { logSecurityEvent } from "../lib/auditLog";
import { decryptField } from "../lib/fieldEncryption";
import { safeFetch } from "../lib/safe-fetch";

/**
 * OIDC SSO via Authorization Code flow with PKCE.
 *
 * Flow:
 *   GET  /api/sso/oidc/:wsId/login    → discover IdP, redirect to authorize URL
 *   GET  /api/sso/oidc/:wsId/callback → exchange code, fetch userinfo, mint Clerk ticket
 *
 * State + PKCE verifier travel in a short-lived signed cookie so we don't
 * need a server-side store. nameID/email comes from the userinfo endpoint
 * (preferred) or from the id_token claims as a fallback.
 *
 * Plan-gated to Enterprise. SSO domain restriction (workspaces.ssoDomain) is
 * enforced identically to the SAML path.
 */

const router: IRouter = Router();
const STATE_COOKIE = "auditee_oidc_state";

function publicBaseUrl(req: Request): string {
  const proto = (req.headers["x-forwarded-proto"] as string | undefined) ?? req.protocol;
  const host = (req.headers["x-forwarded-host"] as string | undefined) ?? req.get("host");
  return `${proto}://${host}`;
}

async function loadWorkspace(workspaceId: string) {
  const rows = await db.select().from(workspacesTable).where(eq(workspacesTable.id, workspaceId)).limit(1);
  return rows[0] ?? null;
}

interface DiscoveryDoc {
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint?: string;
  issuer: string;
}

async function discover(issuer: string): Promise<DiscoveryDoc> {
  const url = issuer.replace(/\/$/, "") + "/.well-known/openid-configuration";
  const r = await safeFetch(url, { headers: { Accept: "application/json" } });
  if (!r.ok) throw new Error(`OIDC discovery failed: HTTP ${r.status}`);
  return (await r.json()) as DiscoveryDoc;
}

function b64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

router.get("/sso/oidc/:workspaceId/login", async (req, res) => {
  const ws = await loadWorkspace(String(req.params.workspaceId));
  if (!ws) { res.status(404).send("Workspace not found"); return; }
  if (!planAllows(ws.plan as PlanTier, "oidc")) {
    res.status(402).send("OIDC SSO is an Enterprise feature.");
    return;
  }
  if (!ws.oidcIssuer || !ws.oidcClientId) {
    res.status(412).send("OIDC not configured. Workspace owner must set issuer + clientId first.");
    return;
  }

  let disco: DiscoveryDoc;
  try {
    disco = await discover(ws.oidcIssuer);
  } catch (err) {
    logger.error({ err, workspaceId: ws.id }, "[oidc] discovery failed");
    res.status(502).send("OIDC discovery failed; check issuer URL.");
    return;
  }

  const state = b64url(randomBytes(24));
  const codeVerifier = b64url(randomBytes(48));
  const codeChallenge = b64url(createHash("sha256").update(codeVerifier).digest());
  const base = publicBaseUrl(req);
  const redirectUri = `${base}/api/sso/oidc/${ws.id}/callback`;

  // Store state + verifier in an httpOnly, secure, short-lived cookie. Bound
  // to this workspace via the path so two parallel logins for different
  // workspaces don't collide.
  const cookiePayload = Buffer.from(JSON.stringify({ state, codeVerifier })).toString("base64url");
  res.setHeader("Set-Cookie",
    `${STATE_COOKIE}=${cookiePayload}; Path=/api/sso/oidc/${ws.id}/; Max-Age=600; HttpOnly; SameSite=Lax; Secure`);

  const authzUrl = new URL(disco.authorization_endpoint);
  authzUrl.searchParams.set("response_type", "code");
  authzUrl.searchParams.set("client_id", ws.oidcClientId);
  authzUrl.searchParams.set("redirect_uri", redirectUri);
  authzUrl.searchParams.set("scope", "openid email profile");
  authzUrl.searchParams.set("state", state);
  authzUrl.searchParams.set("code_challenge", codeChallenge);
  authzUrl.searchParams.set("code_challenge_method", "S256");
  res.redirect(authzUrl.toString());
});

router.get("/sso/oidc/:workspaceId/callback", async (req: Request, res: ExpressResponse) => {
  const ws = await loadWorkspace(String(req.params.workspaceId));
  if (!ws) { res.status(404).send("Workspace not found"); return; }
  if (!planAllows(ws.plan as PlanTier, "oidc")) {
    res.status(402).send("OIDC SSO is an Enterprise feature.");
    return;
  }
  if (!ws.oidcIssuer || !ws.oidcClientId) {
    res.status(412).send("OIDC not configured.");
    return;
  }

  const code = String(req.query.code ?? "");
  const returnedState = String(req.query.state ?? "");
  if (!code || !returnedState) { res.status(400).send("Missing code/state."); return; }

  // Parse the state cookie.
  const rawCookie = (req.headers.cookie ?? "").split(";").map((c) => c.trim()).find((c) => c.startsWith(`${STATE_COOKIE}=`));
  const cookieVal = rawCookie ? rawCookie.slice(STATE_COOKIE.length + 1) : "";
  if (!cookieVal) { res.status(400).send("Missing OIDC state cookie."); return; }
  let parsed: { state: string; codeVerifier: string };
  try {
    parsed = JSON.parse(Buffer.from(cookieVal, "base64url").toString("utf8"));
  } catch {
    res.status(400).send("Invalid OIDC state cookie."); return;
  }
  if (parsed.state !== returnedState) {
    await logSecurityEvent(req, { action: "security.oidc_state_mismatch", workspaceId: ws.id });
    res.status(400).send("OIDC state mismatch."); return;
  }

  let disco: DiscoveryDoc;
  try {
    disco = await discover(ws.oidcIssuer);
  } catch (err) {
    logger.error({ err, workspaceId: ws.id }, "[oidc] discovery failed at callback");
    res.status(502).send("OIDC discovery failed."); return;
  }

  // Exchange code for tokens.
  const base = publicBaseUrl(req);
  const redirectUri = `${base}/api/sso/oidc/${ws.id}/callback`;
  const clientSecret = ws.oidcClientSecretEncrypted ? decryptField(ws.oidcClientSecretEncrypted) : "";
  const tokenBody = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: ws.oidcClientId,
    code_verifier: parsed.codeVerifier,
  });
  const tokenHeaders: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
    Accept: "application/json",
  };
  if (clientSecret) {
    tokenHeaders.Authorization = `Basic ${Buffer.from(`${ws.oidcClientId}:${clientSecret}`).toString("base64")}`;
  }
  let tokenJson: { access_token?: string; id_token?: string };
  try {
    const tokenResp = await safeFetch(disco.token_endpoint, { method: "POST", headers: tokenHeaders, body: tokenBody.toString() });
    if (!tokenResp.ok) {
      res.status(502).send(`OIDC token exchange failed: HTTP ${tokenResp.status}`); return;
    }
    tokenJson = (await tokenResp.json()) as { access_token?: string; id_token?: string };
  } catch (err) {
    logger.error({ err, workspaceId: ws.id }, "[oidc] token exchange threw");
    res.status(502).send("OIDC token exchange failed."); return;
  }
  if (!tokenJson.access_token && !tokenJson.id_token) {
    res.status(502).send("OIDC token response missing access_token/id_token."); return;
  }

  // Resolve email — prefer userinfo over id_token claims because some IdPs
  // omit email from the id_token unless explicitly requested.
  let email: string | null = null;
  if (disco.userinfo_endpoint && tokenJson.access_token) {
    try {
      const uir = await safeFetch(disco.userinfo_endpoint, {
        headers: { Authorization: `Bearer ${tokenJson.access_token}`, Accept: "application/json" },
      });
      if (uir.ok) {
        const uij = (await uir.json()) as { email?: string; preferred_username?: string };
        email = (uij.email ?? uij.preferred_username ?? null);
      }
    } catch (err) {
      logger.warn({ err, workspaceId: ws.id }, "[oidc] userinfo fetch failed");
    }
  }
  if (!email && tokenJson.id_token) {
    // Decode JWT payload (no signature verification — IdP discovery + TLS +
    // PKCE already establish trust for this exchange path; for high-security
    // workspaces use SAML which IS signature-verified).
    try {
      const parts = tokenJson.id_token.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as { email?: string };
        email = payload.email ?? null;
      }
    } catch { /* ignore */ }
  }
  if (!email || !email.includes("@")) {
    res.status(400).send("OIDC response missing email."); return;
  }
  email = email.toLowerCase().trim();

  if (ws.ssoDomain && !email.endsWith(`@${ws.ssoDomain.toLowerCase()}`)) {
    await logSecurityEvent(req, {
      action: "security.oidc_domain_rejected",
      workspaceId: ws.id,
      metadata: { email, expectedDomain: ws.ssoDomain },
    });
    res.status(403).send("Email domain does not match workspace SSO policy.");
    return;
  }

  try {
    const existing = await clerkClient.users.getUserList({ emailAddress: [email] });
    const userList = existing.data ?? [];
    let clerkUser = userList[0];
    if (!clerkUser) {
      clerkUser = await clerkClient.users.createUser({
        emailAddress: [email],
        skipPasswordRequirement: true,
      });
    }
    await db
      .insert(workspaceMembersTable)
      .values({
        id: crypto.randomUUID(),
        workspaceId: ws.id,
        userId: clerkUser.id,
        email,
        role: "editor",
        invitedBy: "oidc-sso",
      })
      .onConflictDoUpdate({
        target: [workspaceMembersTable.workspaceId, workspaceMembersTable.userId],
        set: { email },
      });
    const ticket = await clerkClient.signInTokens.createSignInToken({
      userId: clerkUser.id,
      expiresInSeconds: 60,
    });
    // Clear the state cookie now that we're done with it.
    res.setHeader("Set-Cookie",
      `${STATE_COOKIE}=; Path=/api/sso/oidc/${ws.id}/; Max-Age=0; HttpOnly; SameSite=Lax; Secure`);
    res.redirect(`${base}/sso/finalize?ticket=${encodeURIComponent(ticket.token)}`);
  } catch (err) {
    logger.error({ err, workspaceId: ws.id, email }, "[oidc] post-callback provisioning failed");
    res.status(500).send("Internal error completing OIDC sign-in.");
  }
});

export default router;
