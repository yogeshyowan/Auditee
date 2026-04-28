import { Router, type IRouter } from "express";
import { eq, inArray } from "drizzle-orm";
import {
  db,
  requirementsTable,
  codeArtifactsTable,
  traceabilityLinksTable,
  complianceFrameworksTable,
  aiReportsTable,
  projectSourcesTable,
  sourceFilesTable,
} from "@workspace/db";
import { GetTraceabilityGraphQueryParams } from "@workspace/api-zod";
import { requireProjectAccessInline } from "../lib/projectAccess";

const router: IRouter = Router();

/**
 * 5-stage end-to-end lifecycle coverage per requirement.
 *
 * Stages: Architecture → Design → Implementation → Testing → Deployment.
 * Coverage signals:
 *  - architecture: any aiReport with kind=architecture_doc, OR file paths
 *    matching architecture/ADR conventions.
 *  - design:       aiReport kind in (hld, lld, frd, prd), OR design-doc paths.
 *  - implementation: traceability_links to code artifacts (existing manual
 *    + AI-extracted links).
 *  - testing:      aiReport kind=test_cases, OR test/spec file paths.
 *  - deployment:   aiReport kind=deployment_doc, OR infra paths
 *    (Dockerfile, k8s/, terraform/, .github/workflows/).
 *
 * For each requirement we keep up to 5 evidence pointers per stage so the UI
 * can show "what counted as covered". Status is "covered" when ≥1 evidence,
 * "missing" otherwise. The project-level summary returns counts per stage and
 * an overall lifecycle score (sum of covered stages / (5 * #requirements)).
 */
const STAGES = ["architecture", "design", "implementation", "testing", "deployment"] as const;
type LifecycleStage = (typeof STAGES)[number];

const ARCH_RX = /(^|\/)(architecture|arch|adr|c4)\//i;
const ARCH_FILE_RX = /(ARCHITECTURE|ADR-[0-9]{2,}|C4)\.(md|adoc|rst|txt)$/i;
const DESIGN_PATH_RX = /(^|\/)(design|hld|lld|specs?|rfcs?)\//i;
const DESIGN_FILE_RX = /(DESIGN|HLD|LLD|SPEC|RFC)\.(md|adoc|rst|txt)$/i;
const TEST_RX =
  /(\.|_|\/)(test|spec)s?(\.|\/)|(^|\/)(tests?|__tests__|cypress|e2e|playwright|vitest|jest)\//i;
const TEST_FILE_RX = /\.(test|spec)\.[jt]sx?$/i;
const DEPLOY_RX =
  /(^|\/)(Dockerfile($|\.)|docker-compose|k8s\/|kubernetes\/|helm\/|terraform\/|infra\/|deploy\/|deployment\/|\.github\/workflows\/|\.gitlab-ci\.yml$|Jenkinsfile($|\.)|cloudformation\/|pulumi\/)/i;

const REPORT_TO_STAGE: Record<string, LifecycleStage> = {
  architecture_doc: "architecture",
  hld: "design",
  lld: "design",
  frd: "design",
  prd: "design",
  test_cases: "testing",
  deployment_doc: "deployment",
};

router.get("/traceability/lifecycle", async (req, res) => {
  const projectId = typeof req.query.projectId === "string" ? req.query.projectId : "";
  if (!projectId) {
    res.status(400).json({ error: "projectId is required" });
    return;
  }
  const access = await requireProjectAccessInline(req, res, projectId, "viewer");
  if (!access) return;

  const reqs = await db
    .select()
    .from(requirementsTable)
    .where(eq(requirementsTable.projectId, projectId));
  const reqIds = reqs.map((r) => r.id);
  const reqByCode = new Map(reqs.map((r) => [r.code, r] as const));
  const codeRegex = (code: string) => new RegExp(`(^|[^A-Za-z0-9])${code.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^A-Za-z0-9]|$)`);

  // Implementation = existing traceability links → code artifacts.
  const links = reqIds.length
    ? await db
        .select({
          requirementId: traceabilityLinksTable.requirementId,
          kind: traceabilityLinksTable.kind,
          filePath: codeArtifactsTable.filePath,
          symbol: codeArtifactsTable.symbol,
        })
        .from(traceabilityLinksTable)
        .innerJoin(codeArtifactsTable, eq(traceabilityLinksTable.codeArtifactId, codeArtifactsTable.id))
        .where(inArray(traceabilityLinksTable.requirementId, reqIds))
    : [];

  // Reports — group by kind and pull the citations they emitted (those reference req codes).
  const reports = await db
    .select({ id: aiReportsTable.id, kind: aiReportsTable.kind, content: aiReportsTable.content })
    .from(aiReportsTable)
    .where(eq(aiReportsTable.projectId, projectId));

  // Source-file paths grouped per stage by filename heuristics.
  const sources = await db
    .select({ id: projectSourcesTable.id, label: projectSourcesTable.label })
    .from(projectSourcesTable)
    .where(eq(projectSourcesTable.projectId, projectId));
  const sourceIds = sources.map((s) => s.id);
  const allFiles = sourceIds.length
    ? await db
        .select({ path: sourceFilesTable.path, sourceId: sourceFilesTable.sourceId })
        .from(sourceFilesTable)
        .where(inArray(sourceFilesTable.sourceId, sourceIds))
    : [];

  type Bucket = { architecture: string[]; design: string[]; testing: string[]; deployment: string[] };
  const fileBucket: Bucket = { architecture: [], design: [], testing: [], deployment: [] };
  for (const f of allFiles) {
    const p = f.path;
    if (DEPLOY_RX.test(p)) fileBucket.deployment.push(p);
    else if (TEST_RX.test(p) || TEST_FILE_RX.test(p)) fileBucket.testing.push(p);
    else if (ARCH_RX.test(p) || ARCH_FILE_RX.test(p)) fileBucket.architecture.push(p);
    else if (DESIGN_PATH_RX.test(p) || DESIGN_FILE_RX.test(p)) fileBucket.design.push(p);
  }

  type StageInfo = { status: "covered" | "missing"; evidence: Array<{ label: string; source: "report" | "code" | "file" }> };
  const result = reqs.map((r) => {
    const stages: Record<LifecycleStage, StageInfo> = {
      architecture: { status: "missing", evidence: [] },
      design: { status: "missing", evidence: [] },
      implementation: { status: "missing", evidence: [] },
      testing: { status: "missing", evidence: [] },
      deployment: { status: "missing", evidence: [] },
    };

    // Implementation evidence from traceability links.
    for (const l of links) {
      if (l.requirementId !== r.id) continue;
      const label = l.filePath ? (l.symbol ? `${l.filePath} :: ${l.symbol}` : l.filePath) : (l.symbol ?? "code artifact");
      stages.implementation.evidence.push({ label, source: "code" });
      if (stages.implementation.evidence.length >= 5) break;
    }

    // Report-derived evidence — match if the report cites this requirement code OR
    // if the report kind unambiguously belongs to a stage and either the project
    // has only a few requirements or the report content mentions the code.
    const re = codeRegex(r.code);
    for (const rep of reports) {
      const stage = REPORT_TO_STAGE[rep.kind];
      if (!stage) continue;
      const content: any = rep.content;
      const cited = Array.isArray(content?.evidence)
        ? content.evidence.some((e: any) => e?.id === r.code)
        : false;
      const sectionsMention = Array.isArray(content?.sections)
        ? content.sections.some((s: any) => {
            if (Array.isArray(s?.citations) && s.citations.includes(r.code)) return true;
            return typeof s?.body === "string" && re.test(s.body);
          })
        : false;
      if (cited || sectionsMention) {
        if (stages[stage].evidence.length < 5) {
          stages[stage].evidence.push({ label: `${rep.kind.replace("_", " ")}: ${content?.title ?? "report"}`, source: "report" });
        }
      }
    }

    // File-path evidence (architecture/design/testing/deployment buckets).
    for (const stage of ["architecture", "design", "testing", "deployment"] as const) {
      if (stages[stage].evidence.length >= 5) continue;
      for (const p of fileBucket[stage]) {
        if (re.test(p)) {
          stages[stage].evidence.push({ label: p, source: "file" });
          if (stages[stage].evidence.length >= 5) break;
        }
      }
    }

    // Promote to "covered" wherever there's any evidence.
    for (const k of STAGES) {
      if (stages[k].evidence.length > 0) stages[k].status = "covered";
    }
    const score = STAGES.reduce((acc, k) => acc + (stages[k].status === "covered" ? 1 : 0), 0);
    return {
      requirementId: r.id,
      requirementCode: r.code,
      requirementTitle: r.title,
      stages,
      score,
    };
  });

  // Project-level rollup.
  const totals = STAGES.reduce(
    (acc, k) => {
      acc[k] = result.filter((r) => r.stages[k].status === "covered").length;
      return acc;
    },
    {} as Record<LifecycleStage, number>,
  );
  const totalSlots = result.length * STAGES.length;
  const totalCovered = result.reduce((acc, r) => acc + r.score, 0);
  const overallPct = totalSlots === 0 ? 0 : Math.round((totalCovered / totalSlots) * 100);

  res.json({
    stages: STAGES,
    requirementCount: result.length,
    coveragePerStage: totals,
    overallPct,
    requirements: result,
  });
  void reqByCode;
});

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
