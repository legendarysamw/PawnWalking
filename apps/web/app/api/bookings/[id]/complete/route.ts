import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session || session.role !== "WALKER") {
    return NextResponse.json({ error: "Walker login required" }, { status: 401 });
  }

  const result = await prisma.booking.updateMany({
    where: { id: params.id, walkerId: session.userId, status: "ACCEPTED" },
    data: { status: "COMPLETED", completedAt: new Date() },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "Booking not found or not yours to complete" }, { status: 404 });
  }

  // Phase 1 note: the walk price was already collected into the platform's
  // Stripe balance when the owner topped up their wallet. Paying the walker
  // out (Stripe Connect transfer) is Phase 2 - schema already has
  // WalkerProfile.stripeAccountId ready for it.
  return NextResponse.json({ ok: true });
}
