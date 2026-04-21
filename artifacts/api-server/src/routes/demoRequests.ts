import { Router, type IRouter } from "express";
import { randomUUID } from "node:crypto";
import { db, demoRequestsTable } from "@workspace/db";
import { CreateDemoRequestBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/demo-requests", async (req, res) => {
  const body = CreateDemoRequestBody.parse(req.body);
  const [row] = await db
    .insert(demoRequestsTable)
    .values({
      id: randomUUID(),
      name: body.name,
      email: body.email,
      company: body.company ?? null,
      message: body.message ?? null,
    })
    .returning();
  res.status(201).json(row);
});

export default router;
