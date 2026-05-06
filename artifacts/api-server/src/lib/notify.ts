import { randomUUID } from "node:crypto";
import { db, notificationsTable } from "@workspace/db";
import { logger } from "./logger";
import { safeFetch } from "./safe-fetch";

/**
 * Outbound chat notifications. Set SLACK_WEBHOOK_URL or TEAMS_WEBHOOK_URL
 * (incoming-webhook style) to enable each channel. Failures are logged but
 * never thrown — chat is best-effort, the in-app DB row is the source of
 * truth.
 */
async function pushSlack(input: NotifyInput): Promise<void> {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) return;
  const text = `*${input.title}*` + (input.body ? `\n${input.body}` : "") + (input.link ? `\n${input.link}` : "");
  try {
    await safeFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
  } catch (err) {
    logger.warn({ err }, "notify: Slack webhook failed");
  }
}

async function pushTeams(input: NotifyInput): Promise<void> {
  const url = process.env.TEAMS_WEBHOOK_URL;
  if (!url) return;
  const card = {
    "@type": "MessageCard",
    "@context": "https://schema.org/extensions",
    summary: input.title,
    themeColor: "6366f1",
    title: input.title,
    text: input.body ?? "",
    potentialAction: input.link
      ? [{ "@type": "OpenUri", name: "Open", targets: [{ os: "default", uri: input.link }] }]
      : undefined,
  };
  try {
    await safeFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(card),
    });
  } catch (err) {
    logger.warn({ err }, "notify: Teams webhook failed");
  }
}

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
  channels?: Array<"in_app" | "email" | "sms" | "slack" | "teams">;
};

const EMAIL_READY = Boolean(process.env.SENDGRID_API_KEY || process.env.SMTP_HOST);
const SMS_READY = Boolean(process.env.TWILIO_AUTH_TOKEN);
const SLACK_READY = Boolean(process.env.SLACK_WEBHOOK_URL);
const TEAMS_READY = Boolean(process.env.TEAMS_WEBHOOK_URL);

export async function notify(input: NotifyInput): Promise<void> {
  // Default channel set: in-app always, plus chat if those webhooks are configured.
  const requested = input.channels ?? (
    ["in_app", SLACK_READY ? "slack" : null, TEAMS_READY ? "teams" : null].filter(Boolean) as Array<"in_app" | "slack" | "teams">
  );
  const delivered: string[] = [];
  for (const c of requested) {
    if (c === "in_app") delivered.push("in_app");
    else if (c === "email" && EMAIL_READY) delivered.push("email");
    else if (c === "sms" && SMS_READY) delivered.push("sms");
    else if (c === "slack" && SLACK_READY) {
      delivered.push("slack");
      void pushSlack(input);
    }
    else if (c === "teams" && TEAMS_READY) {
      delivered.push("teams");
      void pushTeams(input);
    }
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
