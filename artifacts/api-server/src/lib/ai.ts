import OpenAI from "openai";

const DEFAULT_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o";

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

let cachedClient: OpenAI | null = null;
let cachedClientError: Error | null = null;

async function getClient(): Promise<OpenAI> {
  if (cachedClient) return cachedClient;
  if (cachedClientError) throw cachedClientError;

  if (process.env.OPENAI_API_KEY) {
    cachedClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    return cachedClient;
  }

  try {
    const mod = await import("@workspace/integrations-openai-ai-server");
    cachedClient = mod.openai;
    return cachedClient;
  } catch (err) {
    cachedClientError = new AIUnavailableError(
      "AI service is not configured. Set OPENAI_API_KEY or provision the OpenAI integration to enable AI features.",
    );
    throw cachedClientError;
  }
}

export async function jsonCompletion<T>(
  systemPrompt: string,
  userPrompt: string,
  opts?: { maxTokens?: number },
): Promise<T> {
  const client = await getClient();
  const response = await client.chat.completions.create({
    model: DEFAULT_MODEL,
    max_completion_tokens: opts?.maxTokens ?? 8192,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
  });
  const content = response.choices[0]?.message?.content ?? "{}";
  try {
    return JSON.parse(content) as T;
  } catch {
    throw new AIResponseError("AI returned malformed JSON. Try again.");
  }
}

export async function textCompletion(
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const client = await getClient();
  const response = await client.chat.completions.create({
    model: DEFAULT_MODEL,
    max_completion_tokens: 8192,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });
  return response.choices[0]?.message?.content ?? "";
}
