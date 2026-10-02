const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const v = await prisma.vehicle.findUnique({
    where: { vin: 'XDERDHSJSJTE7565754' },
    include: {
      model: { include: { brand: true } },
      costItems: true,
      saleOrder: true,
    },
  });
  console.log(JSON.stringify(v, null, 2));
}

main().finally(() => prisma.$disconnect());
