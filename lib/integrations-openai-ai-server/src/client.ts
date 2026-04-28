import OpenAI from "openai";

const replitProxyBase = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
const replitProxyKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
const directKey = process.env.OPENAI_API_KEY;

let apiKey: string;
let baseURL: string | undefined;

if (replitProxyBase && replitProxyKey) {
  apiKey = replitProxyKey;
  baseURL = replitProxyBase;
} else if (directKey) {
  apiKey = directKey;
  baseURL = undefined;
} else {
  throw new Error(
    "OpenAI is not configured. Set OPENAI_API_KEY (Hetzner / self-hosted) " +
      "or both AI_INTEGRATIONS_OPENAI_BASE_URL and AI_INTEGRATIONS_OPENAI_API_KEY (Replit).",
  );
}

export const openai = new OpenAI({ apiKey, ...(baseURL ? { baseURL } : {}) });
