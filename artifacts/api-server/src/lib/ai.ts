import Anthropic from "@anthropic-ai/sdk";

const ANTHROPIC_MODEL = "claude-haiku-4-5";

export class AIUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIUnavailableError";
  }
}

export class AIResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIResponseError";
  }
}

let cachedAnthropic: Anthropic | null = null;

function getAnthropic(): Anthropic {
  if (cachedAnthropic) return cachedAnthropic;
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new AIUnavailableError(
      "AI service is not configured. Set ANTHROPIC_API_KEY to enable AI features.",
    );
  }
  cachedAnthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return cachedAnthropic;
}

export async function jsonCompletion<T>(
  systemPrompt: string,
  userPrompt: string,
  opts?: { maxTokens?: number },
): Promise<T> {
  const client = getAnthropic();
  const response = await client.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: opts?.maxTokens ?? 8192,
    system: `${systemPrompt}\n\nRespond with a single valid JSON object and no other text.`,
    messages: [{ role: "user", content: userPrompt }],
  });
  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  return parseJson<T>(extractJsonObject(text));
}

export async function textCompletion(
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const client = getAnthropic();
  const response = await client.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 8192,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });
  return response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}

function parseJson<T>(content: string): T {
  try {
    return JSON.parse(content) as T;
  } catch {
    throw new AIResponseError("AI returned malformed JSON. Try again.");
  }
}

function extractJsonObject(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) return trimmed;
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenced) return fenced[1].trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    return trimmed.slice(start, end + 1);
  }
  return trimmed;
}
