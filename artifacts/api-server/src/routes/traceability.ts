import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import {
  db,
  requirementsTable,
  codeArtifactsTable,
  traceabilityLinksTable,
  complianceFrameworksTable,
} from "@workspace/db";
import { GetTraceabilityGraphQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/traceability/graph", async (req, res) => {
  const params = GetTraceabilityGraphQueryParams.parse(req.query);
  const reqs = await db
    .select()
    .from(requirementsTable)
    .where(eq(requirementsTable.projectId, params.projectId));
  const code = await db
    .select()
    .from(codeArtifactsTable)
    .where(eq(codeArtifactsTable.projectId, params.projectId));
  const frameworks = await db.select().from(complianceFrameworksTable);
  const reqIds = new Set(reqs.map((r) => r.id));
  const links = (await db.select().from(traceabilityLinksTable)).filter((l) =>
    reqIds.has(l.requirementId),
  );

  const nodes = [
    ...reqs.map((r) => ({
      id: r.id,
      label: r.code,
      kind: "requirement" as const,
      meta: r.title,
    })),
    ...code.map((c) => ({
      id: c.id,
      label: c.symbol,
      kind: "code" as const,
      meta: c.filePath,
    })),
    ...frameworks.map((f) => ({
      id: f.id,
      label: f.code,
      kind: "framework" as const,
      meta: f.name,
    })),
  ];

  const edges: { from: string; to: string; kind: string }[] = links.map((l) => ({
    from: l.requirementId,
    to: l.codeArtifactId,
    kind: l.kind,
  }));
  for (const r of reqs) {
    for (const fwId of r.linkedFrameworks ?? []) {
      if (frameworks.some((f) => f.id === fwId)) {
        edges.push({ from: r.id, to: fwId, kind: "covers" });
      }
    }
  }

  res.json({ nodes, edges });
});

export default router;
