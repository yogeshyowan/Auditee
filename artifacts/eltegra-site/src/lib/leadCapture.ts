import { useEffect } from "react";
import { useAuth, useUser } from "@clerk/react";
import { useLocation } from "wouter";

export type LeadCaptureSource = "signup" | "login" | "waitlist";

const STORAGE_KEY = "auditee.lead_capture.last_post";

interface CaptureState {
  userId: string;
  source: LeadCaptureSource;
}

function readPrev(): CaptureState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CaptureState) : null;
  } catch {
    return null;
  }
}

function writePrev(state: CaptureState) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* sessionStorage may be unavailable; best effort only */
  }
}

function readWaitlistIntent(): boolean {
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.get("intent") === "waitlist") return true;
    return sessionStorage.getItem("auditee.waitlist_intent") === "1";
  } catch {
    return false;
  }
}

function clearWaitlistIntent() {
  try {
    sessionStorage.removeItem("auditee.waitlist_intent");
    const url = new URL(window.location.href);
    if (url.searchParams.get("intent") === "waitlist") {
      url.searchParams.delete("intent");
      window.history.replaceState({}, "", url.toString());
    }
  } catch {
    /* noop */
  }
}

/**
 * Marks the next sign-in as a waitlist capture. Call this just before opening
 * the Clerk sign-in modal from a marketing-page CTA.
 */
export function markWaitlistIntent() {
  try {
    sessionStorage.setItem("auditee.waitlist_intent", "1");
  } catch {
    /* noop */
  }
}

/**
 * Posts a capture row to the API. Returns true only on a 2xx response so the
 * caller can decide whether to mark the capture as durable in sessionStorage.
 * Logs warnings on failure but never throws (we don't want a tracking call to
 * break the user's session).
 */
async function postCapture(token: string, source: LeadCaptureSource): Promise<boolean> {
  try {
    const res = await fetch("/api/leads/capture", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ source }),
    });
    if (!res.ok) {
      console.warn("lead capture failed", res.status, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (err) {
    console.warn("lead capture network error", err);
    return false;
  }
}

/**
 * Imperative one-shot capture for buttons/CTAs (e.g. an already-signed-in user
 * clicking the waitlist button). Bypasses the per-session dedupe so the click
 * is always attempted; the server-side unique constraint still dedupes at the
 * data layer.
 */
export async function captureLeadNow(
  source: LeadCaptureSource,
  getToken: () => Promise<string | null>,
): Promise<boolean> {
  const token = await getToken().catch(() => null);
  if (!token) return false;
  return postCapture(token, source);
}

/**
 * Mount once at the top of the React tree. Detects when a Clerk user signs in
 * and posts a single capture row per (user, source) per browser session. The
 * source is derived from the URL (intent=waitlist) or the user's createdAt
 * timestamp (treats accounts under 5 minutes old as fresh signups).
 */
export function useLeadCapture(): null {
  const { isLoaded: authLoaded, isSignedIn, getToken } = useAuth();
  const { isLoaded: userLoaded, user } = useUser();
  const [location] = useLocation();

  useEffect(() => {
    if (!authLoaded || !userLoaded) return;
    if (!isSignedIn || !user) return;

    const isWaitlist = readWaitlistIntent();
    const createdAt = user.createdAt ? user.createdAt.getTime() : 0;
    const ageMs = Date.now() - createdAt;
    const isFresh = createdAt > 0 && ageMs < 5 * 60 * 1000;

    const source: LeadCaptureSource = isWaitlist
      ? "waitlist"
      : isFresh
        ? "signup"
        : "login";

    const prev = readPrev();
    if (prev && prev.userId === user.id && prev.source === source) return;

    void (async () => {
      const token = await getToken().catch(() => null);
      if (!token) return;
      const ok = await postCapture(token, source);
      // Only persist dedupe state and clear waitlist intent on a successful
      // round-trip; transient failures should retry on the next page load.
      if (ok) {
        writePrev({ userId: user.id, source });
        if (isWaitlist) clearWaitlistIntent();
      }
    })();
    // `location` is included so a navigation back to a page with
    // ?intent=waitlist re-evaluates without remounting the provider.
  }, [authLoaded, userLoaded, isSignedIn, user, getToken, location]);

  return null;
}
