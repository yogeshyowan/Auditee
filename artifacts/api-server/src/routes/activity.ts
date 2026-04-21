import { Router, type IRouter } from "express";
import { desc } from "drizzle-orm";
import { db, activityEventsTable } from "@workspace/db";
import { GetRecentActivityQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/activity/recent", async (req, res) => {
  const params = GetRecentActivityQueryParams.parse(req.query);
  const limit = params.limit ?? 20;
  const rows = await db
    .select()
    .from(activityEventsTable)
    .orderBy(desc(activityEventsTable.createdAt))
    .limit(limit);
  res.json(rows);
});

export default router;
