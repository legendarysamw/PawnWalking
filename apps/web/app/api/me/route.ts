import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = getSession();
  if (!session) return NextResponse.json({ user: null });

  if (session.role === "OWNER") {
    const wallet = await prisma.wallet.findUnique({ where: { ownerId: session.userId } });
    return NextResponse.json({ user: session, wallet: { balance: wallet?.balance ?? 0 } });
  }

  const walkerProfile = await prisma.walkerProfile.findUnique({
    where: { userId: session.userId },
    include: { zone: true },
  });

  return NextResponse.json({
    user: session,
    walkerProfile: walkerProfile
      ? {
          subscriptionStatus: walkerProfile.subscriptionStatus,
          zoneName: walkerProfile.zone ? `${walkerProfile.zone.name}, ${walkerProfile.zone.city}` : null,
        }
      : null,
  });
}
