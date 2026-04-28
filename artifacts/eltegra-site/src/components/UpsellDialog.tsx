import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Lock } from "lucide-react";
import type { UpsellDetail } from "@/lib/credits";

/**
 * Global modal listening for `auditee:upsell` window events. Triggered by
 * `creditAwareFetch` when the API returns 402 — either because the anonymous
 * trial is exhausted (login CTA) or the signed-in workspace is on Free and
 * needs to upgrade (billing CTA).
 */
export function UpsellDialog() {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<UpsellDetail | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<UpsellDetail>;
      if (!ce.detail) return;
      setDetail(ce.detail);
      setOpen(true);
    };
    window.addEventListener("auditee:upsell", handler);
    return () => window.removeEventListener("auditee:upsell", handler);
  }, []);

  if (!detail) return null;

  const isLogin = detail.kind === "login";
  const Icon = isLogin ? Lock : Sparkles;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent data-testid="upsell-dialog" className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center">
            {isLogin ? "You've used your free trial" : "Out of credits"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {detail.message}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border bg-muted/30 px-4 py-3 text-center text-sm">
          <span className="font-medium text-foreground">
            {detail.creditsUsed} / {detail.creditsLimit} credits used
          </span>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          {isLogin ? (
            <>
              <Button asChild className="w-full" data-testid="upsell-signup">
                <Link href="/sign-up">Sign up — it's free</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full"
                data-testid="upsell-signin"
              >
                <Link href="/sign-in">Sign in</Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                className="w-full"
                data-testid="upsell-pricing"
              >
                <Link href="/pricing">See paid plans</Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild className="w-full" data-testid="upsell-upgrade">
                <Link href="/app/billing">Upgrade plan</Link>
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setOpen(false)}
                data-testid="upsell-close"
              >
                Maybe later
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
