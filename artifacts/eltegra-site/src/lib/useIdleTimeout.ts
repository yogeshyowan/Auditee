import { useEffect, useRef, useCallback } from "react";
import { useClerk } from "@clerk/react";
import { useToast } from "@/hooks/use-toast";

const IDLE_EVENTS: (keyof WindowEventMap)[] = [
  "mousemove",
  "keydown",
  "mousedown",
  "touchstart",
  "scroll",
  "click",
];

/**
 * Idle session timeout hook.
 *
 * Signs the user out and redirects to /sign-in after `timeoutMs` of
 * inactivity (default 30 minutes). Shows a toast warning 2 minutes
 * before sign-out so users can click to stay active.
 *
 * Required by HIPAA § 164.312(a)(2)(iii), PCI DSS Req 8.2.8, ISO 27001
 * A.9.4 (session lock after idle period).
 */
export function useIdleTimeout(timeoutMs = 30 * 60 * 1000) {
  const { signOut } = useClerk();
  const { toast } = useToast();
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningToastRef = useRef<{ dismiss: () => void } | null>(null);

  const WARN_BEFORE_MS = 2 * 60 * 1000; // warn 2 min before sign-out

  const clearTimers = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (warnTimer.current) clearTimeout(warnTimer.current);
  }, []);

  const resetTimers = useCallback(() => {
    clearTimers();
    // Dismiss any outstanding "about to sign out" toast
    warningToastRef.current?.dismiss();
    warningToastRef.current = null;

    // Warning toast fires 2 min before sign-out
    if (timeoutMs > WARN_BEFORE_MS) {
      warnTimer.current = setTimeout(() => {
        const { dismiss } = toast({
          title: "Session expiring soon",
          description: "You'll be signed out in 2 minutes due to inactivity. Move your mouse or press a key to stay signed in.",
          duration: WARN_BEFORE_MS,
        });
        warningToastRef.current = { dismiss };
      }, timeoutMs - WARN_BEFORE_MS);
    }

    // Sign-out timer
    idleTimer.current = setTimeout(() => {
      warningToastRef.current?.dismiss();
      toast({
        title: "Signed out due to inactivity",
        description: "Your session expired after 30 minutes of inactivity.",
        duration: 6000,
      });
      signOut({ redirectUrl: "/sign-in" });
    }, timeoutMs);
  }, [clearTimers, signOut, timeoutMs, toast]);

  useEffect(() => {
    resetTimers();

    const handleActivity = () => resetTimers();
    IDLE_EVENTS.forEach((ev) => window.addEventListener(ev, handleActivity, { passive: true }));

    return () => {
      clearTimers();
      IDLE_EVENTS.forEach((ev) => window.removeEventListener(ev, handleActivity));
    };
  }, [resetTimers, clearTimers]);
}
