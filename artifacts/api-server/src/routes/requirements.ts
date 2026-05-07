import { Router, type IRouter, type Request as ExpressRequest, type Response as ExpressResponse } from "express";
import { and, eq, ilike, or, inArray, desc, count, isNull } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import {
  db,
  requirementsTable,
  traceabilityLinksTable,
  codeArtifactsTable,
  activityEventsTable,
  projectsTable,
} from "@workspace/db";
import { insertRequirement } from "../lib/insertRequirement";
import {
  ListRequirementsQueryParams,
  CreateRequirementBody,
  GetRequirementParams,
  UpdateRequirementParams,
  UpdateRequirementBody,
  DeleteRequirementParams,
} from "@workspace/api-zod";
import { requireProjectAccessInline } from "../lib/projectAccess";
import { auditLog } from "../lib/auditLog";
import type { AuthedRequest } from "../lib/authContext";

const router: IRouter = Router();

async function withCounts(rows: typeof requirementsTable.$inferSelect[]) {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const counts = await db
    .select({
      requirementId: traceabilityLinksTable.requirementId,
      cnt: count(),
    })
    .from(traceabilityLinksTable)
    .where(inArray(traceabilityLinksTable.requirementId, ids))
    .groupBy(traceabilityLinksTable.requirementId);
  const map = new Map(counts.map((c) => [c.requirementId, Number(c.cnt)]));
  return rows.map((r) => ({ ...r, linkedCodeCount: map.get(r.id) ?? 0 }));
}

router.get("/requirements", async (req, res) => {
  const params = ListRequirementsQueryParams.parse(req.query);
  if (!params.projectId) {
    res.status(400).json({ error: "projectId is required" });
    return;
  }
  const access = await requireProjectAccessInline(req, res, params.projectId, "auditor");
  if (access === false) return;
  const sourceId = typeof req.query.sourceId === "string" ? req.query.sourceId : undefined;
  const externalSystem = typeof req.query.externalSystem === "string" ? req.query.externalSystem : undefined;
  const origin = typeof req.query.origin === "string" ? req.query.origin : undefined;
  const conds = [];
  if (params.projectId) conds.push(eq(requirementsTable.projectId, params.projectId));
  if (params.type) conds.push(eq(requirementsTable.type, params.type));
  if (params.status) conds.push(eq(requirementsTable.status, params.status));
  if (params.search) {
    const s = `%${params.search}%`;
    conds.push(or(ilike(requirementsTable.title, s), ilike(requirementsTable.code, s))!);
  }
  if (sourceId) conds.push(eq(requirementsTable.sourceId, sourceId));
  if (externalSystem) conds.push(eq(requirementsTable.externalSystem, externalSystem));
  if (origin === "manual") {
    conds.push(isNull(requirementsTable.sourceId));
  }
  const where = conds.length ? and(...conds) : undefined;
  const rows = await db
    .select()
    .from(requirementsTable)
    .where(where)
    .orderBy(desc(requirementsTable.updatedAt));
  res.json(await withCounts(rows));
});

// NOTE: /requirements/export must be registered BEFORE /requirements/:requirementId
// (Express matches routes in registration order). Handler implementation lives
// further down in this file alongside the buildReqIF / csv helpers.
router.get("/requirements/export", (req, res) => exportRequirementsHandler(req, res));

router.get("/requirements/:requirementId", async (req, res) => {
  const params = GetRequirementParams.parse(req.params);
  const [row] = await db
    .select()
    .from(requirementsTable)
    .where(eq(requirementsTable.id, params.requirementId));
  if (!row) {
    res.status(404).json({ error: "Requirement not found" });
    return;
  }
  const access = await requireProjectAccessInline(req, res, row.projectId, "auditor");
  if (access === false) return;
  const linkedCodeRows = await db
    .select({
      id: codeArtifactsTable.id,
      projectId: codeArtifactsTable.projectId,
      filePath: codeArtifactsTable.filePath,
      language: codeArtifactsTable.language,
      symbol: codeArtifactsTable.symbol,
      kind: codeArtifactsTable.kind,
      repoUrl: codeArtifactsTable.repoUrl,
    })
    .from(traceabilityLinksTable)
    .innerJoin(codeArtifactsTable, eq(codeArtifactsTable.id, traceabilityLinksTable.codeArtifactId))
    .where(eq(traceabilityLinksTable.requirementId, row.id));

  const [{ value: linkedCodeCount }] = await db
    .select({ value: count() })
    .from(traceabilityLinksTable)
    .where(eq(traceabilityLinksTable.requirementId, row.id));

  res.json({
    ...row,
    linkedCodeCount,
    linkedCode: linkedCodeRows.map((c) => ({ ...c, linkedRequirementCount: 0 })),
    children: [],
  });
});

router.post("/requirements", async (req, res) => {
  const body = CreateRequirementBody.parse(req.body);
  const access = await requireProjectAccessInline(req, res, body.projectId, "developer");
  if (access === false) return;

  const ws = (req as AuthedRequest).ws_ctx!;
  const now = new Date();
  const row = await insertRequirement(body.projectId, () => ({
    title: body.title,
    description: body.description ?? "",
    type: body.type,
    status: body.status ?? "draft",
    priority: body.priority ?? "medium",
    owner: body.owner ?? "Unassigned",
    tags: body.tags ?? [],
    linkedFrameworks: [],
    createdAt: now,
    updatedAt: now,
  }));

  await Promise.all([
    db.insert(activityEventsTable).values({
      id: randomUUID(),
      kind: "requirement",
      message: `New requirement created: ${row.title}`,
      actor: row.owner,
      entityCode: row.code,
      createdAt: now,
    }),
    auditLog(req, ws.workspace.id, ws.userId, ws.email, {
      action: "requirement.created",
      resourceType: "requirement",
      resourceId: row.id,
      metadata: {
        code: row.code,
        title: row.title,
        type: row.type,
        status: row.status,
        priority: row.priority,
        projectId: row.projectId,
      },
    }),
  ]);

  res.status(201).json({ ...row, linkedCodeCount: 0 });
});

router.patch("/requirements/:requirementId", async (req, res) => {
  const params = UpdateRequirementParams.parse(req.params);
  const body = UpdateRequirementBody.parse(req.body);
  const [target] = await db
    .select({ projectId: requirementsTable.projectId, title: requirementsTable.title, code: requirementsTable.code })
    .from(requirementsTable)
    .where(eq(requirementsTable.id, params.requirementId))
    .limit(1);
  if (!target) {
    res.status(404).json({ error: "Requirement not found" });
    return;
  }
  const access = await requireProjectAccessInline(req, res, target.projectId, "developer");
  if (access === false) return;

  const ws = (req as AuthedRequest).ws_ctx!;
  const updates: Partial<typeof requirementsTable.$inferInsert> = { updatedAt: new Date() };
  if (body.title !== undefined) updates.title = body.title;
  if (body.description !== undefined) updates.description = body.description;
  if (body.status !== undefined) updates.status = body.status;
  if (body.priority !== undefined) updates.priority = body.priority;
  if (body.owner !== undefined) updates.owner = body.owner;
  if (body.tags !== undefined) updates.tags = body.tags;
  const [row] = await db
    .update(requirementsTable)
    .set(updates)
    .where(eq(requirementsTable.id, params.requirementId))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Requirement not found" });
    return;
  }
  await Promise.all([
    db.insert(activityEventsTable).values({
      id: randomUUID(),
      kind: "requirement",
      message: `Updated requirement: ${row.title}`,
      actor: row.owner,
      entityCode: row.code,
    }),
    auditLog(req, ws.workspace.id, ws.userId, ws.email, {
      action: "requirement.updated",
      resourceType: "requirement",
      resourceId: row.id,
      metadata: {
        code: row.code,
        title: row.title,
        changes: Object.keys(updates).filter((k) => k !== "updatedAt"),
        projectId: row.projectId,
      },
    }),
  ]);

  const [{ value: linkedCodeCount }] = await db
    .select({ value: count() })
    .from(traceabilityLinksTable)
    .where(eq(traceabilityLinksTable.requirementId, row.id));
  res.json({ ...row, linkedCodeCount });
});

// ---------------------------------------------------------------------------
// Export requirements to RM-tool-compatible formats (ReqIF / CSV / JSON).
// All major RM tools (DOORS, DOORS Next, Jama, Polarion, codeBeamer, Helix RM,
// Visure, Azure DevOps) accept ReqIF natively; CSV is the universal fallback.
// ---------------------------------------------------------------------------
function xmlEscape(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function csvEscape(v: unknown): string {
  const s = String(v ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function safeFilename(s: string): string {
  return s.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 80) || "requirements";
}

function buildReqIF(opts: {
  projectName: string;
  rows: Array<typeof requirementsTable.$inferSelect>;
}): string {
  const now = new Date().toISOString();
  const headerId = `hdr-${randomUUID()}`;
  const specId = `SPEC-${randomUUID()}`;
  const attrs = [
    ["AD-CODE", "Code", "STRING"],
    ["AD-TITLE", "ReqIF.Name", "STRING"],
    ["AD-DESC", "ReqIF.Text", "XHTML"],
    ["AD-TYPE", "Type", "STRING"],
    ["AD-STATUS", "Status", "STRING"],
    ["AD-PRIORITY", "Priority", "STRING"],
    ["AD-OWNER", "Owner", "STRING"],
    ["AD-EXTID", "External ID", "STRING"],
  ] as const;

  const attrDefs = attrs
    .map(([id, name, kind]) => {
      const dt = kind === "XHTML" ? "DT-XHTML" : "DT-STR";
      const tag = kind === "XHTML" ? "ATTRIBUTE-DEFINITION-XHTML" : "ATTRIBUTE-DEFINITION-STRING";
      const ref = kind === "XHTML" ? "DATATYPE-DEFINITION-XHTML-REF" : "DATATYPE-DEFINITION-STRING-REF";
      return `        <${tag} IDENTIFIER="${id}" LONG-NAME="${xmlEscape(name)}"><TYPE><${ref}>${dt}</${ref}></TYPE></${tag}>`;
    })
    .join("\n");

  const specObjects = opts.rows
    .map((r) => {
      const oid = `RO-${r.id}`;
      const valueOf = (defId: string, kind: "STRING" | "XHTML", value: unknown) => {
        if (kind === "XHTML") {
          const inner = `<div xmlns="http://www.w3.org/1999/xhtml">${xmlEscape(value)}</div>`;
          return `          <ATTRIBUTE-VALUE-XHTML><DEFINITION><ATTRIBUTE-DEFINITION-XHTML-REF>${defId}</ATTRIBUTE-DEFINITION-XHTML-REF></DEFINITION><THE-VALUE>${inner}</THE-VALUE></ATTRIBUTE-VALUE-XHTML>`;
        }
        return `          <ATTRIBUTE-VALUE-STRING THE-VALUE="${xmlEscape(value)}"><DEFINITION><ATTRIBUTE-DEFINITION-STRING-REF>${defId}</ATTRIBUTE-DEFINITION-STRING-REF></DEFINITION></ATTRIBUTE-VALUE-STRING>`;
      };
      return `      <SPEC-OBJECT IDENTIFIER="${xmlEscape(oid)}" LAST-CHANGE="${xmlEscape(r.updatedAt instanceof Date ? r.updatedAt.toISOString() : now)}" LONG-NAME="${xmlEscape(r.code)}">
        <VALUES>
${valueOf("AD-CODE", "STRING", r.code)}
${valueOf("AD-TITLE", "STRING", r.title)}
${valueOf("AD-DESC", "XHTML", r.description ?? "")}
${valueOf("AD-TYPE", "STRING", r.type ?? "")}
${valueOf("AD-STATUS", "STRING", r.status ?? "")}
${valueOf("AD-PRIORITY", "STRING", r.priority ?? "")}
${valueOf("AD-OWNER", "STRING", r.owner ?? "")}
${valueOf("AD-EXTID", "STRING", r.externalId ?? "")}
        </VALUES>
        <TYPE><SPEC-OBJECT-TYPE-REF>OT-REQ</SPEC-OBJECT-TYPE-REF></TYPE>
      </SPEC-OBJECT>`;
    })
    .join("\n");

  const hierarchy = opts.rows
    .map(
      (r) =>
        `          <SPEC-HIERARCHY IDENTIFIER="SH-${xmlEscape(r.id)}" LAST-CHANGE="${xmlEscape(now)}" LONG-NAME="${xmlEscape(r.code)}"><OBJECT><SPEC-OBJECT-REF>RO-${xmlEscape(r.id)}</SPEC-OBJECT-REF></OBJECT></SPEC-HIERARCHY>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<REQ-IF xmlns="http://www.omg.org/spec/ReqIF/20110401/reqif.xsd" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <THE-HEADER>
    <REQ-IF-HEADER IDENTIFIER="${xmlEscape(headerId)}">
      <CREATION-TIME>${now}</CREATION-TIME>
      <REQ-IF-TOOL-ID>Auditee</REQ-IF-TOOL-ID>
      <REQ-IF-VERSION>1.0</REQ-IF-VERSION>
      <SOURCE-TOOL-ID>Auditee</SOURCE-TOOL-ID>
      <TITLE>${xmlEscape(opts.projectName)} — Requirements export</TITLE>
    </REQ-IF-HEADER>
  </THE-HEADER>
  <CORE-CONTENT>
    <REQ-IF-CONTENT>
      <DATATYPES>
        <DATATYPE-DEFINITION-STRING IDENTIFIER="DT-STR" LONG-NAME="String" MAX-LENGTH="32000" LAST-CHANGE="${now}"/>
        <DATATYPE-DEFINITION-XHTML IDENTIFIER="DT-XHTML" LONG-NAME="XHTML" LAST-CHANGE="${now}"/>
      </DATATYPES>
      <SPEC-TYPES>
        <SPEC-OBJECT-TYPE IDENTIFIER="OT-REQ" LONG-NAME="Requirement" LAST-CHANGE="${now}">
          <SPEC-ATTRIBUTES>
${attrDefs}
          </SPEC-ATTRIBUTES>
        </SPEC-OBJECT-TYPE>
        <SPECIFICATION-TYPE IDENTIFIER="ST-MAIN" LONG-NAME="Specification" LAST-CHANGE="${now}"/>
      </SPEC-TYPES>
      <SPEC-OBJECTS>
${specObjects}
      </SPEC-OBJECTS>
      <SPECIFICATIONS>
        <SPECIFICATION IDENTIFIER="${xmlEscape(specId)}" LAST-CHANGE="${now}" LONG-NAME="${xmlEscape(opts.projectName)} Requirements">
          <TYPE><SPECIFICATION-TYPE-REF>ST-MAIN</SPECIFICATION-TYPE-REF></TYPE>
          <CHILDREN>
${hierarchy}
          </CHILDREN>
        </SPECIFICATION>
      </SPECIFICATIONS>
    </REQ-IF-CONTENT>
  </CORE-CONTENT>
</REQ-IF>
`;
}

async function exportRequirementsHandler(req: ExpressRequest, res: ExpressResponse) {
  const projectId = typeof req.query.projectId === "string" ? req.query.projectId : "";
  const format = (typeof req.query.format === "string" ? req.query.format : "reqif").toLowerCase();
  if (!projectId) {
    res.status(400).json({ error: "projectId is required" });
    return;
  }
  if (!["reqif", "csv", "json"].includes(format)) {
    res.status(400).json({ error: "format must be one of: reqif, csv, json" });
    return;
  }
  const access = await requireProjectAccessInline(req, res, projectId, "auditor");
  if (access === false) return;

  const [project] = await db
    .select({ name: projectsTable.name, slug: projectsTable.slug })
    .from(projectsTable)
    .where(eq(projectsTable.id, projectId))
    .limit(1);
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const rows = await db
    .select()
    .from(requirementsTable)
    .where(eq(requirementsTable.projectId, projectId))
    .orderBy(requirementsTable.code);

  const baseName = safeFilename(`${project.slug || project.name}-requirements`);

  if (format === "json") {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${baseName}.json"`);
    res.json({
      project: { id: projectId, name: project.name, slug: project.slug },
      exportedAt: new Date().toISOString(),
      count: rows.length,
      requirements: rows,
    });
    return;
  }

  if (format === "csv") {
    const header = [
      "Code",
      "Title",
      "Description",
      "Type",
      "Status",
      "Priority",
      "Owner",
      "ExternalSystem",
      "ExternalId",
      "ExternalUrl",
      "SourceId",
      "CreatedAt",
      "UpdatedAt",
    ];
    const lines = [header.join(",")];
    for (const r of rows) {
      lines.push(
        [
          r.code,
          r.title,
          r.description ?? "",
          r.type ?? "",
          r.status ?? "",
          r.priority ?? "",
          r.owner ?? "",
          r.externalSystem ?? "",
          r.externalId ?? "",
          r.externalUrl ?? "",
          r.sourceId ?? "",
          r.createdAt instanceof Date ? r.createdAt.toISOString() : "",
          r.updatedAt instanceof Date ? r.updatedAt.toISOString() : "",
        ]
          .map(csvEscape)
          .join(","),
      );
    }
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${baseName}.csv"`);
    res.send(lines.join("\r\n") + "\r\n");
    return;
  }

  // ReqIF
  const xml = buildReqIF({ projectName: project.name, rows });
  res.setHeader("Content-Type", "application/reqif+xml; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${baseName}.reqif"`);
  res.send(xml);
}

router.delete("/requirements/:requirementId", async (req, res) => {
  const params = DeleteRequirementParams.parse(req.params);
  const [target] = await db
    .select({ projectId: requirementsTable.projectId, title: requirementsTable.title, code: requirementsTable.code })
    .from(requirementsTable)
    .where(eq(requirementsTable.id, params.requirementId))
    .limit(1);
  if (!target) {
    // Already gone — treat as success for idempotency.
    res.status(204).end();
    return;
  }
  const access = await requireProjectAccessInline(req, res, target.projectId, "developer");
  if (access === false) return;

  const ws = (req as AuthedRequest).ws_ctx!;
  await db
    .delete(traceabilityLinksTable)
    .where(eq(traceabilityLinksTable.requirementId, params.requirementId));
  await db.delete(requirementsTable).where(eq(requirementsTable.id, params.requirementId));

  // Fire-and-forget audit entry after the delete so the row ID is still
  // captured even though the requirement record is gone.
  void auditLog(req, ws.workspace.id, ws.userId, ws.email, {
    action: "requirement.deleted",
    resourceType: "requirement",
    resourceId: params.requirementId,
    metadata: {
      code: target.code,
      title: target.title,
      projectId: target.projectId,
    },
  });

  res.status(204).end();
});

export default router;
