import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanTestData() {
  console.log('🧹 Starting cleanup of test transaction data...');

  // Delete transaction records in order of foreign key relationships
  const delLoan = await prisma.loanSchedule.deleteMany();
  console.log(`✓ Deleted ${delLoan.count} loan schedules.`);

  const delSales = await prisma.saleOrder.deleteMany();
  console.log(`✓ Deleted ${delSales.count} sale orders.`);

  const delCostItems = await prisma.vehicleCostItem.deleteMany();
  console.log(`✓ Deleted ${delCostItems.count} vehicle cost items.`);

  const delTransfers = await prisma.vehicleTransfer.deleteMany();
  console.log(`✓ Deleted ${delTransfers.count} vehicle transfers.`);

  const delBills = await prisma.landedCostBill.deleteMany();
  console.log(`✓ Deleted ${delBills.count} landed cost bills.`);

  const delVehicles = await prisma.vehicle.deleteMany();
  console.log(`✓ Deleted ${delVehicles.count} test vehicles.`);

  const delCustomers = await prisma.customer.deleteMany();
  console.log(`✓ Deleted ${delCustomers.count} test customers.`);

  const delExpenses = await prisma.operatingExpense.deleteMany();
  console.log(`✓ Deleted ${delExpenses.count} operating expenses.`);

  console.log('\n=============================================');
  console.log('✅ TEST DATA CLEANED SUCCESSFULLY!');
  console.log('🛡️ Preserved: Users, Employees, Branches, CarBrands, CarModels, Suppliers.');
  console.log('=============================================');
}

cleanTestData()
  .catch((e) => {
    console.error('❌ Error cleaning data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
