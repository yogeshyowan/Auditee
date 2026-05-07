// =============================================================
// GitHub push helper — uses the Git Data API to commit one or
// many generated files (reports, test bundles) back to a
// connected GitHub repository in a single atomic commit.
//
// Auth: re-uses the personal-access-token already stored with
// the project's ingested github source (project_sources.config
// .token). The token must have `repo` scope to push to private
// repos or `public_repo` for public ones.
//
// All errors are converted to Error with a friendly message so
// the route layer can hand them to the user verbatim.
// =============================================================

export type PushFile = {
  /** Path WITHIN the repo, e.g. "auditee/reports/brd/abc.md". No leading slash. */
  path: string;
  /** UTF-8 string content. Binary files not supported here. */
  content: string;
};

export type PushResult = {
  commitSha: string;
  commitUrl: string;
  branch: string;
  fileCount: number;
};

const GH_HEADERS_BASE = {
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  "User-Agent": "Auditee-Push/1.0",
} as const;

function parseRepoUrl(repoUrl: string): { owner: string; repo: string } {
  // Same regex as source-ingestion.ts to stay consistent.
  const m = repoUrl.match(/github\.com[/:]([^/]+)\/([^/]+?)(?:\.git)?(?:\/.*)?$/i);
  if (!m) throw new Error("Could not parse GitHub repoUrl. Expected https://github.com/owner/repo");
  return { owner: m[1]!, repo: m[2]! };
}

async function gh<T>(url: string, token: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, {
    ...init,
    headers: {
      ...GH_HEADERS_BASE,
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
    },
  });
  if (!r.ok) {
    let msg = `GitHub ${r.status}`;
    try {
      const body = (await r.json()) as { message?: string; documentation_url?: string };
      if (body?.message) msg = `GitHub ${r.status}: ${body.message}`;
    } catch {
      /* swallow */
    }
    if (r.status === 401 || r.status === 403)
      msg += " — make sure the source's token has `repo` (write) scope.";
    if (r.status === 404)
      msg += " — repo, branch or path not found.";
    if (r.status === 409)
      msg += " — branch is locked or protected; choose another branch.";
    if (r.status === 422)
      msg += " — payload rejected (most often: branch protection requires a PR).";
    throw new Error(msg);
  }
  return (await r.json()) as T;
}

/**
 * Push a set of files to a single commit on the chosen branch.
 * Uses the GitHub low-level Git Data API:
 *   1. get ref → base commit SHA
 *   2. get commit → base tree SHA
 *   3. create blob per file → blob SHA
 *   4. create new tree (base_tree=baseTreeSha + per-file paths)
 *   5. create new commit (parents=[baseCommitSha], tree=newTreeSha)
 *   6. update ref to new commit SHA
 */
export async function pushFilesToRepo(opts: {
  repoUrl: string;
  branch?: string;
  token: string;
  files: PushFile[];
  commitMessage: string;
  authorName?: string;
  authorEmail?: string;
}): Promise<PushResult> {
  if (opts.files.length === 0) throw new Error("No files to push.");
  if (!opts.token) throw new Error("No GitHub token available for push. Re-add this source with a `repo`-scoped personal access token (or set GITHUB_PAT on the server).");

  const { owner, repo } = parseRepoUrl(opts.repoUrl);
  const token = opts.token;

  // Resolve branch (default repo branch when omitted).
  let branch = opts.branch?.trim();
  if (!branch) {
    const meta = await gh<{ default_branch: string }>(
      `https://api.github.com/repos/${owner}/${repo}`,
      token,
    );
    branch = meta.default_branch;
  }

  // 1. Base ref + commit + tree.
  const ref = await gh<{ object: { sha: string } }>(
    `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(branch)}`,
    token,
  );
  const baseCommitSha = ref.object.sha;
  const baseCommit = await gh<{ tree: { sha: string } }>(
    `https://api.github.com/repos/${owner}/${repo}/git/commits/${baseCommitSha}`,
    token,
  );
  const baseTreeSha = baseCommit.tree.sha;

  // 2. Create one blob per file (sequential — keeps rate-limit friendly;
  // typical push is 1-50 small markdown files).
  const treeEntries: Array<{ path: string; mode: "100644"; type: "blob"; sha: string }> = [];
  for (const f of opts.files) {
    const safePath = f.path.replace(/^\/+/, "");
    if (!safePath || safePath.includes("..")) {
      throw new Error(`Refusing to push suspicious path: "${f.path}"`);
    }
    const blob = await gh<{ sha: string }>(
      `https://api.github.com/repos/${owner}/${repo}/git/blobs`,
      token,
      {
        method: "POST",
        body: JSON.stringify({
          content: Buffer.from(f.content, "utf8").toString("base64"),
          encoding: "base64",
        }),
      },
    );
    treeEntries.push({ path: safePath, mode: "100644", type: "blob", sha: blob.sha });
  }

  // 3. New tree on top of the base tree.
  const newTree = await gh<{ sha: string }>(
    `https://api.github.com/repos/${owner}/${repo}/git/trees`,
    token,
    {
      method: "POST",
      body: JSON.stringify({ base_tree: baseTreeSha, tree: treeEntries }),
    },
  );

  // 4. New commit.
  const author =
    opts.authorName && opts.authorEmail
      ? { name: opts.authorName, email: opts.authorEmail }
      : undefined;
  const newCommit = await gh<{ sha: string; html_url: string }>(
    `https://api.github.com/repos/${owner}/${repo}/git/commits`,
    token,
    {
      method: "POST",
      body: JSON.stringify({
        message: opts.commitMessage,
        tree: newTree.sha,
        parents: [baseCommitSha],
        ...(author ? { author } : {}),
      }),
    },
  );

  // 5. Move the branch ref forward.
  await gh(
    `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${encodeURIComponent(branch)}`,
    token,
    {
      method: "PATCH",
      body: JSON.stringify({ sha: newCommit.sha, force: false }),
    },
  );

  return {
    commitSha: newCommit.sha,
    commitUrl: newCommit.html_url,
    branch,
    fileCount: opts.files.length,
  };
}

/** Make a filesystem-safe slug from a free-text title (≤ 80 chars). */
export function slugify(s: string, max = 80): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max) || "untitled";
}
