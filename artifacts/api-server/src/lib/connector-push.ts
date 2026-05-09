// Write-back integrations for Jira, Azure DevOps Boards, Confluence, and
// SharePoint (Microsoft Graph). Each function takes the source's stored
// `config` object plus a payload and returns `{ url, externalId }`.
//
// Auth strategy: re-uses whatever auth fields the matching read connector
// already collects (host + email + token for Atlassian; host + token for
// ADO PAT). For SharePoint there is no read-side counterpart, so we use
// the standard Azure AD app-only "client credentials" flow — the user
// supplies tenantId / clientId / clientSecret of an app registration that
// has Sites.ReadWrite.All on Microsoft Graph.
import { safeFetch } from "./safe-fetch.js";

export type WorkItemPayload = {
  title: string;
  description: string;
  // Jira: Bug / Task / Story / Epic. ADO: Bug / Task / User Story / Epic / Issue.
  // Free-form so the caller can pass tool-native types.
  type?: string;
  priority?: string;
  labels?: string[];
};

export type DocumentPayload = {
  title: string;
  // Markdown body — converted to HTML for Confluence storage format and
  // uploaded as a `.md` file for SharePoint (renders in browser preview).
  markdown: string;
};

export type PushResult = { url: string; externalId: string };

// ───────────────── Jira ─────────────────

export async function pushJiraIssue(
  cfg: Record<string, any>,
  payload: WorkItemPayload,
): Promise<PushResult> {
  const host = String(cfg.host || "").replace(/\/$/, "");
  const projectKey = String(cfg.projectKey || "");
  const email = String(cfg.email || "");
  const token = String(cfg.token || "");
  if (!host || !projectKey || !email || !token) {
    throw new Error("Jira: host, projectKey, email and token are required on the source");
  }
  const auth = `Basic ${Buffer.from(`${email}:${token}`).toString("base64")}`;
  const issueType = payload.type || "Task";
  const body = {
    fields: {
      project: { key: projectKey },
      summary: payload.title.slice(0, 250),
      issuetype: { name: issueType },
      description: {
        type: "doc",
        version: 1,
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: payload.description.slice(0, 30000) }],
          },
        ],
      },
      ...(payload.priority ? { priority: { name: payload.priority } } : {}),
      ...(payload.labels?.length
        ? { labels: payload.labels.map((l) => l.replace(/\s+/g, "_").slice(0, 60)) }
        : {}),
    },
  };
  const resp = await safeFetch(`${host}/rest/api/3/issue`, {
    method: "POST",
    headers: { Authorization: auth, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    throw new Error(`Jira: HTTP ${resp.status} — ${txt.slice(0, 200)}`);
  }
  const j = (await resp.json()) as { id: string; key: string };
  return { url: `${host}/browse/${j.key}`, externalId: j.key };
}

// ───────────── Azure DevOps Boards ─────────────

export async function pushAdoWorkItem(
  cfg: Record<string, any>,
  payload: WorkItemPayload,
): Promise<PushResult> {
  // ALM kind config = { host: 'https://dev.azure.com/{org}/{project}', token, projectId }
  // azure_devops kind config = { host, token, project } — handle either shape.
  const host = String(cfg.host || "").replace(/\/$/, "");
  const project = String(cfg.project || cfg.projectId || "");
  const token = String(cfg.token || "");
  if (!host || !project || !token) {
    throw new Error("Azure DevOps: host, project and PAT are required on the source");
  }
  const auth = `Basic ${Buffer.from(`:${token}`).toString("base64")}`;
  const witType = payload.type || "Task";
  // The ADO Work Items REST API takes JSON-Patch ops, content-type
  // `application/json-patch+json`, with `/fields/...` paths.
  const ops: Array<Record<string, unknown>> = [
    { op: "add", path: "/fields/System.Title", value: payload.title.slice(0, 250) },
    {
      op: "add",
      path: "/fields/System.Description",
      // ADO stores as HTML — paragraphs preserve newlines.
      value: `<p>${escapeHtml(payload.description.slice(0, 30000)).replace(/\n/g, "</p><p>")}</p>`,
    },
  ];
  if (payload.priority) {
    const pmap: Record<string, number> = { critical: 1, high: 2, medium: 3, low: 4 };
    ops.push({
      op: "add",
      path: "/fields/Microsoft.VSTS.Common.Priority",
      value: pmap[payload.priority.toLowerCase()] ?? 3,
    });
  }
  if (payload.labels?.length) {
    ops.push({ op: "add", path: "/fields/System.Tags", value: payload.labels.join("; ") });
  }
  const url = `${host}/${encodeURIComponent(project)}/_apis/wit/workitems/$${encodeURIComponent(witType)}?api-version=7.0`;
  const resp = await safeFetch(url, {
    method: "POST",
    headers: {
      Authorization: auth,
      "Content-Type": "application/json-patch+json",
      Accept: "application/json",
    },
    body: JSON.stringify(ops),
  });
  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    throw new Error(`Azure DevOps: HTTP ${resp.status} — ${txt.slice(0, 200)}`);
  }
  const j = (await resp.json()) as { id: number; _links?: { html?: { href?: string } } };
  const htmlUrl = j._links?.html?.href ?? `${host}/${encodeURIComponent(project)}/_workitems/edit/${j.id}`;
  return { url: htmlUrl, externalId: String(j.id) };
}

// ─────────────── Confluence push ───────────────

export async function pushConfluencePage(
  cfg: Record<string, any>,
  payload: DocumentPayload,
): Promise<PushResult> {
  const host = String(cfg.host || "").replace(/\/$/, "");
  const spaceKey = String(cfg.spaceKey || "");
  const email = String(cfg.email || "");
  const token = String(cfg.token || "");
  const parentId = cfg.parentId ? String(cfg.parentId) : undefined;
  if (!host || !spaceKey || !email || !token) {
    throw new Error("Confluence: host, spaceKey, email and token are required on the source");
  }
  const auth = `Basic ${Buffer.from(`${email}:${token}`).toString("base64")}`;
  // Resolve space id from human-friendly key (matches read-side ingestion).
  const spacesResp = await safeFetch(
    `${host}/wiki/api/v2/spaces?keys=${encodeURIComponent(spaceKey)}`,
    { headers: { Authorization: auth, Accept: "application/json" } },
  );
  if (!spacesResp.ok) throw new Error(`Confluence: HTTP ${spacesResp.status} resolving space`);
  const spaces = (await spacesResp.json()) as { results: Array<{ id: string; key: string }> };
  const space = spaces.results?.[0];
  if (!space) throw new Error(`Confluence: space "${spaceKey}" not found`);
  const body = {
    spaceId: space.id,
    status: "current",
    title: payload.title.slice(0, 240),
    ...(parentId ? { parentId } : {}),
    body: { representation: "storage", value: markdownToConfluenceStorage(payload.markdown) },
  };
  const resp = await safeFetch(`${host}/wiki/api/v2/pages`, {
    method: "POST",
    headers: { Authorization: auth, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    throw new Error(`Confluence: HTTP ${resp.status} — ${txt.slice(0, 200)}`);
  }
  const j = (await resp.json()) as {
    id: string;
    _links?: { webui?: string; base?: string };
  };
  const link = j._links?.webui ? `${host}/wiki${j._links.webui}` : `${host}/wiki/spaces/${space.key}/pages/${j.id}`;
  return { url: link, externalId: j.id };
}

// ─────────────── SharePoint push (Microsoft Graph) ───────────────

export async function pushSharepointDocument(
  cfg: Record<string, any>,
  payload: DocumentPayload,
): Promise<PushResult> {
  const tenantId = String(cfg.tenantId || "");
  const clientId = String(cfg.clientId || "");
  const clientSecret = String(cfg.clientSecret || "");
  const siteId = String(cfg.siteId || "");
  const folderPath = String(cfg.folderPath || "Auditee").replace(/^\/+|\/+$/g, "") || "Auditee";
  if (!tenantId || !clientId || !clientSecret || !siteId) {
    throw new Error(
      "SharePoint: tenantId, clientId, clientSecret and siteId are required (Azure AD app-only auth)",
    );
  }
  // Exchange app credentials for a Graph access token.
  const tokenResp = await safeFetch(
    `https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "client_credentials",
        scope: "https://graph.microsoft.com/.default",
      }).toString(),
    },
  );
  if (!tokenResp.ok) {
    const txt = await tokenResp.text().catch(() => "");
    throw new Error(`SharePoint auth: HTTP ${tokenResp.status} — ${txt.slice(0, 200)}`);
  }
  const tokenJson = (await tokenResp.json()) as { access_token?: string };
  const accessToken = tokenJson.access_token;
  if (!accessToken) throw new Error("SharePoint auth: no access_token in response");
  // PUT the markdown to /drive/root:/<folder>/<title>.md:/content.
  const safeName = sanitizeFileName(payload.title) + ".md";
  const targetPath = `${folderPath}/${safeName}`;
  const url = `https://graph.microsoft.com/v1.0/sites/${encodeURIComponent(siteId)}/drive/root:/${encodeURIComponent(targetPath).replace(/%2F/g, "/")}:/content`;
  const resp = await safeFetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "text/markdown; charset=utf-8",
    },
    body: payload.markdown,
  });
  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    throw new Error(`SharePoint: HTTP ${resp.status} — ${txt.slice(0, 200)}`);
  }
  const j = (await resp.json()) as { id: string; webUrl: string };
  return { url: j.webUrl, externalId: j.id };
}

// ─────────────── helpers ───────────────

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sanitizeFileName(s: string): string {
  return (
    s
      .replace(/[\\/:*?"<>|#%&{}$!'@+`=]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 120) || "untitled"
  );
}

// Tiny markdown → Confluence storage-format converter. Handles headings,
// paragraphs, bold/italic/inline-code, fenced code blocks, and lists.
// Good enough for AI-generated audit reports; not a full CommonMark
// implementation.
function markdownToConfluenceStorage(md: string): string {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let inUl = false;
  let inOl = false;
  let inCode = false;
  let codeLang = "";
  let codeBuf: string[] = [];
  let para: string[] = [];
  const flushPara = () => {
    if (para.length) {
      out.push(`<p>${inlineMd(para.join(" "))}</p>`);
      para = [];
    }
  };
  const flushLists = () => {
    if (inUl) {
      out.push("</ul>");
      inUl = false;
    }
    if (inOl) {
      out.push("</ol>");
      inOl = false;
    }
  };
  for (const raw of lines) {
    const line = raw;
    // Fenced code blocks ```lang
    const fence = /^```(\w*)$/.exec(line.trim());
    if (fence) {
      if (inCode) {
        out.push(
          `<ac:structured-macro ac:name="code"><ac:parameter ac:name="language">${escapeHtml(codeLang || "text")}</ac:parameter><ac:plain-text-body><![CDATA[${codeBuf.join("\n")}]]></ac:plain-text-body></ac:structured-macro>`,
        );
        inCode = false;
        codeBuf = [];
        codeLang = "";
      } else {
        flushPara();
        flushLists();
        inCode = true;
        codeLang = fence[1] ?? "";
      }
      continue;
    }
    if (inCode) {
      codeBuf.push(line);
      continue;
    }
    // Headings
    const h = /^(#{1,6})\s+(.+)$/.exec(line);
    if (h) {
      flushPara();
      flushLists();
      const lvl = h[1]!.length;
      out.push(`<h${lvl}>${inlineMd(h[2]!)}</h${lvl}>`);
      continue;
    }
    // Lists
    const ul = /^[-*+]\s+(.+)$/.exec(line);
    const ol = /^\d+\.\s+(.+)$/.exec(line);
    if (ul) {
      flushPara();
      if (inOl) {
        out.push("</ol>");
        inOl = false;
      }
      if (!inUl) {
        out.push("<ul>");
        inUl = true;
      }
      out.push(`<li>${inlineMd(ul[1]!)}</li>`);
      continue;
    }
    if (ol) {
      flushPara();
      if (inUl) {
        out.push("</ul>");
        inUl = false;
      }
      if (!inOl) {
        out.push("<ol>");
        inOl = true;
      }
      out.push(`<li>${inlineMd(ol[1]!)}</li>`);
      continue;
    }
    // Blank line ends paragraph + lists
    if (!line.trim()) {
      flushPara();
      flushLists();
      continue;
    }
    para.push(line.trim());
  }
  flushPara();
  flushLists();
  if (inCode && codeBuf.length) {
    out.push(`<pre>${escapeHtml(codeBuf.join("\n"))}</pre>`);
  }
  return out.join("\n");
}

function inlineMd(s: string): string {
  // Order matters: escape, then unescape inline tags.
  let out = escapeHtml(s);
  out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/(^|[\s(])\*([^*]+)\*(?=[\s).,!?]|$)/g, "$1<em>$2</em>");
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  return out;
}
