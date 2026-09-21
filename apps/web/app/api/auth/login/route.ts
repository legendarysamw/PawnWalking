import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encodeSession, SESSION_COOKIE_NAME } from "@/lib/session";
import type { Role } from "@pawnwalking/shared";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const role: Role = body?.role === "WALKER" ? "WALKER" : "OWNER";
  const zoneId = typeof body?.zoneId === "string" ? body.zoneId : undefined;

  if (!email || !name) {
    return NextResponse.json({ error: "name and email are required" }, { status: 400 });
  }

  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    user = await prisma.user.create({ data: { email, name, role } });

    if (role === "OWNER") {
      await prisma.wallet.create({ data: { ownerId: user.id, balance: 0 } });
    } else {
      await prisma.walkerProfile.create({
        data: { userId: user.id, zoneId: zoneId ?? null },
      });
    }
  } else if (user.role !== role) {
    return NextResponse.json(
      { error: `This email is already registered as a ${user.role.toLowerCase()}.` },
      { status: 409 },
    );
  }

  const cookieValue = encodeSession({
    userId: user.id,
    role: user.role as Role,
    email: user.email,
    name: user.name,
  });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE_NAME, cookieValue, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
