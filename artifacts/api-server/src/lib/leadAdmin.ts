/**
 * Authorization for the cross-workspace admin views (e.g. captured leads).
 *
 * `lead_captures` is a single global table — it is NOT scoped to a workspace —
 * so a regular workspace-owner check is unsafe: every signed-in user is
 * automatically the owner of their own workspace and would otherwise be able
 * to read every other user's signup/login PII.
 *
 * Instead, we gate these endpoints on an explicit allowlist of internal
 * operator emails configured via the `LEAD_ADMIN_EMAILS` env var (comma- or
 * whitespace-separated). When the env var is unset the allowlist is empty and
 * no one can access the admin endpoints — a safe-by-default posture.
 */
export function getLeadAdminEmails(): string[] {
  const raw = process.env.LEAD_ADMIN_EMAILS ?? "";
  return raw
    .split(/[,\s]+/)
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0 && e.includes("@"));
}

export function isLeadAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowlist = getLeadAdminEmails();
  if (allowlist.length === 0) return false;
  return allowlist.includes(email.trim().toLowerCase());
}
