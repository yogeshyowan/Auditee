import { Router, type IRouter } from "express";
import multer from "multer";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db, projectSourcesTable, sourceFilesTable, activityEventsTable, requirementsTable, defectsTable } from "@workspace/db";
import { ingestZipBuffer, ingestGithub, ingestRemoteSystem, persistFiles, type IngestedFile } from "../lib/source-ingestion.js";
import { deleteSourceChunks } from "../lib/rag.js";
import { ingestRequirementsTool, ingestReqifBuffer, isRmKind, RM_KINDS } from "../lib/rm-ingestion.js";
import { ingestDefectsTool, isDefectKind, DEFECT_KINDS } from "../lib/defect-ingestion.js";
import { requireProjectAccessInline } from "../lib/projectAccess";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } }); // 100 MB
const router: IRouter = Router();

const CODE_KINDS = ["github", "zip", "folder", "jira", "jenkins", "aws_s3", "gdrive", "alm", "cloud_server", "url"];
const SUPPORTED_KINDS = [...CODE_KINDS, ...RM_KINDS, ...DEFECT_KINDS];

// Strip secrets from config before returning to the client.
function safeConfig(kind: string, cfg: Record<string, any>): Record<string, any> {
  const out = { ...cfg };
  for (const k of ["token", "secretAccessKey", "apiKey", "password", "sshKey", "pat", "clientSecret"]) {
    if (out[k]) out[k] = "•••";
  }
  return out;
}

router.get("/sources", async (req, res) => {
  const projectId = typeof req.query.projectId === "string" ? req.query.projectId : undefined;
  if (!projectId) {
    res.status(400).json({ error: "projectId is required" });
    return;
  }
  const access = await requireProjectAccessInline(req, res, projectId, "auditor");
  if (access === false) return;
  const rows = await db
    .select()
    .from(projectSourcesTable)
    .where(eq(projectSourcesTable.projectId, projectId))
    .orderBy(desc(projectSourcesTable.createdAt));
  res.json({
    sources: rows.map((r) => ({ ...r, config: safeConfig(r.kind, r.config) })),
  });
});

router.post("/sources", async (req, res) => {
  const b = req.body ?? {};
  if (!b.projectId || typeof b.projectId !== "string") {
    res.status(400).json({ error: "projectId required" });
    return;
  }
  const access = await requireProjectAccessInline(req, res, b.projectId, "developer");
  if (access === false) return;
  if (!SUPPORTED_KINDS.includes(b.kind)) {
    res.status(400).json({ error: `kind must be one of ${SUPPORTED_KINDS.join(", ")}` });
    return;
  }
  const id = randomUUID();
  const [row] = await db
    .insert(projectSourcesTable)
    .values({
      id,
      projectId: b.projectId,
      kind: b.kind,
      label: typeof b.label === "string" && b.label.trim() ? b.label.slice(0, 240) : `${b.kind} source`,
      config: typeof b.config === "object" && b.config ? b.config : {},
      status: "idle",
    })
    .returning();
  await db.insert(activityEventsTable).values({
    id: randomUUID(),
    kind: "source",
    message: `Source connected: ${row.label} (${row.kind})`,
    actor: "avery.kim",
    entityCode: row.id,
  });
  res.status(201).json({ ...row, config: safeConfig(row.kind, row.config) });
});

router.delete("/sources/:id", async (req, res) => {
  const [src] = await db
    .select({ projectId: projectSourcesTable.projectId })
    .from(projectSourcesTable)
    .where(eq(projectSourcesTable.id, req.params.id!))
    .limit(1);
  if (src) {
    const access = await requireProjectAccessInline(req, res, src.projectId, "developer");
    if (access === false) return;
  }
  // Delete source content + manifests, and unlink any imported requirements
  // (we keep the requirements but null out the FK so the user doesn't lose
  // them if they were already in use by traceability links).
  // Defects, on the other hand, are deleted outright — they only have value
  // when paired with a live source connection (they re-import on next sync).
  await db.delete(sourceFilesTable).where(eq(sourceFilesTable.sourceId, req.params.id!));
  await deleteSourceChunks([req.params.id!]);
  await db
    .update(requirementsTable)
    .set({ sourceId: null, externalSystem: null })
    .where(eq(requirementsTable.sourceId, req.params.id!));
  await db.delete(defectsTable).where(eq(defectsTable.sourceId, req.params.id!));
  await db.delete(projectSourcesTable).where(eq(projectSourcesTable.id, req.params.id!));
  res.status(204).end();
});

// Sync (re-ingest) — for github / remote-system kinds.
router.post("/sources/:id/sync", async (req, res) => {
  const [src] = await db.select().from(projectSourcesTable).where(eq(projectSourcesTable.id, req.params.id!));
  if (!src) {
    res.status(404).json({ error: "source not found" });
    return;
  }
  const access = await requireProjectAccessInline(req, res, src.projectId, "developer");
  if (access === false) return;
  await db.update(projectSourcesTable).set({ status: "syncing", statusMessage: "Sync started", updatedAt: new Date() }).where(eq(projectSourcesTable.id, src.id));
  try {
    let result: { count: number; bytes: number; summary?: string };
    if (src.kind === "github") {
      result = await ingestGithub(src.id, src.config as any);
    } else if (src.kind === "zip" || src.kind === "folder") {
      res.status(400).json({ error: "Re-upload to re-sync zip/folder sources" });
      return;
    } else if (src.kind === "reqif") {
      res.status(400).json({ error: "Re-upload the .reqif file to re-sync" });
      return;
    } else if (isRmKind(src.kind)) {
      result = await ingestRequirementsTool(src.id, src.projectId, src.kind, src.config as any);
    } else if (isDefectKind(src.kind)) {
      result = await ingestDefectsTool(src.id, src.projectId, src.kind, src.config as any);
    } else {
      result = await ingestRemoteSystem(src.id, src.kind, src.config as any);
    }
    const [updated] = await db.select().from(projectSourcesTable).where(eq(projectSourcesTable.id, src.id));
    res.json({ ...updated, config: safeConfig(updated.kind, updated.config), syncResult: result });
  } catch (err: any) {
    await db
      .update(projectSourcesTable)
      .set({ status: "error", statusMessage: err.message?.slice(0, 500) ?? "Sync failed", updatedAt: new Date() })
      .where(eq(projectSourcesTable.id, src.id));
    res.status(502).json({ error: err.message ?? "Sync failed" });
  }
});

// Upload a ZIP file. Field name: "file". Source row is created in the same request.
router.post("/sources/upload-zip", upload.single("file"), async (req, res) => {
  const projectId = req.body?.projectId;
  const label = req.body?.label || req.file?.originalname || "ZIP upload";
  if (!projectId || !req.file) {
    res.status(400).json({ error: "projectId and file are required" });
    return;
  }
  const accessZip = await requireProjectAccessInline(req, res, projectId, "developer");
  if (accessZip === false) return;
  const id = randomUUID();
  await db.insert(projectSourcesTable).values({
    id,
    projectId,
    kind: "zip",
    label: String(label).slice(0, 240),
    config: { originalName: req.file.originalname, sizeBytes: req.file.size },
    status: "syncing",
  });
  try {
    const result = await ingestZipBuffer(id, req.file.buffer);
    const [row] = await db.select().from(projectSourcesTable).where(eq(projectSourcesTable.id, id));
    await db.insert(activityEventsTable).values({
      id: randomUUID(),
      kind: "source",
      message: `ZIP ingested: ${row.label} — ${result.count} files`,
      actor: "avery.kim",
      entityCode: id,
    });
    res.status(201).json({ ...row, config: safeConfig(row.kind, row.config), syncResult: result });
  } catch (err: any) {
    await db
      .update(projectSourcesTable)
      .set({ status: "error", statusMessage: err.message?.slice(0, 500) ?? "Extract failed" })
      .where(eq(projectSourcesTable.id, id));
    res.status(400).json({ error: err.message ?? "Could not extract zip" });
  }
});

// Upload a folder (multiple files). Field name: "files[]" (or "files").
// Each file's relative path is read from req.body.paths[i] (sent in the same order).
router.post("/sources/upload-folder", upload.array("files", 1000), async (req, res) => {
  const projectId = req.body?.projectId;
  const label = req.body?.label || "Folder upload";
  const files = (req.files as Express.Multer.File[]) ?? [];
  let paths: string[] = [];
  if (typeof req.body?.paths === "string") {
    try { paths = JSON.parse(req.body.paths); } catch { paths = []; }
  } else if (Array.isArray(req.body?.paths)) {
    paths = req.body.paths;
  }
  if (!projectId || files.length === 0) {
    res.status(400).json({ error: "projectId and files are required" });
    return;
  }
  const accessFolder = await requireProjectAccessInline(req, res, projectId, "developer");
  if (accessFolder === false) return;
  const id = randomUUID();
  await db.insert(projectSourcesTable).values({
    id,
    projectId,
    kind: "folder",
    label: String(label).slice(0, 240),
    config: { fileCount: files.length },
    status: "syncing",
  });
  try {
    const ingested: IngestedFile[] = files.map((f, i) => ({
      path: paths[i] || f.originalname,
      size: f.size,
      content: f.buffer,
    }));
    const result = await persistFiles(id, ingested);
    const [row] = await db.select().from(projectSourcesTable).where(eq(projectSourcesTable.id, id));
    await db.insert(activityEventsTable).values({
      id: randomUUID(),
      kind: "source",
      message: `Folder uploaded: ${row.label} — ${result.count} files`,
      actor: "avery.kim",
      entityCode: id,
    });
    res.status(201).json({ ...row, config: safeConfig(row.kind, row.config), syncResult: result });
  } catch (err: any) {
    await db.update(projectSourcesTable).set({ status: "error", statusMessage: err.message?.slice(0, 500) ?? "Indexing failed" }).where(eq(projectSourcesTable.id, id));
    res.status(400).json({ error: err.message ?? "Could not index files" });
  }
});

// List files for a source.
router.get("/sources/:id/files", async (req, res) => {
  const [src] = await db
    .select({ projectId: projectSourcesTable.projectId })
    .from(projectSourcesTable)
    .where(eq(projectSourcesTable.id, req.params.id!))
    .limit(1);
  if (!src) {
    res.status(404).json({ error: "source not found" });
    return;
  }
  const access = await requireProjectAccessInline(req, res, src.projectId, "auditor");
  if (access === false) return;
  const limit = Math.min(Number(req.query.limit) || 500, 2000);
  const rows = await db
    .select({
      id: sourceFilesTable.id,
      path: sourceFilesTable.path,
      size: sourceFilesTable.size,
      language: sourceFilesTable.language,
      isBinary: sourceFilesTable.isBinary,
    })
    .from(sourceFilesTable)
    .where(eq(sourceFilesTable.sourceId, req.params.id!))
    .orderBy(asc(sourceFilesTable.path))
    .limit(limit);
  const [{ totalSize }] = await db
    .select({ totalSize: sql<number>`coalesce(sum(${sourceFilesTable.size}),0)` })
    .from(sourceFilesTable)
    .where(eq(sourceFilesTable.sourceId, req.params.id!));
  res.json({ files: rows, totals: { count: rows.length, bytes: Number(totalSize) } });
});

// Fetch a single file's content.
router.get("/sources/:id/files/:fileId", async (req, res) => {
  const [src] = await db
    .select({ projectId: projectSourcesTable.projectId })
    .from(projectSourcesTable)
    .where(eq(projectSourcesTable.id, req.params.id!))
    .limit(1);
  if (!src) {
    res.status(404).json({ error: "source not found" });
    return;
  }
  const access = await requireProjectAccessInline(req, res, src.projectId, "auditor");
  if (access === false) return;
  const [row] = await db
    .select()
    .from(sourceFilesTable)
    .where(and(eq(sourceFilesTable.sourceId, req.params.id!), eq(sourceFilesTable.id, req.params.fileId!)));
  if (!row) {
    res.status(404).json({ error: "file not found" });
    return;
  }
  res.json(row);
});

// Upload a ReqIF (or .reqifz) export from any RM tool. Field name: "file".
// Creates a `reqif` source row + parses + inserts requirements in one shot.
router.post("/sources/upload-reqif", upload.single("file"), async (req, res) => {
  const projectId = req.body?.projectId;
  const label = req.body?.label || req.file?.originalname || "ReqIF import";
  if (!projectId || !req.file) {
    res.status(400).json({ error: "projectId and file are required" });
    return;
  }
  const accessReqif = await requireProjectAccessInline(req, res, projectId, "developer");
  if (accessReqif === false) return;
  const id = randomUUID();
  await db.insert(projectSourcesTable).values({
    id,
    projectId,
    kind: "reqif",
    label: String(label).slice(0, 240),
    config: { originalName: req.file.originalname, sizeBytes: req.file.size },
    status: "syncing",
  });
  try {
    const result = await ingestReqifBuffer(id, projectId, req.file.buffer);
    const [row] = await db.select().from(projectSourcesTable).where(eq(projectSourcesTable.id, id));
    await db.insert(activityEventsTable).values({
      id: randomUUID(),
      kind: "source",
      message: `ReqIF imported: ${row.label} — ${result.count} requirements`,
      actor: "avery.kim",
      entityCode: id,
    });
    res.status(201).json({ ...row, config: safeConfig(row.kind, row.config), syncResult: result });
  } catch (err: any) {
    res.status(400).json({ error: err.message ?? "Could not parse ReqIF" });
  }
});

export default router;
