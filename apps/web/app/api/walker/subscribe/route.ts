import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { stripe } from "@/lib/stripe";

export async function POST() {
  const session = getSession();
  if (!session || session.role !== "WALKER") {
    return NextResponse.json({ error: "Walker login required" }, { status: 401 });
  }

  const priceId = process.env.STRIPE_WALKER_SUBSCRIPTION_PRICE_ID;
  if (!priceId) {
    return NextResponse.json(
      { error: "Subscription price is not configured (STRIPE_WALKER_SUBSCRIPTION_PRICE_ID)." },
      { status: 500 },
    );
  }

  const walkerProfile = await prisma.walkerProfile.findUnique({
    where: { userId: session.userId },
  });
  if (!walkerProfile) {
    return NextResponse.json({ error: "Walker profile not found" }, { status: 404 });
  }

  let customerId = walkerProfile.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.email,
      name: session.name,
      metadata: { walkerProfileId: walkerProfile.id, userId: session.userId },
    });
    customerId = customer.id;
    await prisma.walkerProfile.update({
      where: { id: walkerProfile.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: {
      type: "walker_subscription",
      walkerProfileId: walkerProfile.id,
      userId: session.userId,
    },
    subscription_data: {
      metadata: { walkerProfileId: walkerProfile.id, userId: session.userId },
    },
    success_url: `${appUrl}/walker?subscribed=success`,
    cancel_url: `${appUrl}/walker/subscribe?subscribed=cancelled`,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
