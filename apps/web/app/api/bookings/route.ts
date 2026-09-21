import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { priceForDuration, type DurationMinutes, type ZoneDto } from "@pawnwalking/shared";

export async function GET() {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const where =
    session.role === "OWNER" ? { ownerId: session.userId } : { walkerId: session.userId };

  const bookings = await prisma.booking.findMany({
    where,
    include: { zone: true, walker: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    bookings.map((b) => ({
      id: b.id,
      zoneId: b.zoneId,
      zoneName: `${b.zone.name}, ${b.zone.city}`,
      durationMinutes: b.durationMinutes,
      price: b.price,
      status: b.status,
      walkerId: b.walkerId,
      walkerName: b.walker?.name ?? null,
      createdAt: b.createdAt.toISOString(),
    })),
  );
}

export async function POST(req: NextRequest) {
  const session = getSession();
  if (!session || session.role !== "OWNER") {
    return NextResponse.json({ error: "Owner login required" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const zoneId = typeof body?.zoneId === "string" ? body.zoneId : null;
  const durationMinutes: DurationMinutes = body?.durationMinutes === 60 ? 60 : 30;

  if (!zoneId) {
    return NextResponse.json({ error: "zoneId is required" }, { status: 400 });
  }

  const zone = await prisma.zone.findUnique({ where: { id: zoneId } });
  if (!zone) return NextResponse.json({ error: "Unknown zone" }, { status: 404 });

  const price = priceForDuration(zone as unknown as ZoneDto, durationMinutes);

  try {
    const booking = await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { ownerId: session.userId } });
      if (!wallet || wallet.balance < price) {
        throw new Error("INSUFFICIENT_FUNDS");
      }

      const newBalance = wallet.balance - price;
      await tx.wallet.update({ where: { id: wallet.id }, data: { balance: newBalance } });

      const created = await tx.booking.create({
        data: {
          ownerId: session.userId,
          zoneId,
          durationMinutes,
          price,
          status: "PENDING",
        },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "BOOKING_DEBIT",
          amount: -price,
          balanceAfter: newBalance,
          bookingId: created.id,
        },
      });

      return created;
    });

    return NextResponse.json({ id: booking.id }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "INSUFFICIENT_FUNDS") {
      return NextResponse.json(
        { error: "Not enough wallet balance. Top up first." },
        { status: 402 },
      );
    }
    throw err;
  }
}
