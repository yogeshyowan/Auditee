// Hardened fetch wrapper.
// - Only allows http/https.
// - Refuses localhost / private IP ranges (RFC 1918, link-local, loopback,
//   ULA, multicast) so a malicious or misconfigured `host` config field can't
//   be used to scan the cluster's internal network.
// - Refuses the cloud-metadata endpoints used on AWS/GCP/Azure.
// - Default 15-second timeout via AbortController.
// - Manual redirect handling — follow-on hops would re-route past the SSRF
//   guards we just performed.

import { lookup as dnsLookup } from "node:dns/promises";
import { isIP } from "node:net";

function isPrivateIP(ip: string): boolean {
  const v = isIP(ip);
  if (!v) return false;
  if (v === 4) {
    const [a, b] = ip.split(".").map(Number);
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b! >= 16 && b! <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a! >= 224) return true;
    return false;
  }
  const lower = ip.toLowerCase();
  if (lower === "::1" || lower === "::") return true;
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true;
  if (/^fe[89ab]/.test(lower)) return true;
  return false;
}

export async function safeFetch(rawUrl: string, init: RequestInit = {}, timeoutMs = 15_000): Promise<Response> {
  let url: URL;
  try { url = new URL(rawUrl); } catch { throw new Error("Invalid URL"); }
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("Only http(s) URLs are allowed");
  if (url.hostname === "localhost" || url.hostname === "0.0.0.0") throw new Error("Refusing to connect to local host");
  if (url.hostname === "metadata.google.internal" || url.hostname === "metadata") {
    throw new Error("Refusing to connect to cloud metadata endpoints");
  }
  try {
    const addrs = await dnsLookup(url.hostname, { all: true });
    for (const a of addrs) {
      if (isPrivateIP(a.address)) throw new Error(`Refusing to connect to private/internal address (${a.address})`);
    }
  } catch (err: any) {
    if (err.message?.startsWith("Refusing")) throw err;
    throw new Error(`DNS lookup failed for ${url.hostname}: ${err.message}`);
  }
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);
  try {
    return await fetch(rawUrl, { ...init, signal: ac.signal, redirect: "manual" });
  } finally {
    clearTimeout(t);
  }
}
