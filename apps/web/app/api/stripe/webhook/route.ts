import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";

function mapSubscriptionStatus(status: Stripe.Subscription.Status): "ACTIVE" | "PAST_DUE" | "CANCELED" | "INACTIVE" {
  switch (status) {
    case "active":
    case "trialing":
      return "ACTIVE";
    case "past_due":
    case "unpaid":
      return "PAST_DUE";
    case "canceled":
    case "incomplete_expired":
      return "CANCELED";
    default:
      return "INACTIVE";
  }
}

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const rawBody = await req.text();

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: `Webhook signature verification failed: ${message}` }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const type = session.metadata?.type;

      if (type === "wallet_topup") {
        const ownerId = session.metadata?.ownerId;
        const amountCents = Number(session.metadata?.amountCents);
        if (ownerId && Number.isInteger(amountCents)) {
          await prisma.$transaction(async (tx) => {
            const wallet = await tx.wallet.findUnique({ where: { ownerId } });
            if (!wallet) return;
            const newBalance = wallet.balance + amountCents;
            await tx.wallet.update({ where: { id: wallet.id }, data: { balance: newBalance } });
            await tx.walletTransaction.create({
              data: {
                walletId: wallet.id,
                type: "TOPUP",
                amount: amountCents,
                balanceAfter: newBalance,
                stripePaymentIntentId:
                  typeof session.payment_intent === "string" ? session.payment_intent : undefined,
              },
            });
          });
        }
      }

      if (type === "walker_subscription") {
        const walkerProfileId = session.metadata?.walkerProfileId;
        const subscriptionId =
          typeof session.subscription === "string" ? session.subscription : undefined;
        if (walkerProfileId && subscriptionId) {
          await prisma.walkerProfile.update({
            where: { id: walkerProfileId },
            data: { stripeSubscriptionId: subscriptionId, subscriptionStatus: "ACTIVE" },
          });
        }
      }
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const walkerProfileId = subscription.metadata?.walkerProfileId;
      const status = mapSubscriptionStatus(subscription.status);

      if (walkerProfileId) {
        await prisma.walkerProfile.update({
          where: { id: walkerProfileId },
          data: { subscriptionStatus: status },
        });
      } else {
        await prisma.walkerProfile.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: { subscriptionStatus: status },
        });
      }
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
