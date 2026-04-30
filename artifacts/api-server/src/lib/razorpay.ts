import Razorpay from "razorpay";
import crypto from "node:crypto";
import { logger } from "./logger";

const KEY_ID = process.env["RAZORPAY_KEY_ID"];
const KEY_SECRET = process.env["RAZORPAY_KEY_SECRET"];
const WEBHOOK_SECRET = process.env["RAZORPAY_WEBHOOK_SECRET"];

if (!KEY_ID || !KEY_SECRET) {
  // Fail loud at boot rather than at first request — easier to diagnose.
  throw new Error(
    "RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set to enable billing.",
  );
}

if (!WEBHOOK_SECRET) {
  throw new Error(
    "RAZORPAY_WEBHOOK_SECRET must be set so the billing webhook can verify Razorpay signatures.",
  );
}

/** Singleton Razorpay client. Uses the configured Key ID + Secret to talk to
 *  the Razorpay API. Mode (Test vs Live) is implicit in which key is used —
 *  rzp_test_* keys hit Test mode, rzp_live_* keys hit Live mode. */
export const razorpay: Razorpay = new Razorpay({
  key_id: KEY_ID,
  key_secret: KEY_SECRET,
});

/** Public publishable Key ID. Safe to ship to the browser; the secret never
 *  leaves the server. The Checkout JS modal needs it to identify the merchant. */
export const RAZORPAY_PUBLIC_KEY_ID: string = KEY_ID;

/** Whether we're running against Live Razorpay (real money) or Test mode.
 *  Determined by key prefix per Razorpay's own convention. */
export const RAZORPAY_IS_LIVE: boolean = KEY_ID.startsWith("rzp_live_");

if (RAZORPAY_IS_LIVE) {
  logger.warn(
    "Razorpay configured in LIVE mode — real money will move on every successful checkout.",
  );
}

/**
 * Verify the signature returned by Razorpay Checkout after a successful
 * subscription first-charge. Razorpay computes the HMAC-SHA256 of
 * `${razorpay_payment_id}|${razorpay_subscription_id}` using the API secret.
 *
 * Returns true when the provided signature matches.
 */
export function verifySubscriptionPayment(args: {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
}): boolean {
  const expected = crypto
    .createHmac("sha256", KEY_SECRET!)
    .update(`${args.razorpay_payment_id}|${args.razorpay_subscription_id}`)
    .digest("hex");
  return timingSafeEqual(expected, args.razorpay_signature);
}

/**
 * Verify the signature returned by Razorpay Checkout after a successful
 * one-time order payment (used here for annual purchases). HMAC-SHA256 of
 * `${razorpay_order_id}|${razorpay_payment_id}` using the API secret.
 */
export function verifyOrderPayment(args: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): boolean {
  const expected = crypto
    .createHmac("sha256", KEY_SECRET!)
    .update(`${args.razorpay_order_id}|${args.razorpay_payment_id}`)
    .digest("hex");
  return timingSafeEqual(expected, args.razorpay_signature);
}

/**
 * Verify a webhook delivery. Razorpay sends `X-Razorpay-Signature` =
 * HMAC-SHA256(rawBody, RAZORPAY_WEBHOOK_SECRET). The raw request body
 * (bytes, NOT JSON-parsed) is required.
 */
export function verifyWebhookSignature(
  rawBody: Buffer,
  signature: string,
): boolean {
  const expected = crypto
    .createHmac("sha256", WEBHOOK_SECRET!)
    .update(rawBody)
    .digest("hex");
  return timingSafeEqual(expected, signature);
}

function timingSafeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}
