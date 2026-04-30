# Razorpay webhook setup

After deploying, register the webhook with Razorpay so subscriptions update,
annual orders get recorded, and `payment_completed` fires into marketingstuffs.

## URL to register

In the [Razorpay dashboard](https://dashboard.razorpay.com/) →
**Settings → Webhooks → + Add new webhook**, paste:

```
https://<your-deployed-domain>/api/billing/webhook
```

(Replace `<your-deployed-domain>` with the value from `$REPLIT_DOMAINS` for
this project — Replit publishes it over HTTPS automatically.)

## Secret

Set the **Secret** field to the value of the `RAZORPAY_WEBHOOK_SECRET`
environment variable (already present in this Replit project's secrets).
The server uses HMAC-SHA256 with this secret to verify every delivery — any
request with an invalid `x-razorpay-signature` header is rejected with `400`.

## Events to enable

Tick these and only these:

- `payment.captured` — fires for every successful payment (drives the
  marketingstuffs `payment_completed` event)
- `subscription.activated` — first successful charge of a monthly sub
- `subscription.charged` — every recurring monthly charge
- `subscription.cancelled` — user-cancelled or auto-cancelled by Razorpay
- `subscription.completed` — subscription reached its `total_count`
- `subscription.halted` — Razorpay halted after repeated payment failures
- `subscription.paused` — subscription was paused
- `order.paid` — fires when an annual one-time order is paid in full

## Behaviour

The webhook handler is **idempotent** — duplicate deliveries are no-ops thanks
to the `unique` index on `razorpay_payment_id` in the `payments` table. Razorpay
retries failed deliveries with exponential backoff, which is fine.

## Smoke test

1. From the Pricing page, signed in, click **Activate Standard** with the
   Monthly toggle.
2. Razorpay's test cards do **not** work in Live mode — use a real card with a
   small monthly plan. (₹1,999 will be charged immediately.)
3. After the modal closes, check:
   - `/app/billing` shows the new subscription panel with status `active`.
   - `payments` and `subscriptions` tables have new rows.
   - `marketingstuffs` received a `payment_completed` event.

## Local development

The webhook URL must be publicly reachable. For local testing without
deploying, expose your dev server with [ngrok](https://ngrok.com/) or similar
and point the Razorpay webhook at the tunnel URL. Otherwise, just deploy and
test against the live URL — that's what the project is built around.
