import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanTestData() {
  console.log('🧹 Starting cleanup of test transaction data...');

  // 1. Delete loan schedules
  const delLoan = await prisma.loanSchedule.deleteMany();
  console.log(`✓ Deleted ${delLoan.count} loan schedules.`);

  // 2. Delete sale orders
  const delSales = await prisma.saleOrder.deleteMany();
  console.log(`✓ Deleted ${delSales.count} sale orders.`);

  // 3. Delete vehicle cost items
  const delCostItems = await prisma.vehicleCostItem.deleteMany();
  console.log(`✓ Deleted ${delCostItems.count} vehicle cost items.`);

  // 4. Delete vehicle transfers
  const delTransfers = await prisma.vehicleTransfer.deleteMany();
  console.log(`✓ Deleted ${delTransfers.count} vehicle transfers.`);

  // 5. Delete landed cost bills
  const delBills = await prisma.landedCostBill.deleteMany();
  console.log(`✓ Deleted ${delBills.count} landed cost bills.`);

  // 6. Delete test vehicles
  const delVehicles = await prisma.vehicle.deleteMany();
  console.log(`✓ Deleted ${delVehicles.count} test vehicles.`);

  // 7. Delete test customers
  const delCustomers = await prisma.customer.deleteMany();
  console.log(`✓ Deleted ${delCustomers.count} test customers.`);

  // 8. Delete test suppliers
  const delSuppliers = await prisma.supplier.deleteMany();
  console.log(`✓ Deleted ${delSuppliers.count} test suppliers.`);

  // 9. Delete salary payments
  const delSalary = await prisma.salaryPayment.deleteMany();
  console.log(`✓ Deleted ${delSalary.count} salary payments.`);

  // 10. Delete operating expenses
  const delExpenses = await prisma.operatingExpense.deleteMany();
  console.log(`✓ Deleted ${delExpenses.count} operating expenses.`);

  // 11. Delete test sales employees who do NOT have a login user account
  const users = await prisma.user.findMany({ select: { employeeId: true } });
  const activeEmployeeIds = users.map((u) => u.employeeId).filter(Boolean) as string[];

  const delEmployees = await prisma.employee.deleteMany({
    where: {
      id: { notIn: activeEmployeeIds },
    },
  });
  console.log(`✓ Cleaned ${delEmployees.count} test employees (kept admin user employees).`);

  console.log('\n=============================================');
  console.log('✅ TEST DATA CLEANED SUCCESSFULLY!');
  console.log('🛡️ Preserved: Users, Admin Employee, Branches, CarBrands, CarModels.');
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
