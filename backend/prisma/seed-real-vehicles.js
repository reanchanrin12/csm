const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const realVehiclesData = [
  {
    brand: 'VOYAH',
    model: 'TAISHAN BLACK EDITION',
    vin: 'LDP85H950TY785995',
    color: 'BLACK',
    year: 2026,
    engine: 'T0691371',
    cost: 75127.30,
    clearance: 0.00,
    tax: 0.00,
    transport: 0.00,
    container: 0.00,
    labor: 0.00,
    repair: 0.00,
  },
  {
    brand: 'VOYAH',
    model: 'TAISHAN BLACK EDITION',
    vin: 'LDP85H908TY785996',
    color: 'BLACK',
    year: 2026,
    engine: 'T0693072',
    cost: 75127.30,
    clearance: 0.00,
    tax: 0.00,
    transport: 0.00,
    container: 0.00,
    labor: 0.00,
    repair: 0.00,
  },
  {
    brand: 'VOYAH',
    model: 'FREE RWD',
    vin: 'LDF95E909TE150638',
    color: 'WHITE',
    year: 2026,
    engine: '25B031802',
    cost: 30051.51,
    clearance: 0.00,
    tax: 0.00,
    transport: 0.00,
    container: 0.00,
    labor: 0.00,
    repair: 0.00,
  },
  {
    brand: 'VOYAH',
    model: 'TAISHAN ULTRA',
    vin: 'LDP95H969TY783950',
    color: 'BLACK',
    year: 2026,
    engine: 'T0668830',
    cost: 69242.09,
    clearance: 0.00,
    tax: 0.00,
    transport: 0.00,
    container: 0.00,
    labor: 0.00,
    repair: 0.00,
  },
  {
    brand: 'MHERO',
    model: '817',
    vin: 'LDP29H920TMS23673',
    color: 'BLACK',
    year: 2026,
    engine: 'DFMC15TE6T0711217',
    cost: 46578.00,
    clearance: 2294.77,
    tax: 0.00,
    transport: 0.00,
    container: 0.00,
    labor: 0.00,
    repair: 0.00,
  },
  {
    brand: 'MHERO',
    model: '817',
    vin: 'LDP26H923TMS23666',
    color: 'WHITE',
    year: 2026,
    engine: 'DFMC15TE6T0711192',
    cost: 46578.00,
    clearance: 2294.77,
    tax: 0.00,
    transport: 0.00,
    container: 0.00,
    labor: 0.00,
    repair: 0.00,
  },
  {
    brand: 'MHERO',
    model: '817',
    vin: 'LDP20H925TMS23667',
    color: 'GREEN',
    year: 2026,
    engine: 'DFMC15TE6T0712487',
    cost: 46578.00,
    clearance: 2294.77,
    tax: 0.00,
    transport: 0.00,
    container: 0.00,
    labor: 0.00,
    repair: 0.00,
  },
  {
    brand: 'MHERO',
    model: '817',
    vin: 'LDP20H924TMS23675',
    color: 'BLACK',
    year: 2026,
    engine: 'DFMC15TE6T0712466',
    cost: 46578.00,
    clearance: 2294.77,
    tax: 0.00,
    transport: 0.00,
    container: 0.00,
    labor: 0.00,
    repair: 0.00,
  },
  {
    brand: 'MHERO',
    model: '817',
    vin: 'LDP29H929TMS23672',
    color: 'BLACK',
    year: 2026,
    engine: 'DFMC15TE6T0711205',
    cost: 46578.00,
    clearance: 2294.77,
    tax: 0.00,
    transport: 0.00,
    container: 0.00,
    labor: 0.00,
    repair: 0.00,
  },
  {
    brand: 'MHERO',
    model: '817',
    vin: 'LDP29H924TMS23522',
    color: 'WHITE',
    year: 2026,
    engine: 'T0678286',
    cost: 44688.26,
    clearance: 2362.87,
    tax: 0.00,
    transport: 0.00,
    container: 0.00,
    labor: 0.00,
    repair: 35.50,
  },
  {
    brand: 'VOYAH',
    model: 'DREAM EV',
    vin: 'LDP81C905TE054669',
    color: 'BLACK',
    year: 2026,
    engine: 'B6T102622',
    cost: 51037.83,
    clearance: 2432.47,
    tax: 0.00,
    transport: 1558.65,
    container: 0.00,
    labor: 0.00,
    repair: 907.50,
  },
  {
    brand: 'VOYAH',
    model: 'DREAM PHEV',
    vin: 'LDP85H907TE054671',
    color: 'WHITE',
    year: 2026,
    engine: 'T0653006',
    cost: 48153.25,
    clearance: 2432.47,
    tax: 0.00,
    transport: 1558.65,
    container: 0.00,
    labor: 0.00,
    repair: 37.50,
  },
];

async function seed() {
  console.log('Seeding real showroom vehicles matching reference screenshot...');

  // 1. Get or create Branch PHNOM PENH
  let branch = await prisma.branch.findFirst({
    where: { name: 'PHNOM PENH' },
  });
  if (!branch) {
    branch = await prisma.branch.create({
      data: {
        name: 'PHNOM PENH',
        address: 'Phnom Penh Showroom',
        phone1: '023 888 999',
      },
    });
  }

  // 2. Get or create Supplier
  let supplier = await prisma.supplier.findFirst({
    where: { nameEn: 'VOYAH MOTOR CORP' },
  });
  if (!supplier) {
    supplier = await prisma.supplier.create({
      data: {
        nameEn: 'VOYAH MOTOR CORP',
        nameKh: 'វ៉ូយ៉ា ម៉ូទ័រ',
        country: 'China',
        category: 'VEHICLE',
      },
    });
  }

  // 3. Clear existing vehicles to replace with real 12 vehicles
  await prisma.vehicleCostItem.deleteMany({});
  await prisma.vehicleTransfer.deleteMany({});
  await prisma.saleOrder.deleteMany({});
  await prisma.vehicle.deleteMany({});

  for (const v of realVehiclesData) {
    // 3a. Ensure brand
    let brand = await prisma.carBrand.findUnique({
      where: { name: v.brand },
    });
    if (!brand) {
      brand = await prisma.carBrand.create({
        data: { name: v.brand },
      });
    }

    // 3b. Ensure model
    let model = await prisma.carModel.findFirst({
      where: { brandId: brand.id, name: v.model },
    });
    if (!model) {
      model = await prisma.carModel.create({
        data: { brandId: brand.id, name: v.model },
      });
    }

    // 3c. Create Vehicle
    const createdVehicle = await prisma.vehicle.create({
      data: {
        vin: v.vin,
        engineNumber: v.engine,
        modelId: model.id,
        madeYear: v.year,
        exteriorColor: v.color,
        status: 'IN_STOCK',
        purchaseCost: v.cost,
        branchId: branch.id,
        supplierId: supplier.id,
      },
    });

    // 3d. Add Cost items if > 0
    const costEntries = [];
    if (v.clearance > 0) costEntries.push({ costType: 'CLEARANCE', amount: v.clearance });
    if (v.tax > 0) costEntries.push({ costType: 'TAX', amount: v.tax });
    if (v.transport > 0) costEntries.push({ costType: 'TRANSPORT', amount: v.transport });
    if (v.container > 0) costEntries.push({ costType: 'CONTAINER', amount: v.container });
    if (v.labor > 0) costEntries.push({ costType: 'LABOR', amount: v.labor });
    if (v.repair > 0) costEntries.push({ costType: 'REPAIR', amount: v.repair });

    for (const ce of costEntries) {
      await prisma.vehicleCostItem.create({
        data: {
          vehicleId: createdVehicle.id,
          costType: ce.costType,
          amount: ce.amount,
        },
      });
    }

    console.log(`Seeded Vehicle: ${v.brand} ${v.model} (${v.vin}) - Cost: $${v.cost}`);
  }

  console.log('Successfully seeded all 12 real vehicles with exact landed costs!');
}

seed()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
