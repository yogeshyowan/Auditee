import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o";
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5";

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

let cachedOpenAI: OpenAI | null = null;
let cachedOpenAIError: Error | null = null;
let cachedAnthropic: Anthropic | null = null;

async function getOpenAI(): Promise<OpenAI> {
  if (cachedOpenAI) return cachedOpenAI;
  if (cachedOpenAIError) throw cachedOpenAIError;

  if (process.env.OPENAI_API_KEY) {
    cachedOpenAI = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    return cachedOpenAI;
  }

  try {
    const mod = await import("@workspace/integrations-openai-ai-server");
    cachedOpenAI = mod.openai;
    return cachedOpenAI;
  } catch {
    cachedOpenAIError = new AIUnavailableError(
      "OpenAI not configured: set OPENAI_API_KEY or provision the OpenAI integration.",
    );
    throw cachedOpenAIError;
  }
}

function getAnthropic(): Anthropic | null {
  if (cachedAnthropic) return cachedAnthropic;
  if (!process.env.ANTHROPIC_API_KEY) return null;
  cachedAnthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return cachedAnthropic;
}

function isFatalAuthError(err: unknown): boolean {
  const status = (err as { status?: number })?.status;
  return status === 401 || status === 403;
}

async function withFallback<T>(
  primary: () => Promise<T>,
  fallback: (() => Promise<T>) | null,
  label: string,
): Promise<T> {
  try {
    return await primary();
  } catch (primaryErr) {
    if (!fallback) throw primaryErr;
    const status = (primaryErr as { status?: number })?.status;
    const isRetryable = status === 429 || (typeof status === "number" && status >= 500) || isFatalAuthError(primaryErr);
    if (!isRetryable) throw primaryErr;
    try {
      const result = await fallback();
      console.warn(
        `[ai] OpenAI ${label} failed (status=${status ?? "?"}). Served from Anthropic fallback.`,
      );
      return result;
    } catch (fallbackErr) {
      console.error(
        `[ai] Both providers failed for ${label}. OpenAI=${status ?? "?"}, Anthropic=${(fallbackErr as { status?: number })?.status ?? "?"}.`,
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

  const callOpenAI = async (): Promise<T> => {
    const client = await getOpenAI();
    const response = await client.chat.completions.create({
      model: OPENAI_MODEL,
      max_completion_tokens: maxTokens,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    });
    const content = response.choices[0]?.message?.content ?? "{}";
    return parseJson<T>(content);
  };

  const anthropic = getAnthropic();
  const callAnthropic = anthropic
    ? async (): Promise<T> => {
        const response = await anthropic.messages.create({
          model: ANTHROPIC_MODEL,
          max_tokens: maxTokens,
          system: `${systemPrompt}\n\nRespond with a single valid JSON object and no other text.`,
          messages: [{ role: "user", content: userPrompt }],
        });
        const text = response.content
          .filter((b): b is Anthropic.TextBlock => b.type === "text")
          .map((b) => b.text)
          .join("");
        return parseJson<T>(extractJsonObject(text));
      }
    : null;

  return withFallback(callOpenAI, callAnthropic, "jsonCompletion");
}

export async function textCompletion(
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const callOpenAI = async (): Promise<string> => {
    const client = await getOpenAI();
    const response = await client.chat.completions.create({
      model: OPENAI_MODEL,
      max_completion_tokens: 8192,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });
    return response.choices[0]?.message?.content ?? "";
  };

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

  return withFallback(callOpenAI, callAnthropic, "textCompletion");
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
