import { useEffect, useRef } from "react";
import { useAuth, useUser } from "@clerk/react";
import { useLocation } from "wouter";

/**
 * marketingstuffs.site email-automation tracking. Mirrors the snippet the
 * vendor recommends embedding via raw <script>, but adapted to React + Clerk:
 *
 *   - page_visit fires on every wouter route change
 *   - login fires once per browser session when Clerk transitions to signed-in
 *   - logout fires when Clerk transitions back to signed-out
 *   - window.msTrackPayment / window.msTrackCartAbandoned are exposed for
 *     non-React callers (e.g. a Razorpay completion handler) to invoke
 *
 * Email + name are pulled from the Clerk user; window._msUserEmail and
 * window._msUserName are kept in sync as a courtesy for any third-party code
 * that reads them directly.
 *
 * All requests are best-effort: failures (network down, vendor outage, ad
 * blockers) are swallowed so they cannot break the user's session.
 */

const MS_API = "https://marketingstuffs.site/__api/email/trigger";

const LOGIN_DEDUPE_KEY = "auditee.ms_login.last_user";

interface MsTrackPayload {
  event: string;
  email?: string;
  name?: string;
  metadata?: Record<string, unknown>;
}

declare global {
  interface Window {
    _msUserEmail?: string;
    _msUserName?: string;
    msTrackLogin?: (email: string, name: string) => void;
    msTrackLogout?: (email: string, name: string) => void;
    msTrackPayment?: (
      email: string,
      name: string,
      amount: number,
      orderId: string,
    ) => void;
    msTrackCartAbandoned?: (email: string, name: string) => void;
  }
}

export async function msTrack(payload: MsTrackPayload): Promise<void> {
  // The vendor endpoint does not return CORS headers for non-production
  // origins (Replit dev domains, localhost, preview links). Firing the
  // request anyway pollutes the browser console with a CORS error on every
  // page navigation, which (a) drowns out real defects during development
  // and (b) confuses anyone debugging the app. Skip the call entirely
  // outside production builds; in production it succeeds silently.
  if (!import.meta.env.PROD) return;
  try {
    await fetch(MS_API, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    /* best-effort, never throw */
  }
}

function readPrev(): string | null {
  try {
    return sessionStorage.getItem(LOGIN_DEDUPE_KEY);
  } catch {
    return null;
  }
}

function writePrev(userId: string | null) {
  try {
    if (userId) sessionStorage.setItem(LOGIN_DEDUPE_KEY, userId);
    else sessionStorage.removeItem(LOGIN_DEDUPE_KEY);
  } catch {
    /* sessionStorage may be unavailable; best effort only */
  }
}

function deriveIdentity(user: ReturnType<typeof useUser>["user"]): {
  email: string;
  name: string;
} {
  if (!user) return { email: "", name: "" };
  const email =
    user.primaryEmailAddress?.emailAddress ??
    user.emailAddresses[0]?.emailAddress ??
    "";
  const first = user.firstName ?? "";
  const last = user.lastName ?? "";
  const name = [first, last].filter(Boolean).join(" ") || user.username || email;
  return { email, name };
}

/**
 * Mount once at the top of the React tree. Wires up window globals, fires
 * page_visit on every route change, and dispatches login/logout when Clerk's
 * signed-in state transitions.
 */
export function useMarketingstuffs(): null {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { isLoaded: userLoaded, user } = useUser();
  const [location] = useLocation();
  const prevSignedInRef = useRef<boolean | null>(null);
  const prevIdentityRef = useRef<{ email: string; name: string }>({
    email: "",
    name: "",
  });

  // Expose imperative window helpers exactly once. They read the latest
  // identity off window._ms* fields the hook keeps up to date.
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.msTrackLogin = (email, name) => {
      void msTrack({ event: "login", email, name });
    };
    window.msTrackLogout = (email, name) => {
      void msTrack({ event: "logout", email, name });
    };
    window.msTrackPayment = (email, name, amount, orderId) => {
      void msTrack({
        event: "payment_completed",
        email,
        name,
        metadata: { amount, order_id: orderId },
      });
    };
    window.msTrackCartAbandoned = (email, name) => {
      void msTrack({ event: "cart_abandoned", email, name });
    };
  }, []);

  // Keep window._msUserEmail / _msUserName in sync with the Clerk user.
  useEffect(() => {
    if (!authLoaded || !userLoaded) return;
    const identity = isSignedIn ? deriveIdentity(user) : { email: "", name: "" };
    prevIdentityRef.current = identity;
    if (typeof window !== "undefined") {
      window._msUserEmail = identity.email;
      window._msUserName = identity.name;
    }
  }, [authLoaded, userLoaded, isSignedIn, user]);

  // Fire page_visit on every navigation, including the initial mount.
  useEffect(() => {
    if (!authLoaded || !userLoaded) return;
    const { email, name } = isSignedIn
      ? deriveIdentity(user)
      : { email: "", name: "" };
    void msTrack({
      event: "page_visit",
      email,
      name,
      metadata: { page: location || "/" },
    });
  }, [authLoaded, userLoaded, isSignedIn, user, location]);

  // Fire login/logout on signed-in state transitions.
  useEffect(() => {
    if (!authLoaded || !userLoaded) return;

    const prev = prevSignedInRef.current;
    prevSignedInRef.current = isSignedIn;

    // First evaluation: don't fire anything, just record the baseline. If
    // they're already signed in on first load, dedupe via sessionStorage so
    // we still fire login once per browser session.
    if (prev === null) {
      if (isSignedIn && user) {
        const { email, name } = deriveIdentity(user);
        if (readPrev() !== user.id) {
          void msTrack({ event: "login", email, name });
          writePrev(user.id);
        }
      }
      return;
    }

    if (!prev && isSignedIn && user) {
      const { email, name } = deriveIdentity(user);
      if (readPrev() !== user.id) {
        void msTrack({ event: "login", email, name });
        writePrev(user.id);
      }
    } else if (prev && !isSignedIn) {
      // Use the last-known identity since the Clerk user is already gone.
      const { email, name } = prevIdentityRef.current;
      void msTrack({ event: "logout", email, name });
      writePrev(null);
    }
  }, [authLoaded, userLoaded, isSignedIn, user]);

  return null;
}
