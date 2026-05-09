// Post GitHub Check Runs back to the customer's repository so the
// "Auditee / Compliance" check appears on every push and PR. When the
// repo's branch protection requires this check to pass, a regression
// (open critical/high CAPA, recent failed pipeline run) literally blocks
// the merge button — that's the "compliance-as-code" gate.
//
// Auth: per-source GitHub token if set, else process.env.GITHUB_PAT —
// same precedence as routes/repoPush.ts. Token must have `checks:write`
// (fine-grained) or `repo` scope (classic) on the target repo.
import { safeFetch } from "./safe-fetch.js";

export type CheckRunConclusion =
  | "success"
  | "failure"
  | "neutral"
  | "cancelled"
  | "skipped"
  | "timed_out"
  | "action_required";

export type CheckRunInput = {
  owner: string;
  repo: string;
  headSha: string;
  name?: string;            // default "Auditee / Compliance"
  conclusion: CheckRunConclusion;
  title: string;            // shown in the check-run card header
  summary: string;          // markdown; shown in the check-run "Details" tab
  detailsUrl?: string;      // link back to Auditee
};

export async function postCheckRun(token: string, input: CheckRunInput): Promise<{ id: number; html_url: string }> {
  if (!token) throw new Error("GitHub Check Run: no token (set per-source token or GITHUB_PAT)");
  const url = `https://api.github.com/repos/${encodeURIComponent(input.owner)}/${encodeURIComponent(input.repo)}/check-runs`;
  const body = {
    name: input.name ?? "Auditee / Compliance",
    head_sha: input.headSha,
    status: "completed",
    conclusion: input.conclusion,
    ...(input.detailsUrl ? { details_url: input.detailsUrl } : {}),
    output: {
      title: input.title.slice(0, 200),
      summary: input.summary.slice(0, 65000),
    },
  };
  const resp = await safeFetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      "User-Agent": "Auditee-Compliance-Gate",
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    throw new Error(`GitHub Check Run: HTTP ${resp.status} — ${txt.slice(0, 200)}`);
  }
  return (await resp.json()) as { id: number; html_url: string };
}

// Parse "owner/repo" from a GitHub repository.full_name. Returns null on
// any unexpected shape (e.g. relative path, blank string).
export function parseFullName(fullName: string | undefined | null): { owner: string; repo: string } | null {
  if (!fullName || typeof fullName !== "string") return null;
  const parts = fullName.split("/");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  return { owner: parts[0], repo: parts[1] };
}
