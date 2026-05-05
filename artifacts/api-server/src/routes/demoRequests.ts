import { Router, type IRouter } from "express";
import { randomUUID } from "node:crypto";
import { db, demoRequestsTable } from "@workspace/db";
import { CreateDemoRequestBody } from "@workspace/api-zod";
import { sendToYogesh } from "../lib/mailer";

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

  await sendToYogesh({
    subject: `📬 New contact form submission from ${body.name}`,
    replyTo: body.email,
    text: [
      `Name: ${body.name}`,
      `Email: ${body.email}`,
      `Company: ${body.company ?? "—"}`,
      ``,
      `Message:`,
      body.message ?? "—",
    ].join("\n"),
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#3b3aee;margin-bottom:4px">New contact form submission</h2>
        <p style="color:#64748b;margin-top:0;font-size:14px">Submitted via auditee.site/contact</p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0"/>
        <table style="font-size:14px;width:100%;border-collapse:collapse">
          <tr>
            <td style="padding:6px 0;color:#64748b;width:80px">Name</td>
            <td style="padding:6px 0;font-weight:600;color:#0f172a">${body.name}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#64748b">Email</td>
            <td style="padding:6px 0"><a href="mailto:${body.email}" style="color:#3b3aee">${body.email}</a></td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#64748b">Company</td>
            <td style="padding:6px 0;color:#0f172a">${body.company ?? "—"}</td>
          </tr>
        </table>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0"/>
        <p style="font-size:14px;color:#64748b;margin:0 0 6px 0">Message</p>
        <p style="font-size:15px;color:#0f172a;white-space:pre-wrap;margin:0">${(body.message ?? "—").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0 16px 0"/>
        <p style="font-size:12px;color:#94a3b8">Reply to this email to respond directly to ${body.name}.</p>
      </div>
    `,
  });

  res.status(201).json(row);
});

export default router;
