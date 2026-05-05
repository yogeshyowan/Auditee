import { Router, type IRouter } from "express";
import { z } from "zod";
import { sendToYogesh } from "../lib/mailer";

const router: IRouter = Router();

const ChatMessageBody = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(300),
  message: z.string().min(1).max(4000),
});

router.post("/chat-messages", async (req, res) => {
  const body = ChatMessageBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid input", details: body.error.flatten() });
    return;
  }

  const { name, email, message } = body.data;

  await sendToYogesh({
    subject: `💬 New chat message from ${name} on auditee.site`,
    replyTo: email,
    text: [
      `Name: ${name}`,
      `Email: ${email}`,
      ``,
      `Message:`,
      message,
    ].join("\n"),
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#3b3aee;margin-bottom:4px">New chat message</h2>
        <p style="color:#64748b;margin-top:0;font-size:14px">Sent from the auditee.site chat widget</p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0"/>
        <table style="font-size:14px;width:100%;border-collapse:collapse">
          <tr>
            <td style="padding:6px 0;color:#64748b;width:80px">Name</td>
            <td style="padding:6px 0;font-weight:600;color:#0f172a">${name}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#64748b">Email</td>
            <td style="padding:6px 0">
              <a href="mailto:${email}" style="color:#3b3aee">${email}</a>
            </td>
          </tr>
        </table>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0"/>
        <p style="font-size:14px;color:#64748b;margin:0 0 6px 0">Message</p>
        <p style="font-size:15px;color:#0f172a;white-space:pre-wrap;margin:0">${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0 16px 0"/>
        <p style="font-size:12px;color:#94a3b8">
          Reply to this email to respond directly to ${name}.
        </p>
      </div>
    `,
  });

  res.status(201).json({ ok: true });
});

export default router;
