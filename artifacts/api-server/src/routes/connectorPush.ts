// Write-back endpoints for Jira / Azure DevOps Boards (work items) and
// Confluence / SharePoint (document push). Front-end surfaces:
//   - CAPA row "Create issue" → /api/connector-push/work-item
//   - Reports row  "Publish to…" → /api/connector-push/document
//   - Both pickers fetch eligible targets from /api/connector-push/targets
import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, projectSourcesTable, activityEventsTable } from "@workspace/db";
import { randomUUID } from "node:crypto";
import { requireProjectAccessInline } from "../lib/projectAccess";
import {
  pushJiraIssue,
  pushAdoWorkItem,
  pushConfluencePage,
  pushSharepointDocument,
} from "../lib/connector-push.js";

const router: IRouter = Router();

const WORK_ITEM_KINDS = new Set(["jira", "jira_reqs", "jira_defects", "alm", "azure_devops", "ado_defects"]);
const DOCUMENT_KINDS = new Set(["confluence", "sharepoint"]);

function targetVendor(kind: string): "jira" | "ado" | "confluence" | "sharepoint" | null {
  if (kind === "jira" || kind === "jira_reqs" || kind === "jira_defects") return "jira";
  if (kind === "alm" || kind === "azure_devops" || kind === "ado_defects") return "ado";
  if (kind === "confluence") return "confluence";
  if (kind === "sharepoint") return "sharepoint";
  return null;
}

// GET /connector-push/targets?projectId=&type=workitem|document
router.get("/connector-push/targets", async (req, res) => {
  const projectId = typeof req.query.projectId === "string" ? req.query.projectId : "";
  const type = typeof req.query.type === "string" ? req.query.type : "";
  if (!projectId) {
    res.status(400).json({ error: "projectId is required" });
    return;
  }
  const access = await requireProjectAccessInline(req, res, projectId, "auditor");
  if (access === false) return;
  const allowed = type === "document" ? DOCUMENT_KINDS : WORK_ITEM_KINDS;
  const rows = await db
    .select()
    .from(projectSourcesTable)
    .where(eq(projectSourcesTable.projectId, projectId));
  const targets = rows
    .filter((r) => allowed.has(r.kind))
    .map((r) => ({
      id: r.id,
      kind: r.kind,
      label: r.label,
      vendor: targetVendor(r.kind),
    }));
  res.json({ targets });
});

const workItemBody = z.object({
  sourceId: z.string().uuid(),
  title: z.string().min(1).max(250),
  description: z.string().max(30000).default(""),
  type: z.string().max(40).optional(),
  priority: z.enum(["critical", "high", "medium", "low"]).optional(),
  labels: z.array(z.string().max(60)).max(20).optional(),
});

router.post("/connector-push/work-item", async (req, res) => {
  const parsed = workItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid body" });
    return;
  }
  const body = parsed.data;
  const [src] = await db
    .select()
    .from(projectSourcesTable)
    .where(eq(projectSourcesTable.id, body.sourceId))
    .limit(1);
  if (!src) {
    res.status(404).json({ error: "Source not found" });
    return;
  }
  const access = await requireProjectAccessInline(req, res, src.projectId, "developer");
  if (access === false) return;
  const vendor = targetVendor(src.kind);
  if (vendor !== "jira" && vendor !== "ado") {
    res.status(400).json({ error: `Source kind "${src.kind}" does not support work-item push` });
    return;
  }
  try {
    const cfg = (src.config ?? {}) as Record<string, any>;
    const result =
      vendor === "jira"
        ? await pushJiraIssue(cfg, body)
        : await pushAdoWorkItem(cfg, body);
    await db.insert(activityEventsTable).values({
      id: randomUUID(),
      kind: "source",
      message: `Work item created in ${src.label}: ${result.externalId} — ${body.title.slice(0, 80)}`,
      actor: "avery.kim",
      entityCode: src.id,
    });
    res.status(201).json({ url: result.url, externalId: result.externalId, vendor });
  } catch (err: any) {
    req.log?.warn?.({ err: err.message }, "connector-push work-item failed");
    res.status(502).json({ error: err.message ?? "Push failed" });
  }
});

const documentBody = z.object({
  sourceId: z.string().uuid(),
  title: z.string().min(1).max(240),
  markdown: z.string().min(1).max(500_000),
});

router.post("/connector-push/document", async (req, res) => {
  const parsed = documentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid body" });
    return;
  }
  const body = parsed.data;
  const [src] = await db
    .select()
    .from(projectSourcesTable)
    .where(eq(projectSourcesTable.id, body.sourceId))
    .limit(1);
  if (!src) {
    res.status(404).json({ error: "Source not found" });
    return;
  }
  const access = await requireProjectAccessInline(req, res, src.projectId, "developer");
  if (access === false) return;
  const vendor = targetVendor(src.kind);
  if (vendor !== "confluence" && vendor !== "sharepoint") {
    res.status(400).json({ error: `Source kind "${src.kind}" does not support document push` });
    return;
  }
  try {
    const cfg = (src.config ?? {}) as Record<string, any>;
    const result =
      vendor === "confluence"
        ? await pushConfluencePage(cfg, body)
        : await pushSharepointDocument(cfg, body);
    await db.insert(activityEventsTable).values({
      id: randomUUID(),
      kind: "source",
      message: `Document published to ${src.label}: ${body.title.slice(0, 100)}`,
      actor: "avery.kim",
      entityCode: src.id,
    });
    res.status(201).json({ url: result.url, externalId: result.externalId, vendor });
  } catch (err: any) {
    req.log?.warn?.({ err: err.message }, "connector-push document failed");
    res.status(502).json({ error: err.message ?? "Push failed" });
  }
});

export default router;
