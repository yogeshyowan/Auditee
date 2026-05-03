import type { Request, Response, NextFunction } from "express";
import type { AuthedRequest } from "./authContext";

function ipToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    const v = Number(p);
    if (!Number.isInteger(v) || v < 0 || v > 255) return null;
    n = (n << 8) | v;
  }
  return n >>> 0;
}

function normalizeIp(raw: string): string {
  let ip = raw.trim();
  if (ip.startsWith("::ffff:")) ip = ip.slice(7);
  return ip;
}

export function ipMatchesCidr(ip: string, cidr: string): boolean {
  const ipv4 = normalizeIp(ip);
  const [base, maskStr] = cidr.includes("/") ? cidr.split("/") : [cidr, "32"];
  const ipInt = ipToInt(ipv4);
  const baseInt = ipToInt(base.trim());
  const mask = Number(maskStr);
  if (ipInt === null || baseInt === null || !Number.isInteger(mask) || mask < 0 || mask > 32) {
    return false;
  }
  if (mask === 0) return true;
  const maskBits = (~((1 << (32 - mask)) - 1)) >>> 0;
  return (ipInt & maskBits) === (baseInt & maskBits);
}

export function ipMatchesAnyCidr(ip: string, allowlist: readonly string[]): boolean {
  return allowlist.some((cidr) => ipMatchesCidr(ip, cidr));
}

export function ipAllowlistGuard(req: Request, res: Response, next: NextFunction): void {
  const ctx = (req as AuthedRequest).ws_ctx;
  const list = (ctx?.workspace?.ipAllowlist ?? []) as string[];
  if (!list || list.length === 0) { next(); return; }
  const remote = normalizeIp(req.ip ?? "");
  if (!remote) { res.status(403).json({ error: "Unable to determine source IP." }); return; }
  if (ipMatchesAnyCidr(remote, list)) { next(); return; }
  res.status(403).json({ error: "Source IP is not allowed for this workspace.", remote });
}
