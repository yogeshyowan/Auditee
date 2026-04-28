import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

const ANTHROPIC_MODEL = "claude-haiku-4-5";
const OPENROUTER_MODEL = "anthropic/claude-haiku-4.5";
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

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
let cachedOpenRouter: OpenAI | null = null;

function getAnthropic(): Anthropic | null {
  if (cachedAnthropic) return cachedAnthropic;
  if (!process.env.ANTHROPIC_API_KEY) return null;
  cachedAnthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return cachedAnthropic;
}

function getOpenRouter(): OpenAI | null {
  if (cachedOpenRouter) return cachedOpenRouter;
  if (!process.env.OPENROUTER_API_KEY) return null;
  cachedOpenRouter = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: OPENROUTER_BASE_URL,
  });
  return cachedOpenRouter;
}

function isRetryable(err: unknown): boolean {
  const status = (err as { status?: number })?.status;
  if (typeof status !== "number") return true;
  return status === 401 || status === 403 || status === 429 || status >= 500;
}

async function withFallback<T>(
  primary: () => Promise<T>,
  fallback: (() => Promise<T>) | null,
  label: string,
): Promise<T> {
  if (!primary && !fallback) {
    throw new AIUnavailableError(
      "AI service is not configured. Set ANTHROPIC_API_KEY or OPENROUTER_API_KEY to enable AI features.",
    );
  }
  try {
    return await primary();
  } catch (primaryErr) {
    if (!fallback || !isRetryable(primaryErr)) throw primaryErr;
    const status = (primaryErr as { status?: number })?.status;
    try {
      const result = await fallback();
      console.warn(
        `[ai] Anthropic ${label} failed (status=${status ?? "?"}). Served from OpenRouter fallback.`,
      );
      return result;
    } catch (fallbackErr) {
      console.error(
        `[ai] Both providers failed for ${label}. Anthropic=${status ?? "?"}, OpenRouter=${(fallbackErr as { status?: number })?.status ?? "?"}.`,
      );
      throw fallbackErr;
    }
  }
}

export async function jsonCompletion<T>(
  systemPrompt: string,
  userPrompt: string,
  opts?: { maxTokens?: number },
): Promise<T> {
  const maxTokens = opts?.maxTokens ?? 8192;
  const jsonSystemPrompt = `${systemPrompt}\n\nRespond with a single valid JSON object and no other text.`;

  const anthropic = getAnthropic();
  const callAnthropic = anthropic
    ? async (): Promise<T> => {
        const response = await anthropic.messages.create({
          model: ANTHROPIC_MODEL,
          max_tokens: maxTokens,
          system: jsonSystemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        });
        const text = response.content
          .filter((b): b is Anthropic.TextBlock => b.type === "text")
          .map((b) => b.text)
          .join("");
        return parseJson<T>(extractJsonObject(text));
      }
    : null;

  const openrouter = getOpenRouter();
  const callOpenRouter = openrouter
    ? async (): Promise<T> => {
        const response = await openrouter.chat.completions.create({
          model: OPENROUTER_MODEL,
          max_tokens: maxTokens,
          messages: [
            { role: "system", content: jsonSystemPrompt },
            { role: "user", content: userPrompt },
          ],
        });
        const content = response.choices[0]?.message?.content ?? "{}";
        return parseJson<T>(extractJsonObject(content));
      }
    : null;

  if (!callAnthropic && !callOpenRouter) {
    throw new AIUnavailableError(
      "AI service is not configured. Set ANTHROPIC_API_KEY or OPENROUTER_API_KEY to enable AI features.",
    );
  }
  return withFallback(
    callAnthropic ?? callOpenRouter!,
    callAnthropic ? callOpenRouter : null,
    "jsonCompletion",
  );
}

export async function textCompletion(
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const anthropic = getAnthropic();
  const callAnthropic = anthropic
    ? async (): Promise<string> => {
        const response = await anthropic.messages.create({
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
    : null;

  const openrouter = getOpenRouter();
  const callOpenRouter = openrouter
    ? async (): Promise<string> => {
        const response = await openrouter.chat.completions.create({
          model: OPENROUTER_MODEL,
          max_tokens: 8192,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        });
        return response.choices[0]?.message?.content ?? "";
      }
    : null;

  if (!callAnthropic && !callOpenRouter) {
    throw new AIUnavailableError(
      "AI service is not configured. Set ANTHROPIC_API_KEY or OPENROUTER_API_KEY to enable AI features.",
    );
  }
  return withFallback(
    callAnthropic ?? callOpenRouter!,
    callAnthropic ? callOpenRouter : null,
    "textCompletion",
  );
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
