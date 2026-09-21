import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { stripe } from "@/lib/stripe";

const MIN_TOPUP_CENTS = 1000; // $10
const MAX_TOPUP_CENTS = 50000; // $500

export async function POST(req: NextRequest) {
  const session = getSession();
  if (!session || session.role !== "OWNER") {
    return NextResponse.json({ error: "Owner login required" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const amountCents = Number(body?.amountCents);
  if (!Number.isInteger(amountCents) || amountCents < MIN_TOPUP_CENTS || amountCents > MAX_TOPUP_CENTS) {
    return NextResponse.json(
      { error: `Amount must be between $${MIN_TOPUP_CENTS / 100} and $${MAX_TOPUP_CENTS / 100}` },
      { status: 400 },
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: session.email,
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: amountCents,
          product_data: { name: "PawnWalking wallet top-up" },
        },
        quantity: 1,
      },
    ],
    metadata: {
      type: "wallet_topup",
      ownerId: session.userId,
      amountCents: String(amountCents),
    },
    success_url: `${appUrl}/owner?topup=success`,
    cancel_url: `${appUrl}/owner/wallet?topup=cancelled`,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
