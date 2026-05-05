import nodemailer from "nodemailer";
import { logger } from "./logger";

const SMTP_USER = "yogesh.yowan@gmail.com";
const SMTP_PASS = process.env.SMTP_PASS;

const transporter = SMTP_PASS
  ? nodemailer.createTransport({
      service: "gmail",
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
  : null;

export async function sendToYogesh(opts: {
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}): Promise<void> {
  if (!transporter) {
    logger.warn("mailer: SMTP_PASS not configured — skipping email");
    return;
  }
  try {
    await transporter.sendMail({
      from: `"Auditee Notifications" <${SMTP_USER}>`,
      to: SMTP_USER,
      replyTo: opts.replyTo,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
    });
    logger.info({ subject: opts.subject }, "mailer: email sent");
  } catch (err) {
    logger.error({ err }, "mailer: failed to send email");
  }
}
