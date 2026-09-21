import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Flat-rate price cards per zone, in cents. This is the "flat rate per
// neighbourhood" model: the owner always sees one transparent number before
// they book, it just varies by which zone they're booking in.
const ZONES = [
  { name: "Parkdale", city: "Toronto", price30: 2500, price60: 4500 },
  { name: "Liberty Village", city: "Toronto", price30: 2800, price60: 5000 },
  { name: "Trafalgar", city: "Oakville", price30: 3200, price60: 5600 },
];

async function main() {
  for (const zone of ZONES) {
    await prisma.zone.upsert({
      where: { name_city: { name: zone.name, city: zone.city } },
      update: { price30: zone.price30, price60: zone.price60 },
      create: zone,
    });
  }
  console.log(`Seeded ${ZONES.length} zones.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
