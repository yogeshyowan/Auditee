import { useState } from "react";
import { SignInButton, useAuth, useUser } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { Check, Sparkles } from "lucide-react";
import { captureLeadNow, markWaitlistIntent } from "@/lib/leadCapture";

interface WaitlistButtonProps {
  label?: string;
  variant?: "default" | "outline" | "secondary";
  size?: "default" | "sm" | "lg";
  className?: string;
  testId?: string;
}

/**
 * Marketing-site CTA that opens Clerk's sign-in modal with Google as the
 * primary OAuth option. After the user authenticates, useLeadCapture (mounted
 * in App.tsx) posts a row with source="waitlist" because markWaitlistIntent
 * stashed a flag in sessionStorage before opening the modal.
 *
 * For users already signed in, renders a subtle "You're on the list" affordance.
 */
export function WaitlistButton({
  label = "Join the waitlist with Google",
  variant = "default",
  size = "lg",
  className,
  testId = "cta-waitlist",
}: WaitlistButtonProps) {
  const { isSignedIn, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [joined, setJoined] = useState(false);
  const [busy, setBusy] = useState(false);

  // Already signed in: capture a waitlist row directly (bypassing the modal).
  // The server's unique (email, source) constraint dedupes idempotently.
  if (isLoaded && isSignedIn) {
    if (joined) {
      return (
        <Button
          size={size}
          variant="secondary"
          className={className}
          disabled
          data-testid={`${testId}-joined`}
        >
          <Check className="mr-2 h-5 w-5" />
          You're on the list
        </Button>
      );
    }
    return (
      <Button
        size={size}
        variant={variant}
        className={className}
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          const ok = await captureLeadNow("waitlist", () => getToken());
          setBusy(false);
          if (ok) setJoined(true);
        }}
        data-testid={`${testId}-signedin`}
      >
        <Sparkles className="mr-2 h-5 w-5" />
        {busy ? "Joining…" : label}
      </Button>
    );
  }

  return (
    <SignInButton
      mode="modal"
      forceRedirectUrl={`${window.location.pathname}?intent=waitlist`}
    >
      <Button
        size={size}
        variant={variant}
        className={className}
        onClick={() => markWaitlistIntent()}
        data-testid={testId}
      >
        <Sparkles className="mr-2 h-5 w-5" />
        {label}
      </Button>
    </SignInButton>
  );
}
