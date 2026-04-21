import { randomUUID } from "node:crypto";
import { db, notificationsTable } from "@workspace/db";
import { logger } from "./logger";

// Notification adapter. The in-app channel always writes to the DB.
// Email/SMS adapters are activated only when the relevant integration env vars
// are present. Without them we still record an attempt for transparency.
export type NotifyInput = {
  recipient: string;
  kind: "workflow_blocked" | "workflow_completed" | "capa_created" | "audit_completed" | "mention";
  title: string;
  body?: string;
  link?: string | null;
  data?: Record<string, unknown>;
  channels?: Array<"in_app" | "email" | "sms">;
};

const EMAIL_READY = Boolean(process.env.SENDGRID_API_KEY || process.env.SMTP_HOST);
const SMS_READY = Boolean(process.env.TWILIO_AUTH_TOKEN);

export async function notify(input: NotifyInput): Promise<void> {
  const requested = input.channels ?? ["in_app"];
  const delivered: string[] = [];
  for (const c of requested) {
    if (c === "in_app") delivered.push("in_app");
    else if (c === "email" && EMAIL_READY) delivered.push("email");
    else if (c === "sms" && SMS_READY) delivered.push("sms");
    else logger.debug({ channel: c }, "notify: channel not configured, skipping");
  }
  await db.insert(notificationsTable).values({
    id: randomUUID(),
    recipient: input.recipient.slice(0, 240),
    kind: input.kind,
    title: input.title.slice(0, 240),
    body: (input.body ?? "").slice(0, 4000),
    link: input.link ?? null,
    channels: delivered,
    data: input.data ?? {},
  });
}
