import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding master data for CSM...');

  // 1. Branches
  const pp = await prisma.branch.upsert({
    where: { name: 'PHNOM PENH' },
    update: {},
    create: {
      name: 'PHNOM PENH',
      address: '#42 st Rusia road',
      phone1: '061 95 5555',
    },
  });

  const btb = await prisma.branch.upsert({
    where: { name: 'BATTAMBANG' },
    update: {},
    create: {
      name: 'BATTAMBANG',
      address: '#43A st National 5',
      phone1: '069 234567',
    },
  });

  const bokor = await prisma.branch.upsert({
    where: { name: 'BOKOR MONIVONG' },
    update: {},
    create: {
      name: 'BOKOR MONIVONG',
      address: 'Phnom Penh',
    },
  });

  // 2. Car Brands & Models
  const voyah = await prisma.carBrand.upsert({
    where: { name: 'VOYAH' },
    update: {},
    create: {
      name: 'VOYAH',
      models: {
        create: [
          { name: 'TAISHAN ULTRA' },
          { name: 'FREE RWD' },
          { name: 'DREAM PHEV' },
          { name: 'TAISHAN BLACK EDITION' },
        ],
      },
    },
  });

  const mhero = await prisma.carBrand.upsert({
    where: { name: 'MHERO' },
    update: {},
    create: {
      name: 'MHERO',
      models: {
        create: [{ name: '817' }],
      },
    },
  });

  // 3. Suppliers
  await prisma.supplier.createMany({
    skipDuplicates: true,
    data: [
      {
        nameEn: 'CHINA DONG FENG MOTOR INDUSTRY IMP&EXP CO., LTD',
        country: 'CHINA',
        phone: '+86-27-84301192',
        category: 'VEHICLE',
      },
      {
        nameEn: 'GENERAL DEPARTMENT OF CUSTOMS AND EXCISE',
        nameKh: 'អគ្គនាយកដ្ឋានគយនិងរដ្ឋាករកម្ពុជា',
        country: 'CAMBODIA',
        category: 'CUSTOMS',
      },
      {
        nameEn: 'UNION IMPORT EXPORT & TRANSPORT CO., LTD',
        country: 'CAMBODIA',
        category: 'LOGISTICS',
      },
      {
        nameEn: 'SIHANOUKVILLE PORT CLEARANCE AGENCY',
        nameKh: 'ភ្នាក់ងាររត់ការកំពង់ផែព្រះសីហនុ',
        country: 'CAMBODIA',
        category: 'LOGISTICS',
      },
      {
        nameEn: 'AUTO MASTER GARAGE & DETAILING',
        nameKh: 'យានដ្ឋាន អូតូម៉ាស្ទ័រ',
        country: 'CAMBODIA',
        category: 'REPAIR',
      },
    ],
  });

  // 4. Employees
  await prisma.employee.createMany({
    skipDuplicates: true,
    data: [
      {
        englishName: 'Sok Dara',
        khmerName: 'សុខ តារា',
        phone: '012 334 455',
        role: 'SALE',
        salary: 600,
        branchId: pp.id,
      },
      {
        englishName: 'Chan Vichea',
        khmerName: 'ចាន់ វិជ្ជា',
        phone: '087 665 544',
        role: 'SALE',
        salary: 650,
        branchId: pp.id,
      },
    ],
  });

  // 5. Customers
  await prisma.customer.createMany({
    skipDuplicates: true,
    data: [
      {
        name: 'Oknha Heng Ly',
        phone: '012 888 999',
        idCard: '010293847',
        address: 'Boeung Keng Kang 1, Phnom Penh',
      },
      {
        name: 'Lok Chumteav Keo Pich',
        phone: '017 777 555',
        idCard: '098765432',
        address: 'Toul Kork, Phnom Penh',
      },
    ],
  });

  // 6. Realistic Vehicles in Stock
  const freeModel = await prisma.carModel.findFirst({ where: { name: 'FREE RWD' } });
  const taishanModel = await prisma.carModel.findFirst({ where: { name: 'TAISHAN ULTRA' } });
  const mheroModel = await prisma.carModel.findFirst({ where: { name: '817' } });
  const supplier = await prisma.supplier.findFirst({ where: { category: 'VEHICLE' } });

  if (freeModel && supplier) {
    await prisma.vehicle.upsert({
      where: { vin: 'VOYAH2026FREE001' },
      update: {},
      create: {
        vin: 'VOYAH2026FREE001',
        modelId: freeModel.id,
        madeYear: 2026,
        exteriorColor: 'GLOSSY BLACK',
        interiorColor: 'BURGUNDY RED',
        fuelType: 'EV',
        batteryCapacity: '106 kWh',
        plateNumber: '2BQ-8899',
        purchaseCost: 58000,
        inSalePrice: 72000,
        branchId: pp.id,
        supplierId: supplier.id,
        status: 'IN_STOCK',
      },
    });
  }

  if (taishanModel && supplier) {
    await prisma.vehicle.upsert({
      where: { vin: 'VOYAH2026TAISH002' },
      update: {},
      create: {
        vin: 'VOYAH2026TAISH002',
        modelId: taishanModel.id,
        madeYear: 2026,
        exteriorColor: 'PEARL WHITE',
        interiorColor: 'OBSIDIAN BLACK',
        fuelType: 'EV',
        batteryCapacity: '108 kWh',
        purchaseCost: 75000,
        inSalePrice: 98000,
        branchId: pp.id,
        supplierId: supplier.id,
        status: 'IN_STOCK',
      },
    });
  }

  if (mheroModel && supplier) {
    await prisma.vehicle.upsert({
      where: { vin: 'MHERO2026E8170003' },
      update: {},
      create: {
        vin: 'MHERO2026E8170003',
        modelId: mheroModel.id,
        madeYear: 2026,
        exteriorColor: 'MATTE DESERT GREY',
        interiorColor: 'SADDLE ORANGE',
        fuelType: 'EV',
        batteryCapacity: '142 kWh',
        purchaseCost: 115000,
        inSalePrice: 148000,
        branchId: btb.id,
        supplierId: supplier.id,
        status: 'IN_STOCK',
      },
    });
  }

  // 7. System Users
  const { scryptSync, randomBytes } = await import('crypto');
  const salt = randomBytes(16).toString('hex');
  const derivedKey = scryptSync('admin123', salt, 64);
  const passwordHash = `${salt}:${derivedKey.toString('hex')}`;

  const adminEmp = await prisma.employee.findFirst({ where: { englishName: 'Sok Dara' } });

  await (prisma as any).user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash,
      role: 'SUPER_ADMIN',
      isActive: true,
      employeeId: adminEmp ? adminEmp.id : null,
    },
  });

  const saleSalt = randomBytes(16).toString('hex');
  const saleHash = `${saleSalt}:${scryptSync('sale123', saleSalt, 64).toString('hex')}`;
  const saleEmp = await prisma.employee.findFirst({ where: { englishName: 'Chan Vichea' } });

  await (prisma as any).user.upsert({
    where: { username: 'sale' },
    update: {},
    create: {
      username: 'sale',
      passwordHash: saleHash,
      role: 'SALE',
      isActive: true,
      employeeId: saleEmp ? saleEmp.id : null,
    },
  });

  console.log('✅ Seeding completed successfully (Default login: admin / admin123)!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
