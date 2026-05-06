import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { getWorkspaceLlmConfig, type ResolvedLlmConfig } from "./llmConfig.js";

const OPENAI_MODEL = "gpt-4o";
const OPENROUTER_MODEL = "google/gemini-2.5-flash";
const ANTHROPIC_HAIKU_MODEL = "claude-haiku-4-5";
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const OPENROUTER_MAX_TOKENS_CAP = 8192;

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

/**
 * Detects upstream LLM provider quota / billing failures (Anthropic
 * "credit balance is too low", OpenAI `insufficient_quota`, generic 429
 * rate limits) and returns a stable, user-friendly status + message
 * instead of leaking raw provider error JSON to the client. Without this
 * a depleted API key surfaces as a confusing "400" with a stringified
 * blob to every AI feature in the app.
 */
export function classifyProviderError(
  err: any,
): { status: number; message: string } | null {
  const raw = String(err?.message ?? "");
  const code = err?.code ?? err?.error?.code ?? err?.error?.error?.code ?? "";
  const innerMsg = err?.error?.message ?? err?.error?.error?.message ?? "";
  const haystack = `${raw} ${innerMsg}`.toLowerCase();

  // Anthropic billing exhausted (HTTP 400 from upstream).
  if (haystack.includes("credit balance is too low")) {
    return {
      status: 503,
      message:
        "AI provider (Anthropic) is out of credits. Please top up the Anthropic API key or contact your workspace admin.",
    };
  }

  // OpenAI quota exhausted (HTTP 429 with code "insufficient_quota").
  if (
    code === "insufficient_quota" ||
    haystack.includes("insufficient_quota") ||
    haystack.includes("exceeded your current quota")
  ) {
    return {
      status: 503,
      message:
        "AI provider (OpenAI) quota exhausted. Please check OpenAI billing/usage on the configured API key.",
    };
  }

  // Generic upstream rate limit — surface as 503 so the client treats it
  // as a transient backend issue rather than a malformed request.
  if (err?.status === 429 || haystack.includes("rate limit")) {
    return {
      status: 503,
      message: "AI provider is rate-limiting requests. Please retry in a moment.",
    };
  }

  return null;
}

let cachedOpenAI: OpenAI | null = null;
let cachedOpenRouter: OpenAI | null = null;
let cachedAnthropic: Anthropic | null = null;

function getOpenAI(): OpenAI | null {
  if (cachedOpenAI) return cachedOpenAI;
  if (!process.env.OPENAI_API_KEY) return null;
  cachedOpenAI = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return cachedOpenAI;
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

function getAnthropic(): Anthropic | null {
  if (cachedAnthropic) return cachedAnthropic;
  if (!process.env.ANTHROPIC_API_KEY) return null;
  cachedAnthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return cachedAnthropic;
}

function isRetryable(err: unknown): boolean {
  const status = (err as { status?: number })?.status;
  if (typeof status !== "number") return true;
  return (
    status === 401 ||
    status === 402 ||
    status === 403 ||
    status === 408 ||
    status === 429 ||
    status >= 500
  );
}

type Provider<T> = { name: string; call: () => Promise<T> };

async function runChain<T>(providers: Array<Provider<T> | null>, label: string): Promise<T> {
  const active = providers.filter((p): p is Provider<T> => p !== null);
  if (active.length === 0) {
    throw new AIUnavailableError(
      "AI service is not configured. Set at least one of OPENAI_API_KEY, OPENROUTER_API_KEY, or ANTHROPIC_API_KEY.",
    );
  }
  const failures: Array<{ name: string; status: number | string }> = [];
  for (let i = 0; i < active.length; i++) {
    const p = active[i];
    try {
      const result = await p.call();
      if (i > 0) {
        console.warn(
          `[ai] ${label}: served from fallback "${p.name}" after ${failures.map((f) => `${f.name}=${f.status}`).join(", ")}.`,
        );
      }
      return result;
    } catch (err) {
      const status = (err as { status?: number })?.status ?? "?";
      failures.push({ name: p.name, status });
      const isLast = i === active.length - 1;
      if (isLast || !isRetryable(err)) {
        if (failures.length > 1) {
          console.error(
            `[ai] ${label}: all providers failed (${failures.map((f) => `${f.name}=${f.status}`).join(", ")}).`,
          );
        }
        throw err;
      }
    }
  }
  throw new AIUnavailableError(`${label}: chain exhausted with no result.`);
}

function openAICompatibleJsonProvider(
  name: string,
  client: OpenAI | null,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
): Provider<string> | null {
  if (!client) return null;
  return {
    name,
    call: async () => {
      const response = await client.chat.completions.create({
        model,
        max_tokens: maxTokens,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      });
      return response.choices[0]?.message?.content ?? "{}";
    },
  };
}

function openAICompatibleTextProvider(
  name: string,
  client: OpenAI | null,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
): Provider<string> | null {
  if (!client) return null;
  return {
    name,
    call: async () => {
      const response = await client.chat.completions.create({
        model,
        max_tokens: maxTokens,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });
      return response.choices[0]?.message?.content ?? "";
    },
  };
}

function anthropicProvider(
  client: Anthropic | null,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
): Provider<string> | null {
  if (!client) return null;
  return {
    name: `anthropic:${model}`,
    call: async () => {
      const response = await client.messages.create({
        model,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      });
      return response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("");
    },
  };
}

/**
 * Builds a per-workspace BYO-LLM provider, if the workspace has one enabled.
 * The BYO provider is always tried FIRST in the chain; platform-managed
 * providers remain as automatic fallback for resilience.
 */
function buildByoProvider(
  cfg: ResolvedLlmConfig | null,
  mode: "json" | "text",
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
): Provider<string> | null {
  if (!cfg || !cfg.apiKey) return null;
  const provider = cfg.provider;
  if (provider === "anthropic") {
    const client = new Anthropic({ apiKey: cfg.apiKey, baseURL: cfg.baseUrl ?? undefined });
    const model = cfg.model ?? ANTHROPIC_HAIKU_MODEL;
    return anthropicProvider(client, model, systemPrompt, userPrompt, maxTokens);
  }
  // OpenAI-compatible: openai, azure_openai, bedrock (via gateway), openrouter, custom
  const client = new OpenAI({ apiKey: cfg.apiKey, baseURL: cfg.baseUrl ?? undefined });
  const model = cfg.model ?? OPENAI_MODEL;
  const name = `byo:${provider}`;
  return mode === "json"
    ? openAICompatibleJsonProvider(name, client, model, systemPrompt, userPrompt, maxTokens)
    : openAICompatibleTextProvider(name, client, model, systemPrompt, userPrompt, maxTokens);
}

export async function jsonCompletion<T>(
  systemPrompt: string,
  userPrompt: string,
  opts?: { maxTokens?: number; workspaceId?: string | null },
): Promise<T> {
  const maxTokens = opts?.maxTokens ?? 8192;
  const jsonSystemPrompt = `${systemPrompt}\n\nRespond with a single valid JSON object and no other text.`;
  const byoCfg = await getWorkspaceLlmConfig(opts?.workspaceId);

  const chain: Array<Provider<string> | null> = [
    buildByoProvider(byoCfg, "json", jsonSystemPrompt, userPrompt, maxTokens),
    openAICompatibleJsonProvider("openai", getOpenAI(), OPENAI_MODEL, jsonSystemPrompt, userPrompt, maxTokens),
    openAICompatibleJsonProvider(
      "openrouter",
      getOpenRouter(),
      OPENROUTER_MODEL,
      jsonSystemPrompt,
      userPrompt,
      Math.min(maxTokens, OPENROUTER_MAX_TOKENS_CAP),
    ),
    anthropicProvider(getAnthropic(), ANTHROPIC_HAIKU_MODEL, jsonSystemPrompt, userPrompt, maxTokens),
  ];

  const raw = await runChain(chain, "jsonCompletion");
  return parseJson<T>(extractJsonObject(raw));
}

export async function textCompletion(
  systemPrompt: string,
  userPrompt: string,
  opts?: { workspaceId?: string | null },
): Promise<string> {
  const maxTokens = 8192;
  const byoCfg = await getWorkspaceLlmConfig(opts?.workspaceId);

  const chain: Array<Provider<string> | null> = [
    buildByoProvider(byoCfg, "text", systemPrompt, userPrompt, maxTokens),
    openAICompatibleTextProvider("openai", getOpenAI(), OPENAI_MODEL, systemPrompt, userPrompt, maxTokens),
    openAICompatibleTextProvider("openrouter", getOpenRouter(), OPENROUTER_MODEL, systemPrompt, userPrompt, maxTokens),
    anthropicProvider(getAnthropic(), ANTHROPIC_HAIKU_MODEL, systemPrompt, userPrompt, maxTokens),
  ];

  return runChain(chain, "textCompletion");
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
