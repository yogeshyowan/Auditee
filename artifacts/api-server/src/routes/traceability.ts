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

  // 1. Pull project's requirements + code, plus the framework catalog.
  const allReqs = await db
    .select()
    .from(requirementsTable)
    .where(eq(requirementsTable.projectId, params.projectId));
  const allCode = await db
    .select()
    .from(codeArtifactsTable)
    .where(eq(codeArtifactsTable.projectId, params.projectId));
  const allFrameworks = await db.select().from(complianceFrameworksTable);

  // 2. If a frameworkId is supplied, narrow the slice:
  //    - requirements: only those whose linkedFrameworks includes it
  //    - code: only artifacts traced to those requirements
  //    - frameworks: only the selected one
  // Otherwise fall through with the unfiltered project view.
  const fwId = params.frameworkId;
  const reqs = fwId
    ? allReqs.filter((r) => (r.linkedFrameworks ?? []).includes(fwId))
    : allReqs;
  const reqIds = new Set(reqs.map((r) => r.id));

  const allLinks = await db.select().from(traceabilityLinksTable);
  const links = allLinks.filter((l) => reqIds.has(l.requirementId));
  const codeIdsInGraph = new Set(links.map((l) => l.codeArtifactId));
  const code = fwId ? allCode.filter((c) => codeIdsInGraph.has(c.id)) : allCode;

  const frameworks = fwId
    ? allFrameworks.filter((f) => f.id === fwId)
    : allFrameworks;

  // 3. Assemble nodes + edges. Node shapes are unchanged so the SVG renderer
  //    keeps working without modification.
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
    for (const linkedFw of r.linkedFrameworks ?? []) {
      // When a framework filter is active we only keep the edge to the
      // selected framework; otherwise emit edges to every framework the
      // requirement covers.
      if (fwId && linkedFw !== fwId) continue;
      if (frameworks.some((f) => f.id === linkedFw)) {
        edges.push({ from: r.id, to: linkedFw, kind: "covers" });
      }
    }
  }

  res.json({ nodes, edges });
});

export default router;
