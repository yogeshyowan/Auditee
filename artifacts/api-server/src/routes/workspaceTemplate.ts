import { Router, type IRouter, type Request } from "express";
import multer from "multer";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db, workspaceTemplatesTable } from "@workspace/db";
import { requireAuth, requireWorkspace, type WorkspaceCtx } from "../lib/authContext";
import { isAtLeast } from "../lib/permissions";
import { auditLog } from "../lib/auditLog";
import { buildSampleTemplate } from "../lib/companyTemplate";

const router: IRouter = Router();

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const isDocx =
      file.mimetype === DOCX_MIME ||
      file.originalname.toLowerCase().endsWith(".docx");
    if (!isDocx) {
      cb(new Error("Only .docx files are accepted"));
      return;
    }
    cb(null, true);
  },
});

function getCtx(req: Request): WorkspaceCtx {
  return (req as Request & { ws_ctx: WorkspaceCtx }).ws_ctx;
}

router.get(
  "/workspace/template",
  requireAuth,
  requireWorkspace,
  async (req, res) => {
    const ctx = getCtx(req);
    const [row] = await db
      .select({
        id: workspaceTemplatesTable.id,
        workspaceId: workspaceTemplatesTable.workspaceId,
        fileName: workspaceTemplatesTable.fileName,
        mimeType: workspaceTemplatesTable.mimeType,
        fileSize: workspaceTemplatesTable.fileSize,
        uploadedBy: workspaceTemplatesTable.uploadedBy,
        uploadedAt: workspaceTemplatesTable.uploadedAt,
      })
      .from(workspaceTemplatesTable)
      .where(eq(workspaceTemplatesTable.workspaceId, ctx.workspace.id));
    res.json({ template: row ?? null });
  },
);

router.get(
  "/workspace/template/file",
  requireAuth,
  requireWorkspace,
  async (req, res) => {
    const ctx = getCtx(req);
    const [row] = await db
      .select()
      .from(workspaceTemplatesTable)
      .where(eq(workspaceTemplatesTable.workspaceId, ctx.workspace.id));
    if (!row) {
      res.status(404).json({ error: "No company template uploaded" });
      return;
    }
    // RFC 5987: ASCII fallback (filename=) + percent-encoded UTF-8 (filename*=)
    // protects against header injection and supports non-ASCII names.
    const asciiName = row.fileName.replace(/[^\w.\-]+/g, "_").slice(0, 100) || "template.docx";
    const utf8Name = encodeURIComponent(row.fileName);
    res.setHeader("Content-Type", row.mimeType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${asciiName}"; filename*=UTF-8''${utf8Name}`,
    );
    res.send(row.fileBytes);
  },
);

router.get("/workspace/template/sample", async (_req, res) => {
  const buf = await buildSampleTemplate();
  res.setHeader("Content-Type", DOCX_MIME);
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="auditee-company-template-sample.docx"`,
  );
  res.send(buf);
});

router.post(
  "/workspace/template",
  requireAuth,
  requireWorkspace,
  upload.single("file"),
  async (req, res) => {
    const ctx = getCtx(req);
    if (!isAtLeast(ctx.role, "admin")) {
      res.status(403).json({ error: "Only workspace admins or owners can upload a template" });
      return;
    }
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: "Missing file (form-data field 'file')" });
      return;
    }
    // Quick sanity: docx is a zip starting with PK
    if (file.buffer[0] !== 0x50 || file.buffer[1] !== 0x4b) {
      res.status(400).json({ error: "File does not look like a valid .docx archive" });
      return;
    }

    // Upsert: one template per workspace
    const id = randomUUID();
    const existing = await db
      .select({ id: workspaceTemplatesTable.id })
      .from(workspaceTemplatesTable)
      .where(eq(workspaceTemplatesTable.workspaceId, ctx.workspace.id));

    if (existing.length) {
      await db
        .update(workspaceTemplatesTable)
        .set({
          fileName: file.originalname,
          mimeType: DOCX_MIME,
          fileBytes: file.buffer,
          fileSize: file.size,
          uploadedBy: ctx.userId,
          uploadedAt: new Date(),
        })
        .where(eq(workspaceTemplatesTable.workspaceId, ctx.workspace.id));
    } else {
      await db.insert(workspaceTemplatesTable).values({
        id,
        workspaceId: ctx.workspace.id,
        fileName: file.originalname,
        mimeType: DOCX_MIME,
        fileBytes: file.buffer,
        fileSize: file.size,
        uploadedBy: ctx.userId,
      });
    }

    await auditLog({
      workspaceId: ctx.workspace.id,
      actorUserId: ctx.userId,
      actorEmail: ctx.email,
      action: existing.length ? "company_template.replace" : "company_template.upload",
      resourceType: "workspace_template",
      resourceId: ctx.workspace.id,
      metadata: { fileName: file.originalname, size: file.size },
      req,
    });

    res.json({ ok: true, fileName: file.originalname, fileSize: file.size });
  },
);

router.delete(
  "/workspace/template",
  requireAuth,
  requireWorkspace,
  async (req, res) => {
    const ctx = getCtx(req);
    if (!isAtLeast(ctx.role, "admin")) {
      res.status(403).json({ error: "Only workspace admins or owners can remove the template" });
      return;
    }
    await db
      .delete(workspaceTemplatesTable)
      .where(eq(workspaceTemplatesTable.workspaceId, ctx.workspace.id));
    await auditLog({
      workspaceId: ctx.workspace.id,
      actorUserId: ctx.userId,
      action: "company_template.delete",
      target: ctx.workspace.id,
    });
    res.json({ ok: true });
  },
);

export default router;
