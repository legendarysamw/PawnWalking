import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = getSession();
  if (!session || session.role !== "WALKER") {
    return NextResponse.json({ error: "Walker login required" }, { status: 401 });
  }

  const walkerProfile = await prisma.walkerProfile.findUnique({
    where: { userId: session.userId },
  });
  if (!walkerProfile?.zoneId) return NextResponse.json([]);

  const bookings = await prisma.booking.findMany({
    where: { status: "PENDING", walkerId: null, zoneId: walkerProfile.zoneId },
    include: { zone: true },
    orderBy: { createdAt: "asc" },
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
      walkerName: null,
      createdAt: b.createdAt.toISOString(),
    })),
  );
}
