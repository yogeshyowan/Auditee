import { pgTable, text, integer, timestamp, uniqueIndex, boolean, jsonb } from "drizzle-orm/pg-core";

export const WORKSPACE_ROLES = ["owner", "admin", "editor", "viewer"] as const;
export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number];

export const PLAN_TIERS = ["free", "standard", "professional", "enterprise"] as const;
export type PlanTier = (typeof PLAN_TIERS)[number];

export const PLAN_SEATS: Record<PlanTier, number> = {
  free: 1,
  standard: 1,
  professional: 4,
  enterprise: 20,
};

export const PLAN_PRICE_USD: Record<PlanTier, number> = {
  free: 0,
  standard: 25,
  professional: 100,
  enterprise: 500,
};

// Per-workspace lifetime AI generation credits. 1 credit = 1 AI generation.
// Anonymous (signed-out) browsers get the same Free allowance (10) tracked in
// localStorage on the client and verified server-side via a request header.
// Free users can also top-up: $5 prepaid grants 10 additional credits.
export const ANON_CREDIT_LIMIT = 10;
export const PLAN_CREDITS: Record<PlanTier, number> = {
  free: 10,
  standard: 50,
  professional: 200,
  enterprise: 1000,
};
export const FREE_TOPUP_PRICE_USD = 5;
export const FREE_TOPUP_CREDITS = 10;

export const workspacesTable = pgTable(
  "workspaces",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    plan: text("plan").notNull().default("free"),
    seatLimit: integer("seat_limit").notNull().default(1),
    ownerUserId: text("owner_user_id").notNull(),
    planActivatedAt: timestamp("plan_activated_at", { withTimezone: true }),
    /** When the current paid plan lapses. Only set for annual one-time
     *  Razorpay orders (cadence='annual'). Null for free workspaces and for
     *  monthly subscriptions (those auto-renew via Razorpay). */
    planExpiresAt: timestamp("plan_expires_at", { withTimezone: true }),
    /** The subscription row that's currently entitling this workspace to
     *  paid features. Used to ignore stale Razorpay webhook events: if a
     *  delayed `subscription.cancelled` arrives for an OLD subscription
     *  after the workspace has already moved to a newer subscription/order,
     *  we must not downgrade. The webhook handler checks this column before
     *  honouring downgrade events. Null means workspace is on free. */
    currentSubscriptionId: text("current_subscription_id"),
    creditsUsed: integer("credits_used").notNull().default(0),
    ssoEnabled: boolean("sso_enabled").notNull().default(false),
    ssoDomain: text("sso_domain"),
    // ─── Enterprise: SAML 2.0 IdP config (uploaded metadata) ────────────────
    samlIdpEntityId: text("saml_idp_entity_id"),
    samlIdpSsoUrl: text("saml_idp_sso_url"),
    samlIdpX509Cert: text("saml_idp_x509_cert"),
    samlIdpMetadataXml: text("saml_idp_metadata_xml"),
    // ─── Enterprise: MFA enforcement policy ────────────────────────────────
    mfaRequired: boolean("mfa_required").notNull().default(false),
    // ─── Enterprise: Data residency (informational + future routing) ───────
    dataRegion: text("data_region").notNull().default("us"),
    // ─── Enterprise: SIEM / audit-log streaming ────────────────────────────
    siemWebhookUrl: text("siem_webhook_url"),
    siemWebhookSecret: text("siem_webhook_secret"),
    // Payload shape sent to the SIEM. One of: generic | splunk_hec | datadog | elastic.
    // Default 'generic' preserves the original Auditee-native JSON shape.
    siemFormat: text("siem_format").notNull().default("generic"),
    // ─── Enterprise: OIDC SSO (in addition to SAML) ────────────────────────
    // Issuer URL is used for OIDC discovery (.well-known/openid-configuration).
    // clientSecret is stored encrypted via fieldEncryption helpers.
    oidcIssuer: text("oidc_issuer"),
    oidcClientId: text("oidc_client_id"),
    oidcClientSecretEncrypted: text("oidc_client_secret_encrypted"),
    // ─── Enterprise: Customer-managed encryption key id (KMS metadata) ────
    cmkKid: text("cmk_kid"),
    // ─── Enterprise: Network allowlist — array of CIDR strings ─────────────
    // Empty/null disables the check. Non-empty: requests from non-matching IPs
    // are rejected with HTTP 403. Applied by `ipAllowlistGuard` middleware.
    ipAllowlist: jsonb("ip_allowlist").$type<string[]>().notNull().default([]),
    // ─── Enterprise: White-label branding ──────────────────────────────────
    brandingLogoUrl: text("branding_logo_url"),
    brandingPrimaryColor: text("branding_primary_color"),
    brandingProductName: text("branding_product_name"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniqOwner: uniqueIndex("workspaces_owner_user_id_uniq").on(t.ownerUserId),
  }),
);

export const workspaceMembersTable = pgTable(
  "workspace_members",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspacesTable.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    email: text("email"),
    role: text("role").notNull().default("member"),
    invitedBy: text("invited_by"),
    addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniqMember: uniqueIndex("workspace_members_workspace_user_uniq").on(t.workspaceId, t.userId),
  }),
);

export type Workspace = typeof workspacesTable.$inferSelect;
export type WorkspaceMember = typeof workspaceMembersTable.$inferSelect;
