import { jsonCompletion, AIResponseError } from "./ai";
import { logger } from "./logger";

export interface ExtractedFramework {
  code: string;
  name: string;
  category: string;
  description: string;
  controls: Array<{ code: string; title: string; description: string }>;
}

const SUPPORTED_MIMES: Record<string, "pdf" | "docx" | "text"> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/msword": "docx",
  "text/plain": "text",
  "text/markdown": "text",
};

const SUPPORTED_EXTS: Record<string, "pdf" | "docx" | "text"> = {
  pdf: "pdf",
  docx: "docx",
  doc: "docx",
  txt: "text",
  md: "text",
};

function detectKind(mimetype: string, filename: string): "pdf" | "docx" | "text" | null {
  if (SUPPORTED_MIMES[mimetype]) return SUPPORTED_MIMES[mimetype];
  const ext = (filename.split(".").pop() ?? "").toLowerCase();
  return SUPPORTED_EXTS[ext] ?? null;
}

export class UnsupportedStandardFormatError extends Error {
  constructor(filename: string) {
    super(
      `Unsupported file type for "${filename}". Upload a PDF, DOCX, or plain-text standard.`,
    );
    this.name = "UnsupportedStandardFormatError";
  }
}

export class EmptyStandardError extends Error {
  constructor() {
    super("Could not extract any text from the uploaded file. Is it a scan-only PDF?");
    this.name = "EmptyStandardError";
  }
}

/**
 * Extracts plain text from a PDF / DOCX / TXT buffer. Uses dynamic imports so
 * pdf-parse / mammoth are only loaded when an upload actually arrives — keeps
 * cold-start fast for the rest of the API.
 */
export async function extractTextFromUpload(
  buffer: Buffer,
  mimetype: string,
  filename: string,
): Promise<string> {
  const kind = detectKind(mimetype, filename);
  if (!kind) throw new UnsupportedStandardFormatError(filename);

  if (kind === "text") {
    return buffer.toString("utf-8");
  }

  if (kind === "pdf") {
    // pdf-parse default export shipped as both ESM and CJS; tolerate both.
    const mod: any = await import("pdf-parse");
    const pdf = mod.default ?? mod;
    const data = await pdf(buffer);
    return String(data?.text ?? "");
  }

  // docx
  const mod: any = await import("mammoth");
  const mammoth = mod.default ?? mod;
  const { value } = await mammoth.extractRawText({ buffer });
  return String(value ?? "");
}

const MAX_PROMPT_CHARS = 60_000; // GPT-4o context budget for the standard text

const SYSTEM_PROMPT = `You are an expert standards-and-compliance analyst. The user
will give you the raw text of a regulatory or industry standard (e.g. ISO 27001,
IEC 62443, a company SOP, a customer-specific compliance contract). Extract a
machine-readable representation of the standard.

Return ONLY a JSON object of this exact shape:

{
  "code": "<short uppercase identifier, e.g. ISO 27001 or COMPANY-SOP-01>",
  "name": "<human-readable full name of the standard>",
  "category": "<one of: Information Security, Functional Safety, Quality Management, Privacy, Industrial / OT Cybersecurity, Medical Devices, Automotive, Aerospace, Railway, Process Safety, Other>",
  "description": "<2-3 sentence summary of the standard's scope and intent>",
  "controls": [
    { "code": "<clause id, e.g. A.5.1 or 4.2.3>", "title": "<short title>", "description": "<1-3 sentence requirement statement>" }
  ]
}

Rules:
- Extract every clearly-identifiable clause, control, requirement, or section as
  a separate control entry. Aim for between 8 and 200 entries. Do not invent
  controls that are not in the source text.
- If the standard uses hierarchical numbering (4.1, 4.1.1, 4.1.2), include both
  parent and child entries when each has its own requirement statement.
- Keep code values short (under 32 characters) and unique within the response.
- If the source text is truncated, extract everything visible; do not extrapolate.
- Always return valid JSON. No prose, no markdown fences, no explanations.`;

/**
 * Calls the AI integration to turn the raw text of a standard into a structured
 * framework + controls list. Idempotent — caller must persist the result.
 */
export async function extractFrameworkFromText(
  rawText: string,
  fallbackName: string,
): Promise<ExtractedFramework> {
  const trimmed = rawText.trim();
  if (trimmed.length < 50) throw new EmptyStandardError();

  const truncated =
    trimmed.length > MAX_PROMPT_CHARS
      ? trimmed.slice(0, MAX_PROMPT_CHARS) +
        "\n\n[...document truncated for length; extract everything visible above...]"
      : trimmed;

  const userPrompt = `Source filename: ${fallbackName}\n\nRaw text of the standard:\n\n${truncated}`;

  let result: ExtractedFramework;
  try {
    result = await jsonCompletion<ExtractedFramework>(SYSTEM_PROMPT, userPrompt, {
      maxTokens: 8192,
    });
  } catch (err) {
    logger.error({ err, fallbackName }, "Standard extraction AI call failed");
    throw err;
  }

  // Defensive normalisation — the model is mostly reliable but sometimes drops
  // optional fields or returns weird types. Keep persistence robust.
  const code = String(result.code ?? "").trim() || fallbackName.toUpperCase().slice(0, 32);
  const name = String(result.name ?? "").trim() || fallbackName;
  const category = String(result.category ?? "").trim() || "Other";
  const description = String(result.description ?? "").trim();
  const controlsRaw = Array.isArray(result.controls) ? result.controls : [];

  const seenCodes = new Set<string>();
  const controls: ExtractedFramework["controls"] = [];
  for (const c of controlsRaw) {
    const cCode = String(c?.code ?? "").trim().slice(0, 64);
    const cTitle = String(c?.title ?? "").trim().slice(0, 500);
    const cDesc = String(c?.description ?? "").trim();
    if (!cCode || !cTitle) continue;
    if (seenCodes.has(cCode)) continue;
    seenCodes.add(cCode);
    controls.push({ code: cCode, title: cTitle, description: cDesc });
  }

  if (controls.length === 0) {
    throw new AIResponseError(
      "Auditee could not find any clauses in this document. Try a more structured copy of the standard.",
    );
  }

  return { code, name, category, description, controls };
}
