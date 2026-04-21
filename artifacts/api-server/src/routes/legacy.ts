import { Router, type IRouter } from "express";
import { db, legacySystemsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/legacy/systems", async (_req, res) => {
  const rows = await db.select().from(legacySystemsTable);
  res.json(rows);
});

export default router;
