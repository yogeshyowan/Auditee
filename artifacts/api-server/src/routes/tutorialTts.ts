import { Router, type IRouter, type Request, type Response } from "express";
import { createHash } from "node:crypto";
import { textToSpeech } from "@workspace/integrations-openai-ai-server/audio";
import { generalLimiter } from "../middlewares/rateLimiter";

const router: IRouter = Router();

const MAX_CACHE_ENTRIES = 200;
const MAX_TEXT_LENGTH = 600;

const ALLOWED_VOICES = new Set([
  "alloy",
  "echo",
  "fable",
  "nova",
  "onyx",
  "shimmer",
]);

type CacheEntry = { buf: Buffer; lastUsed: number };
const cache = new Map<string, CacheEntry>();

function trim() {
  if (cache.size <= MAX_CACHE_ENTRIES) return;
  const entries = Array.from(cache.entries()).sort(
    (a, b) => a[1].lastUsed - b[1].lastUsed,
  );
  const toEvict = entries.slice(0, entries.length - MAX_CACHE_ENTRIES);
  for (const [k] of toEvict) cache.delete(k);
}

router.post(
  "/tutorial/tts",
  generalLimiter,
  async (req: Request, res: Response) => {
    const text =
      typeof req.body?.text === "string" ? req.body.text.trim() : "";
    const voiceParam =
      typeof req.body?.voice === "string" ? req.body.voice : "nova";

    if (!text) {
      res.status(400).json({ error: "text is required" });
      return;
    }
    if (text.length > MAX_TEXT_LENGTH) {
      res
        .status(400)
        .json({ error: `text must be <= ${MAX_TEXT_LENGTH} characters` });
      return;
    }

    const voice = (ALLOWED_VOICES.has(voiceParam) ? voiceParam : "nova") as
      | "alloy"
      | "echo"
      | "fable"
      | "nova"
      | "onyx"
      | "shimmer";

    // gpt-audio is a chat-completions modality; fixed config (no speed param).
    // Cache key = voice + text only.
    const cacheKey = createHash("sha256")
      .update(`gpt-audio|${voice}|mp3|${text}`)
      .digest("hex");

    const cached = cache.get(cacheKey);
    if (cached) {
      cached.lastUsed = Date.now();
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.setHeader("X-Tutorial-Tts-Cache", "hit");
      res.send(cached.buf);
      return;
    }

    if (!process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
      res
        .status(503)
        .json({ error: "TTS not configured (AI_INTEGRATIONS_OPENAI_API_KEY missing)" });
      return;
    }

    try {
      const buf = await textToSpeech(text, voice, "mp3");

      if (!buf || buf.length === 0) {
        res.status(502).json({ error: "TTS returned empty audio" });
        return;
      }

      cache.set(cacheKey, { buf, lastUsed: Date.now() });
      trim();

      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.setHeader("X-Tutorial-Tts-Cache", "miss");
      res.send(buf);
    } catch (err) {
      req.log.error({ err }, "tutorial/tts failed");
      res.status(502).json({ error: "TTS generation failed" });
    }
  },
);

export default router;
