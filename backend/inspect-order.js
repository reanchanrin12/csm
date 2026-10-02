const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.saleOrder.findMany({
    include: {
      vehicle: {
        include: {
          model: { include: { brand: true } },
          costItems: true,
        },
      },
      customer: true,
      schedules: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  for (const o of orders) {
    const costSum = (o.vehicle?.costItems || []).reduce((sum, c) => sum + Number(c.amount), 0);
    const purchaseCost = Number(o.vehicle?.purchaseCost || 0);
    const landedCost = purchaseCost + costSum;
    console.log({
      id: o.id,
      receiptNo: o.receiptNo,
      soldPrice: Number(o.soldPrice),
      paidAmount: Number(o.paidAmount),
      bookPrice: Number(o.bookPrice),
      loanType: o.loanType,
      termMonths: o.termMonths,
      interestRate: Number(o.interestRate || 0),
      carBrand: o.vehicle?.model?.brand?.name,
      carModel: o.vehicle?.model?.name,
      vin: o.vehicle?.vin,
      purchaseCost,
      costSum,
      landedCost,
      grossProfit: Number(o.soldPrice) - landedCost,
      schedulesCount: o.schedules?.length || 0,
    });
  }
}

main().finally(() => prisma.$disconnect());
