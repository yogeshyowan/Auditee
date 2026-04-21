import { Router, type IRouter } from "express";
import healthRouter from "./health";
import projectsRouter from "./projects";
import requirementsRouter from "./requirements";
import traceabilityRouter from "./traceability";
import codeArtifactsRouter from "./codeArtifacts";
import complianceRouter from "./compliance";
import dashboardRouter from "./dashboard";
import activityRouter from "./activity";
import pdlcRouter from "./pdlc";
import legacyRouter from "./legacy";
import demoRequestsRouter from "./demoRequests";
import aiRouter from "./ai";

const router: IRouter = Router();

router.use(healthRouter);
router.use(projectsRouter);
router.use(requirementsRouter);
router.use(traceabilityRouter);
router.use(codeArtifactsRouter);
router.use(complianceRouter);
router.use(dashboardRouter);
router.use(activityRouter);
router.use(pdlcRouter);
router.use(legacyRouter);
router.use(demoRequestsRouter);
router.use(aiRouter);

export default router;
