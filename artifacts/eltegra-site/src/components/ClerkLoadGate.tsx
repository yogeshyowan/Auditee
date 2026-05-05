import { useAuth } from "@clerk/react";
import { useEffect, useState, type ReactNode } from "react";
import { Link } from "wouter";
import { Loader2, AlertTriangle, RefreshCw, Home, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ClerkLoadGateProps {
  children: ReactNode;
  fallback?: ReactNode;
  timeoutMs?: number;
}

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function DefaultLoading() {
  return (
    <div
      className="flex min-h-[60vh] items-center justify-center px-4"
      data-testid="clerk-gate-loading"
    >
      <div className="flex flex-col items-center gap-3 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin text-[#6366f1]" />
        <p className="text-sm">Loading secure sign-in…</p>
      </div>
    </div>
  );
}

function DefaultFallback() {
  return (
    <div
      className="flex min-h-[80vh] items-center justify-center px-4 py-12"
      data-testid="clerk-gate-fallback"
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/5">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h1 className="font-display text-2xl font-bold text-slate-900">
          Sign-in is temporarily unavailable
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          We couldn't reach our authentication service. This is usually a
          transient network issue. Please try again in a moment, or contact us
          if it persists.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Button
            onClick={() => window.location.reload()}
            data-testid="clerk-gate-retry"
            className="w-full bg-[#6366f1] hover:bg-[#5856eb] text-white"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try again
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/" data-testid="clerk-gate-home">
              <Home className="mr-2 h-4 w-4" />
              Back to home
            </Link>
          </Button>
          <Button asChild variant="ghost" className="w-full text-slate-600">
            <a
              href="mailto:hello@auditee.site?subject=Sign-in%20issue"
              data-testid="clerk-gate-contact"
            >
              <Mail className="mr-2 h-4 w-4" />
              Email support
            </a>
          </Button>
        </div>
        <p className="mt-6 text-center text-xs text-slate-400">
          Reference: auth.frontend-api unreachable
        </p>
      </div>
    </div>
  );
}

/**
 * Renders children once Clerk has loaded. While Clerk is still
 * initializing, shows a spinner. If Clerk fails to load within
 * `timeoutMs`, shows a friendly fallback instead of a blank page.
 *
 * Necessary because Clerk components (`<SignIn>`, `<SignUp>`,
 * `<Show>`) refuse to render until the Clerk frontend API is
 * reachable — when that API is down (e.g. a misconfigured satellite
 * domain), pages hang as blank white screens.
 */
export function ClerkLoadGate({
  children,
  fallback,
  timeoutMs = 8000,
}: ClerkLoadGateProps) {
  const { isLoaded } = useAuth();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      setTimedOut(false);
      return;
    }
    const id = window.setTimeout(() => setTimedOut(true), timeoutMs);
    return () => window.clearTimeout(id);
  }, [isLoaded, timeoutMs]);

  if (isLoaded) return <>{children}</>;
  if (timedOut) return <>{fallback ?? <DefaultFallback />}</>;
  return <DefaultLoading />;
}

export { DefaultFallback as ClerkUnavailableFallback };

export const __basePath = basePath;
