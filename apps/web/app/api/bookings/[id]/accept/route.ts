import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session || session.role !== "WALKER") {
    return NextResponse.json({ error: "Walker login required" }, { status: 401 });
  }

  const walkerProfile = await prisma.walkerProfile.findUnique({
    where: { userId: session.userId },
  });
  if (!walkerProfile || walkerProfile.subscriptionStatus !== "ACTIVE") {
    return NextResponse.json(
      { error: "An active subscription is required to accept bookings." },
      { status: 403 },
    );
  }

  // Conditional update so two walkers racing to accept the same booking
  // can't both succeed.
  const result = await prisma.booking.updateMany({
    where: { id: params.id, status: "PENDING", walkerId: null },
    data: { status: "ACCEPTED", walkerId: session.userId, acceptedAt: new Date() },
  });

  if (result.count === 0) {
    return NextResponse.json(
      { error: "This booking was already accepted by someone else." },
      { status: 409 },
    );
  }

  return NextResponse.json({ ok: true });
}
