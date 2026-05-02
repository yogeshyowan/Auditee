import { Router, type IRouter } from "express";
import multer from "multer";
import { and, asc, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import {
  db,
  complianceFrameworksTable,
  complianceControlsTable,
} from "@workspace/db";
import { requireAuth, requireWorkspace, type AuthedRequest } from "../lib/authContext";
import {
  extractTextFromUpload,
  extractFrameworkFromText,
  UnsupportedStandardFormatError,
  EmptyStandardError,
} from "../lib/standardExtractor";
import { logActivity } from "../lib/activityLog";
import { logger } from "../lib/logger";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
});

const router: IRouter = Router();

/**
 * GET /api/standards
 * List the workspace's uploaded standards (NOT the seeded ones — those are
 * already returned by /api/compliance/frameworks). Includes control count so
 * the UI can render "47 controls extracted" without an extra round-trip.
 */
router.get("/standards", requireAuth, requireWorkspace, async (req, res) => {
  const ctx = (req as AuthedRequest).ws_ctx!;
  const rows = await db
    .select()
    .from(complianceFrameworksTable)
    .where(
      and(
        eq(complianceFrameworksTable.workspaceId, ctx.workspace.id),
        eq(complianceFrameworksTable.source, "uploaded"),
      ),
    )
    .orderBy(asc(complianceFrameworksTable.uploadedAt));
  res.json({ standards: rows });
});

/**
 * POST /api/standards/upload  (multipart/form-data: file)
 * Pipeline:
 *   1. Multer captures the file in memory (≤25 MB)
 *   2. extractTextFromUpload → plain text via pdf-parse / mammoth / utf8
 *   3. extractFrameworkFromText → AI-driven structured controls
 *   4. Insert framework row (workspace-scoped) + every control row
 *   5. Return the new framework so the UI can navigate to it
 */
router.post(
  "/standards/upload",
  requireAuth,
  requireWorkspace,
  upload.single("file"),
  async (req, res) => {
    const ctx = (req as AuthedRequest).ws_ctx!;
    const file = (req as any).file as
      | { buffer: Buffer; mimetype: string; originalname: string; size: number }
      | undefined;
    if (!file) {
      res.status(400).json({ error: "No file uploaded. Attach a PDF, DOCX or TXT under field 'file'." });
      return;
    }

    let rawText: string;
    try {
      rawText = await extractTextFromUpload(file.buffer, file.mimetype, file.originalname);
    } catch (err) {
      if (err instanceof UnsupportedStandardFormatError) {
        res.status(400).json({ error: err.message });
        return;
      }
      logger.error({ err, filename: file.originalname }, "Text extraction failed");
      res.status(422).json({ error: "Could not read the uploaded file." });
      return;
    }

    let extracted;
    try {
      extracted = await extractFrameworkFromText(rawText, file.originalname);
    } catch (err) {
      if (err instanceof EmptyStandardError) {
        res.status(422).json({ error: err.message });
        return;
      }
      const message = err instanceof Error ? err.message : "AI extraction failed.";
      logger.error({ err, filename: file.originalname }, "AI standard extraction failed");
      res.status(502).json({ error: message });
      return;
    }

    const frameworkId = `wfw-${randomUUID()}`;
    const now = new Date();
    try {
      await db.transaction(async (tx) => {
        await tx.insert(complianceFrameworksTable).values({
          id: frameworkId,
          code: extracted.code,
          name: extracted.name,
          category: extracted.category,
          status: "in_progress",
          score: 0,
          controlsTotal: extracted.controls.length,
          workspaceId: ctx.workspace.id,
          source: "uploaded",
          description: extracted.description,
          originalFilename: file.originalname,
          uploadedBy: ctx.userId,
          uploadedAt: now,
        });
        const controlRows = extracted.controls.map((c) => ({
          id: `ctl-${randomUUID()}`,
          frameworkId,
          code: c.code,
          title: c.title,
          description: c.description,
          status: "gap",
          owner: "Unassigned",
          evidenceCount: 0,
          assertion: null,
        }));
        if (controlRows.length > 0) {
          await tx.insert(complianceControlsTable).values(controlRows);
        }
      });
    } catch (err) {
      logger.error({ err, frameworkId }, "Standard persistence failed");
      res.status(500).json({ error: "Failed to save the extracted standard." });
      return;
    }

    await logActivity(
      "compliance",
      `Uploaded custom standard "${extracted.name}" (${extracted.controls.length} controls extracted)`,
      ctx.email ?? "user",
      extracted.code,
    );

    res.json({
      id: frameworkId,
      code: extracted.code,
      name: extracted.name,
      category: extracted.category,
      description: extracted.description,
      controlsTotal: extracted.controls.length,
      originalFilename: file.originalname,
      uploadedAt: now.toISOString(),
    });
  },
);

/**
 * DELETE /api/standards/:id
 * Workspace-scoped deletion — only the workspace that uploaded the standard
 * may delete it. Cascades to its control rows. Seeded standards are immutable.
 */
router.delete("/standards/:id", requireAuth, requireWorkspace, async (req, res) => {
  const ctx = (req as AuthedRequest).ws_ctx!;
  const id = String(req.params.id ?? "");
  if (!id) {
    res.status(400).json({ error: "id required" });
    return;
  }
  const [row] = await db
    .select()
    .from(complianceFrameworksTable)
    .where(eq(complianceFrameworksTable.id, id));
  if (!row) {
    res.status(404).json({ error: "Standard not found" });
    return;
  }
  if (row.source !== "uploaded" || row.workspaceId !== ctx.workspace.id) {
    res.status(403).json({ error: "Cannot delete this standard." });
    return;
  }
  await db.transaction(async (tx) => {
    await tx
      .delete(complianceControlsTable)
      .where(eq(complianceControlsTable.frameworkId, id));
    await tx
      .delete(complianceFrameworksTable)
      .where(eq(complianceFrameworksTable.id, id));
  });
  await logActivity(
    "compliance",
    `Deleted custom standard "${row.name}"`,
    ctx.email ?? "user",
    row.code,
  );
  res.status(204).end();
});

export default router;
