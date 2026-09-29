const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding clearance and tax bills...');

  // 1. Ensure Suppliers exist
  let customs = await prisma.supplier.findFirst({
    where: { nameEn: 'GENERAL DEPARTMENT OF CUSTOMS AND EXCISE' },
  });
  if (!customs) {
    customs = await prisma.supplier.create({
      data: {
        nameEn: 'GENERAL DEPARTMENT OF CUSTOMS AND EXCISE',
        nameKh: 'អគ្គនាយកដ្ឋានគយ និងរដ្ឋាករកម្ពុជា',
        country: 'Cambodia',
        supplierType: 'CUSTOMS',
      },
    });
  }

  let unionLogistics = await prisma.supplier.findFirst({
    where: { nameEn: 'UNION IMPORT EXPORT & TRANSPORT CO., LTD' },
  });
  if (!unionLogistics) {
    unionLogistics = await prisma.supplier.create({
      data: {
        nameEn: 'UNION IMPORT EXPORT & TRANSPORT CO., LTD',
        nameKh: 'យូញៀន អាហរ័ណ នីហរ័ណ & ដឹកជញ្ជូន',
        country: 'Cambodia',
        supplierType: 'LOGISTICS',
      },
    });
  }

  const vehicles = await prisma.vehicle.findMany({ take: 10 });
  const vehicleId = vehicles[0]?.id;

  // 2. Bills to create (matching Screenshot)
  const sampleBills = [
    {
      billNumber: '1511 TAX MHERO 817 2026 #3670',
      supplierId: customs.id,
      category: 'TAX',
      totalAmount: 16838.66,
      paidAmount: 16838.66,
      billDate: new Date('2026-08-11'),
      description: 'Tax payment for MHero 817 2026',
    },
    {
      billNumber: '1571 Tax MHERO 817 2026 #3668',
      supplierId: customs.id,
      category: 'TAX',
      totalAmount: 16825.40,
      paidAmount: 16825.40,
      billDate: new Date('2026-07-16'),
      description: 'Customs tax for MHero 817 #3668',
    },
    {
      billNumber: '1561 Tax MHERO 817 2026 #3669',
      supplierId: customs.id,
      category: 'TAX',
      totalAmount: 16834.68,
      paidAmount: 16834.68,
      billDate: new Date('2026-07-16'),
      description: 'Customs tax for MHero 817 #3669',
    },
    {
      billNumber: '2607-25 Clearance MHERO 817 2026 #3670 #3669 #3668 #3671 #3667 #3675 #3666 #3676 #3665 #3672',
      supplierId: unionLogistics.id,
      category: 'CLEARANCE',
      totalAmount: 22947.70,
      paidAmount: 22947.70,
      billDate: new Date('2026-07-10'),
      description: 'Clearance fee for 10 units MHero 817',
    },
    {
      billNumber: '2605-093 Bonded License Fee MHero 817 2026 2units #3318 #3323',
      supplierId: unionLogistics.id,
      category: 'CLEARANCE',
      totalAmount: 70.76,
      paidAmount: 70.76,
      billDate: new Date('2026-05-28'),
      description: 'Bonded License Fee for 2 units',
    },
    {
      billNumber: '2605-091 Bonded License Fee MHero 817 2026 5units #3314 #3315 #3317 #3319 #3321',
      supplierId: unionLogistics.id,
      category: 'CLEARANCE',
      totalAmount: 164.38,
      paidAmount: 164.38,
      billDate: new Date('2026-05-27'),
      description: 'Bonded license fee for 5 units MHero 817',
    },
    {
      billNumber: 'MHPR26010 Tax MHero 817 2026 2units #3318 #3323',
      supplierId: customs.id,
      category: 'TAX',
      totalAmount: 33564.63,
      paidAmount: 33564.63,
      billDate: new Date('2026-05-28'),
      description: 'Tax for 2 units MHero',
    },
    {
      billNumber: 'MHPR26009 Tax MHero 817 2026 5units #3314 #3315 #3317 #3319 #3321',
      supplierId: customs.id,
      category: 'TAX',
      totalAmount: 84078.03,
      paidAmount: 84078.03,
      billDate: new Date('2026-05-27'),
      description: 'Tax for 5 units MHero',
    },
  ];

  for (const b of sampleBills) {
    const existing = await prisma.landedCostBill.findUnique({
      where: { billNumber: b.billNumber },
    });
    if (!existing) {
      const created = await prisma.landedCostBill.create({
        data: {
          billNumber: b.billNumber,
          supplierId: b.supplierId,
          category: b.category,
          totalAmount: b.totalAmount,
          paidAmount: b.paidAmount,
          billDate: b.billDate,
          description: b.description,
        },
      });

      if (vehicleId) {
        await prisma.vehicleCostItem.create({
          data: {
            vehicleId,
            costType: b.category,
            amount: b.totalAmount,
            billId: created.id,
            note: b.description,
          },
        });
      }
    }
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
