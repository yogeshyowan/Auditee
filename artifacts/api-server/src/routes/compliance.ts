import { Router, type IRouter } from "express";
import { and, count, desc, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import {
  db,
  complianceFrameworksTable,
  complianceControlsTable,
  complianceEvidenceTable,
} from "@workspace/db";
import { GetComplianceFrameworkParams } from "@workspace/api-zod";
import { assertProjectAccessIfAuthed } from "../lib/projectAccess";
import { logActivity } from "../lib/activityLog";
import { getAuth } from "@clerk/express";

const router: IRouter = Router();

router.get("/compliance/frameworks", async (_req, res) => {
  const frameworks = await db.select().from(complianceFrameworksTable);
  const out = await Promise.all(
    frameworks.map(async (f) => {
      const [{ value: met }] = await db
        .select({ value: count() })
        .from(complianceControlsTable)
        .where(
          and(
            eq(complianceControlsTable.frameworkId, f.id),
            eq(complianceControlsTable.status, "met"),
          ),
        );
      return { ...f, controlsMet: Number(met) };
    }),
  );
  res.json(out);
});

router.get("/compliance/frameworks/:frameworkId", async (req, res) => {
  const params = GetComplianceFrameworkParams.parse(req.params);
  const [framework] = await db
    .select()
    .from(complianceFrameworksTable)
    .where(eq(complianceFrameworksTable.id, params.frameworkId));
  if (!framework) {
    res.status(404).json({ error: "Framework not found" });
    return;
  }
  const controls = await db
    .select()
    .from(complianceControlsTable)
    .where(eq(complianceControlsTable.frameworkId, framework.id));
  const [{ value: met }] = await db
    .select({ value: count() })
    .from(complianceControlsTable)
    .where(
      and(
        eq(complianceControlsTable.frameworkId, framework.id),
        eq(complianceControlsTable.status, "met"),
      ),
    );
  // For each control, count "verified" evidence rows so the UI can render
  // the Met-Verified vs Met-AI distinction without an extra round-trip.
  const evidenceCounts = await Promise.all(
    controls.map(async (c) => {
      const [verified] = await db
        .select({ value: count() })
        .from(complianceEvidenceTable)
        .where(
          and(
            eq(complianceEvidenceTable.controlId, c.id),
            eq(complianceEvidenceTable.status, "verified"),
          ),
        );
      const [allActive] = await db
        .select({ value: count() })
        .from(complianceEvidenceTable)
        .where(eq(complianceEvidenceTable.controlId, c.id));
      return {
        controlId: c.id,
        verified: Number(verified.value),
        total: Number(allActive.value),
      };
    }),
  );
  const evidenceByControl = new Map(evidenceCounts.map((e) => [e.controlId, e]));
  res.json({
    ...framework,
    controlsMet: Number(met),
    controls: controls.map((c) => {
      const ev = evidenceByControl.get(c.id);
      return {
        ...c,
        linkedRequirementCount: 0,
        evidenceVerifiedCount: ev?.verified ?? 0,
        evidenceTotalCount: ev?.total ?? 0,
      };
    }),
  });
});

// =============================================================
// Evidence locker — list every evidence row attached to a control.
// =============================================================
router.get("/compliance/controls/:controlId/evidence", async (req, res) => {
  const controlId = String(req.params.controlId ?? "");
  if (!controlId) {
    res.status(400).json({ error: "controlId required" });
    return;
  }
  const [control] = await db
    .select()
    .from(complianceControlsTable)
    .where(eq(complianceControlsTable.id, controlId));
  if (!control) {
    res.status(404).json({ error: "Control not found" });
    return;
  }
  // RBAC: scope by projectId on the evidence rows. If a projectId is provided
  // assert authenticated project access; otherwise return only public framework
  // metadata + empty list.
  const projectId = typeof req.query.projectId === "string" ? req.query.projectId : null;
  if (projectId) {
    const access = await requireProjectAccessInline(req, res, projectId, "viewer");
    if (!access) return;
    const rows = await db
      .select()
      .from(complianceEvidenceTable)
      .where(
        and(
          eq(complianceEvidenceTable.controlId, controlId),
          eq(complianceEvidenceTable.projectId, projectId),
        ),
      )
      .orderBy(desc(complianceEvidenceTable.createdAt));
    res.json({ control, evidence: rows });
    return;
  }
  // No project scope: return only framework-wide evidence summary, no rows.
  res.json({ control, evidence: [] });
});

// =============================================================
// POST /api/compliance/controls/:id/verify
//   Body: { action: "verify" | "reject", projectId, evidenceId?, note? }
// Flips ai_asserted → verified | rejected. If `evidenceId` is omitted,
// applies to ALL ai_asserted evidence rows for this control + project.
// On verify: control.assertion = "verified", control.status = "met".
// On reject: if no other active evidence remains, control.status = "gap".
// =============================================================
router.post("/compliance/controls/:controlId/verify", async (req, res) => {
  const controlId = String(req.params.controlId ?? "");
  const action = String(req.body?.action ?? "");
  const projectId = String(req.body?.projectId ?? "");
  const note = typeof req.body?.note === "string" ? req.body.note.slice(0, 1000) : "";
  const evidenceId = typeof req.body?.evidenceId === "string" ? req.body.evidenceId : null;

  if (!["verify", "reject"].includes(action)) {
    res.status(400).json({ error: "action must be verify|reject" });
    return;
  }
  if (!projectId) {
    res.status(400).json({ error: "projectId required" });
    return;
  }
  const access = await requireProjectAccessInline(req, res, projectId, "manager");
  if (!access) return;

  const [control] = await db
    .select()
    .from(complianceControlsTable)
    .where(eq(complianceControlsTable.id, controlId));
  if (!control) {
    res.status(404).json({ error: "Control not found" });
    return;
  }

  const userId = getAuth(req).userId ?? "system";
  const newStatus = action === "verify" ? "verified" : "rejected";
  const verifiedAt = new Date();

  let updatedRows;
  if (evidenceId) {
    updatedRows = await db
      .update(complianceEvidenceTable)
      .set({ status: newStatus, verifiedBy: userId, verifiedAt, note })
      .where(
        and(
          eq(complianceEvidenceTable.id, evidenceId),
          eq(complianceEvidenceTable.controlId, controlId),
          eq(complianceEvidenceTable.projectId, projectId),
        ),
      )
      .returning();
  } else {
    updatedRows = await db
      .update(complianceEvidenceTable)
      .set({ status: newStatus, verifiedBy: userId, verifiedAt, note })
      .where(
        and(
          eq(complianceEvidenceTable.controlId, controlId),
          eq(complianceEvidenceTable.projectId, projectId),
          eq(complianceEvidenceTable.status, "ai_asserted"),
        ),
      )
      .returning();
  }

  // Recompute control assertion + status from remaining evidence.
  const allEv = await db
    .select()
    .from(complianceEvidenceTable)
    .where(eq(complianceEvidenceTable.controlId, controlId));
  const hasVerified = allEv.some((e) => e.status === "verified");
  const hasAi = allEv.some((e) => e.status === "ai_asserted");
  let newAssertion: string | null = control.assertion ?? null;
  let newControlStatus = control.status;
  if (hasVerified) {
    newAssertion = "verified";
    newControlStatus = "met";
  } else if (hasAi) {
    newAssertion = "ai_asserted";
    newControlStatus = "met";
  } else if (action === "reject") {
    // No active evidence after rejection → control is back to gap unless
    // it was originally already manually-met.
    newAssertion = "rejected";
    newControlStatus = "gap";
  }

  await db
    .update(complianceControlsTable)
    .set({
      assertion: newAssertion,
      status: newControlStatus,
      evidenceCount: allEv.filter((e) => e.status !== "rejected").length,
    })
    .where(eq(complianceControlsTable.id, controlId));

  await logActivity(
    "compliance",
    `${control.code} evidence ${newStatus} by ${userId === "system" ? "operator" : "user"}`,
    "Auditee",
    control.code,
  );

  res.json({
    controlId,
    updatedCount: updatedRows.length,
    assertion: newAssertion,
    status: newControlStatus,
  });
});

export default router;
