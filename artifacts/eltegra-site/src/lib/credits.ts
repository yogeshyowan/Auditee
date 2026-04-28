// Anonymous trial-credit tracking. Signed-in users have their credits tracked
// server-side (per workspace); anonymous browsers track usage in localStorage
// and forward it via the `x-anon-credits-used` header so the API can verify.

export const ANON_CREDIT_LIMIT = 10;
const STORAGE_KEY = "auditee.anonCreditsUsed";

export function getAnonCreditsUsed(): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

export function setAnonCreditsUsed(n: number): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, String(Math.max(0, Math.floor(n))));
}

export function resetAnonCredits(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export type UpsellDetail =
  | {
      kind: "login";
      message: string;
      creditsUsed: number;
      creditsLimit: number;
    }
  | {
      kind: "upgrade";
      message: string;
      plan: string;
      creditsUsed: number;
      creditsLimit: number;
    };

export function dispatchUpsell(detail: UpsellDetail): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<UpsellDetail>("auditee:upsell", { detail }));
}

/**
 * Wraps a `fetch` call so that:
 *   - cookies (Clerk session + anonymous trial id) flow with every request
 *   - on a successful response, the server's authoritative
 *     `x-credits-remaining` / `x-credits-limit` headers are mirrored into
 *     localStorage so any "credits left" UI can read them without an extra
 *     round trip (-1 = unlimited, skipped)
 *   - on a 402 response, we dispatch the upsell event so a global modal can
 *     surface the right CTA (login vs upgrade) — callers don't need to know
 */
export async function creditAwareFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const res = await fetch(input, {
    ...init,
    // The signed trial cookie + Clerk session cookie are both required for
    // the server to identify the caller and enforce the cap.
    credentials: init.credentials ?? "include",
  });

  if (res.status === 402) {
    let body: any = null;
    try {
      body = await res.clone().json();
    } catch {
      /* ignore */
    }
    if (body?.requiresUpgrade) {
      dispatchUpsell({
        kind: "upgrade",
        message: body.error ?? "Out of credits — upgrade your plan to continue.",
        plan: body.plan ?? "free",
        creditsUsed: body.creditsUsed ?? 0,
        creditsLimit: body.creditsLimit ?? ANON_CREDIT_LIMIT,
      });
    } else {
      // Bring the local counter in line with the server's view so the modal
      // doesn't immediately reopen on the next attempt.
      const limit = body?.creditsLimit ?? ANON_CREDIT_LIMIT;
      setAnonCreditsUsed(limit);
      dispatchUpsell({
        kind: "login",
        message: body?.error ?? `You've used your ${ANON_CREDIT_LIMIT} free generations. Sign in to keep going.`,
        creditsUsed: body?.creditsUsed ?? limit,
        creditsLimit: limit,
      });
    }
    return res;
  }

  // Sync local counter from the server's authoritative remaining count.
  const remainingHeader = res.headers.get("x-credits-remaining");
  const limitHeader = res.headers.get("x-credits-limit");
  if (res.ok && remainingHeader !== null && limitHeader !== null) {
    const remaining = Number(remainingHeader);
    const limit = Number(limitHeader);
    if (limit > 0 && Number.isFinite(remaining)) {
      setAnonCreditsUsed(Math.max(0, limit - remaining));
    }
  }

  return res;
}
