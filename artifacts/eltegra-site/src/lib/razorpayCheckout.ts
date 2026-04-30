/**
 * Lazy-load Razorpay's hosted Checkout JS and open the payment modal.
 * Razorpay don't ship a real npm package for the modal — the only supported
 * way to open it is to inject their hosted script and instantiate the global
 * `window.Razorpay`. We load it on demand so it doesn't bloat the initial
 * marketing-site bundle for visitors who never click subscribe.
 */

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

let scriptPromise: Promise<void> | null = null;

interface RazorpayOptions {
  key: string;
  name: string;
  description?: string;
  image?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  notes?: Record<string, string>;
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
  // Either subscription_id (for monthly) or order_id+amount (for annual).
  subscription_id?: string;
  order_id?: string;
  amount?: number;
  currency?: string;
  handler?: (response: RazorpayHandlerResponse) => void;
}

export interface RazorpayHandlerResponse {
  razorpay_payment_id: string;
  razorpay_subscription_id?: string;
  razorpay_order_id?: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open(): void;
  on(event: string, cb: (data: unknown) => void): void;
}

interface RazorpayConstructor {
  new (options: RazorpayOptions): RazorpayInstance;
}

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

export function loadRazorpayCheckoutScript(): Promise<void> {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Razorpay Checkout requires a browser environment."));
      return;
    }
    if (window.Razorpay) {
      resolve();
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${SCRIPT_SRC}"]`,
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Failed to load Razorpay Checkout script.")),
      );
      return;
    }
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () =>
      reject(new Error("Failed to load Razorpay Checkout script."));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

export async function openRazorpayCheckout(
  options: RazorpayOptions,
): Promise<RazorpayHandlerResponse> {
  await loadRazorpayCheckoutScript();
  if (!window.Razorpay) {
    throw new Error("Razorpay global was not exposed after script load.");
  }
  return new Promise((resolve, reject) => {
    let settled = false;
    const rzp = new window.Razorpay!({
      ...options,
      handler: (resp) => {
        settled = true;
        resolve(resp);
      },
      modal: {
        ondismiss: () => {
          if (!settled) reject(new Error("Checkout cancelled"));
        },
      },
    });
    rzp.on("payment.failed", (data) => {
      settled = true;
      reject(
        new Error(
          (data as { error?: { description?: string } })?.error?.description ??
            "Payment failed",
        ),
      );
    });
    rzp.open();
  });
}
