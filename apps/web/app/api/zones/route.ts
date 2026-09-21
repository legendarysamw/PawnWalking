import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ZoneDto } from "@pawnwalking/shared";

export const dynamic = "force-dynamic";

export async function GET() {
  const zones = await prisma.zone.findMany({ orderBy: [{ city: "asc" }, { name: "asc" }] });
  const dto: ZoneDto[] = zones.map((z) => ({
    id: z.id,
    name: z.name,
    city: z.city,
    price30: z.price30,
    price60: z.price60,
  }));
  return NextResponse.json(dto);
}
