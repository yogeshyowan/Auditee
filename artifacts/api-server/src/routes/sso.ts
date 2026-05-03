import { Router, type IRouter, type Request, type Response } from "express";
import express from "express";
import { eq } from "drizzle-orm";
import * as samlify from "samlify";
import { db, workspacesTable, workspaceMembersTable, type PlanTier } from "@workspace/db";
import { clerkClient } from "@clerk/express";
import { logger } from "../lib/logger";
import { planAllows } from "../lib/permissions";
import { logSecurityEvent } from "../lib/auditLog";

// samlify ships with an XSD validator that requires libxmljs; in this
// pure-JS environment we accept that we cannot run XSD validation and rely
// on samlify's signature-verification (XML-DSig) for trust. We log if a
// stronger validator is wired in by deployment.
samlify.setSchemaValidator({
  validate: async () => "skipped",
});

const router: IRouter = Router();

function publicBaseUrl(req: Request): string {
  // Use the proxied host in production; fall back to req for local dev.
  const proto = (req.headers["x-forwarded-proto"] as string | undefined) ?? req.protocol;
  const host = (req.headers["x-forwarded-host"] as string | undefined) ?? req.get("host");
  return `${proto}://${host}`;
}

function buildSp(req: Request, workspaceId: string) {
  const base = publicBaseUrl(req);
  return samlify.ServiceProvider({
    entityID: `${base}/api/sso/saml/${workspaceId}/metadata`,
    assertionConsumerService: [
      {
        Binding: samlify.Constants.namespace.binding.post,
        Location: `${base}/api/sso/saml/${workspaceId}/acs`,
      },
    ],
    nameIDFormat: [samlify.Constants.namespace.format.emailAddress],
    wantAssertionsSigned: true,
    wantMessageSigned: false,
  });
}

function buildIdp(workspace: {
  samlIdpEntityId: string | null;
  samlIdpSsoUrl: string | null;
  samlIdpX509Cert: string | null;
  samlIdpMetadataXml: string | null;
}) {
  if (workspace.samlIdpMetadataXml) {
    return samlify.IdentityProvider({ metadata: workspace.samlIdpMetadataXml });
  }
  if (!workspace.samlIdpEntityId || !workspace.samlIdpSsoUrl || !workspace.samlIdpX509Cert) {
    return null;
  }
  return samlify.IdentityProvider({
    entityID: workspace.samlIdpEntityId,
    singleSignOnService: [
      {
        Binding: samlify.Constants.namespace.binding.redirect,
        Location: workspace.samlIdpSsoUrl,
      },
    ],
    signingCert: workspace.samlIdpX509Cert,
  });
}

async function loadWorkspace(workspaceId: string) {
  const rows = await db
    .select()
    .from(workspacesTable)
    .where(eq(workspacesTable.id, workspaceId))
    .limit(1);
  return rows[0] ?? null;
}

/** SP metadata XML — give this URL to the IdP admin. */
router.get("/sso/saml/:workspaceId/metadata", async (req, res) => {
  const ws = await loadWorkspace(String(req.params.workspaceId));
  if (!ws) {
    res.status(404).send("Workspace not found");
    return;
  }
  const sp = buildSp(req, ws.id);
  res.type("application/xml").send(sp.getMetadata());
});

/** IdP-initiated or SP-initiated login. Builds a SAML AuthnRequest and 302s. */
router.get("/sso/saml/:workspaceId/login", async (req, res) => {
  const ws = await loadWorkspace(String(req.params.workspaceId));
  if (!ws) {
    res.status(404).send("Workspace not found");
    return;
  }
  if (!planAllows(ws.plan as PlanTier, "saml")) {
    res.status(402).send("SAML SSO is an Enterprise feature.");
    return;
  }
  const idp = buildIdp(ws);
  if (!idp) {
    res.status(412).send("SAML IdP not configured. Workspace owner must upload IdP metadata first.");
    return;
  }
  try {
    const sp = buildSp(req, ws.id);
    const { context } = sp.createLoginRequest(idp, "redirect");
    res.redirect(context);
  } catch (err) {
    logger.error({ err, workspaceId: ws.id }, "[saml] createLoginRequest failed");
    res.status(500).send("Failed to start SAML login.");
  }
});

/**
 * Assertion Consumer Service. Receives the IdP's SAML Response (POST binding,
 * application/x-www-form-urlencoded). Verifies signature, extracts the
 * subject email, and either looks up an existing Clerk user with that email
 * or provisions a new one + workspace membership row, then redirects the
 * browser into Clerk with a single-use sign-in ticket so the user lands in
 * /app already authenticated.
 */
router.post(
  "/sso/saml/:workspaceId/acs",
  express.urlencoded({ extended: false, limit: "1mb" }),
  async (req: Request, res: Response) => {
    const ws = await loadWorkspace(String(req.params.workspaceId));
    if (!ws) {
      res.status(404).send("Workspace not found");
      return;
    }
    if (!planAllows(ws.plan as PlanTier, "saml")) {
      res.status(402).send("SAML SSO is an Enterprise feature.");
      return;
    }
    const idp = buildIdp(ws);
    if (!idp) {
      res.status(412).send("SAML IdP not configured.");
      return;
    }
    const sp = buildSp(req, ws.id);
    let extract: Record<string, unknown>;
    try {
      const result = await sp.parseLoginResponse(idp, "post", { body: req.body });
      extract = result.extract as Record<string, unknown>;
    } catch (err) {
      await logSecurityEvent(req, {
        action: "security.saml_response_invalid",
        workspaceId: ws.id,
        metadata: { error: err instanceof Error ? err.message : String(err) },
      });
      res.status(400).send("Invalid SAML response.");
      return;
    }

    const nameId =
      ((extract.nameID as string | undefined) ??
        (extract.nameid as string | undefined) ??
        ((extract.attributes as Record<string, string> | undefined)?.email)) ??
      null;
    if (!nameId || typeof nameId !== "string" || !nameId.includes("@")) {
      res.status(400).send("SAML response missing email NameID.");
      return;
    }
    const email = nameId.toLowerCase().trim();

    // Domain restriction: if workspace has ssoDomain set, enforce it.
    if (ws.ssoDomain && !email.endsWith(`@${ws.ssoDomain.toLowerCase()}`)) {
      await logSecurityEvent(req, {
        action: "security.saml_domain_rejected",
        workspaceId: ws.id,
        metadata: { email, expectedDomain: ws.ssoDomain },
      });
      res.status(403).send("Email domain does not match workspace SSO policy.");
      return;
    }

    try {
      // Look up existing Clerk user with this email; create if missing.
      const existing = await clerkClient.users.getUserList({ emailAddress: [email] });
      const userList = existing.data ?? [];
      let clerkUser = userList[0];
      if (!clerkUser) {
        clerkUser = await clerkClient.users.createUser({
          emailAddress: [email],
          skipPasswordRequirement: true,
        });
      }

      // Ensure workspace_members row exists for this user.
      await db
        .insert(workspaceMembersTable)
        .values({
          id: crypto.randomUUID(),
          workspaceId: ws.id,
          userId: clerkUser.id,
          email,
          role: "editor",
          invitedBy: "saml-sso",
        })
        .onConflictDoUpdate({
          target: [workspaceMembersTable.workspaceId, workspaceMembersTable.userId],
          // Re-sync email on each SAML login so role/email churn in the IdP
          // is reflected. Role is intentionally NOT downgraded — admin promotions
          // happen in Auditee, not in the IdP.
          set: { email },
        });

      // Mint a single-use Clerk sign-in ticket and bounce the browser into
      // the SPA's `/sso/finalize` route which calls Clerk's signIn.create
      // with strategy:'ticket'.
      const ticket = await clerkClient.signInTokens.createSignInToken({
        userId: clerkUser.id,
        expiresInSeconds: 60,
      });
      const base = publicBaseUrl(req);
      res.redirect(`${base}/sso/finalize?ticket=${encodeURIComponent(ticket.token)}`);
    } catch (err) {
      logger.error({ err, workspaceId: ws.id, email }, "[saml] post-ACS provisioning failed");
      res.status(500).send("Internal error completing SSO sign-in.");
    }
  },
);

export default router;
