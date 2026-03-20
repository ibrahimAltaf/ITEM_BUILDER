import { Request, Response } from "express";
import Stripe from "stripe";
import { env } from "../../config/env";
import * as orderService from "../order/order.service";

export async function stripeWebhookHandler(
  req: Request,
  res: Response
): Promise<void> {
  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) {
    res.status(503).send("Stripe webhook not configured");
    return;
  }

  const stripe = new Stripe(env.STRIPE_SECRET_KEY);
  const sig = req.headers["stripe-signature"];
  if (!sig || typeof sig !== "string") {
    res.status(400).send("Missing stripe-signature");
    return;
  }

  let event: Stripe.Event;
  try {
    const buf = req.body;
    if (!Buffer.isBuffer(buf)) {
      res.status(400).send("Invalid body");
      return;
    }
    event = stripe.webhooks.constructEvent(buf, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch {
    res.status(400).send("Webhook signature verification failed");
    return;
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent & {
          charges?: { data: { payment_method_details?: { type?: string } }[] };
        };
        const pmType =
          pi.charges?.data?.[0]?.payment_method_details?.type ?? undefined;
        await orderService.markOrderPaidFromStripe(pi.id, pmType ?? null);
        break;
      }
      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        await orderService.markOrderPaymentFailed(pi.id);
        break;
      }
      default:
        break;
    }
  } catch (e) {
    console.error("Webhook handler error:", e);
    res.status(500).send("Handler error");
    return;
  }

  res.json({ received: true });
}
