-- CreateEnum
CREATE TYPE "FuelType" AS ENUM ('EV', 'PHEV', 'HYBRID', 'GASOLINE', 'DIESEL');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('IN_TRANSIT', 'IN_STOCK', 'RESERVED', 'SOLD', 'UNDER_REPAIR');

-- CreateEnum
CREATE TYPE "LoanType" AS ENUM ('FULL_PAYMENT', 'INSTALLMENT_FLAT', 'INSTALLMENT_DECLINING', 'BANK_LOAN');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID', 'OVERDUE');

-- CreateEnum
CREATE TYPE "EmployeeRole" AS ENUM ('ADMIN', 'STOCK_CONTROLLER', 'ACCOUNTANT', 'SALE', 'TECHNICIAN');

-- CreateEnum
CREATE TYPE "CostCategory" AS ENUM ('TAX', 'CLEARANCE', 'TRANSPORT', 'CONTAINER', 'LABOR', 'REPAIR', 'ACCESSORY');

-- CreateEnum
CREATE TYPE "SupplierType" AS ENUM ('VEHICLE', 'LOGISTICS', 'REPAIR', 'CUSTOMS');

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone1" TEXT,
    "phone2" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarBrand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CarBrand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarModel" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CarModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameKh" TEXT,
    "country" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "category" "SupplierType" NOT NULL DEFAULT 'VEHICLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gender" TEXT,
    "dob" TIMESTAMP(3),
    "idCard" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "job" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "englishName" TEXT NOT NULL,
    "khmerName" TEXT,
    "gender" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "role" "EmployeeRole" NOT NULL DEFAULT 'SALE',
    "salary" DECIMAL(10,2) NOT NULL,
    "branchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "vin" TEXT NOT NULL,
    "engineNumber" TEXT,
    "modelId" TEXT NOT NULL,
    "madeYear" INTEGER NOT NULL,
    "cylinderDisp" TEXT,
    "exteriorColor" TEXT NOT NULL,
    "interiorColor" TEXT,
    "fuelType" "FuelType" NOT NULL DEFAULT 'EV',
    "batteryCapacity" TEXT,
    "plateNumber" TEXT,
    "registrationCard" TEXT,
    "arrivalDate" TIMESTAMP(3),
    "coverImageUrl" TEXT,
    "galleryImages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "VehicleStatus" NOT NULL DEFAULT 'IN_STOCK',
    "purchaseCost" DECIMAL(12,2) NOT NULL,
    "inSalePrice" DECIMAL(12,2),
    "branchId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleCostItem" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "costType" "CostCategory" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "billId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehicleCostItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LandedCostBill" (
    "id" TEXT NOT NULL,
    "billNumber" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "category" "CostCategory" NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "paidAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "billDate" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LandedCostBill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleTransfer" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "sourceBranchId" TEXT NOT NULL,
    "destBranchId" TEXT NOT NULL,
    "transferDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehicleTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleOrder" (
    "id" TEXT NOT NULL,
    "receiptNo" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "sellerEmployeeId" TEXT,
    "soldPrice" DECIMAL(12,2) NOT NULL,
    "soldDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "loanType" "LoanType" NOT NULL DEFAULT 'FULL_PAYMENT',
    "interestRate" DECIMAL(5,2),
    "termMonths" INTEGER,
    "disbursementDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaleOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoanSchedule" (
    "id" TEXT NOT NULL,
    "saleOrderId" TEXT NOT NULL,
    "installmentNo" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "principal" DECIMAL(12,2) NOT NULL,
    "interest" DECIMAL(12,2) NOT NULL,
    "totalDue" DECIMAL(12,2) NOT NULL,
    "paidAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "penalty" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "paidDate" TIMESTAMP(3),
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoanSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperatingExpense" (
    "id" TEXT NOT NULL,
    "expenseDate" TIMESTAMP(3) NOT NULL,
    "expenseTo" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperatingExpense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Branch_name_key" ON "Branch"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CarBrand_name_key" ON "CarBrand"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_email_key" ON "Employee"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_vin_key" ON "Vehicle"("vin");

-- CreateIndex
CREATE INDEX "Vehicle_vin_idx" ON "Vehicle"("vin");

-- CreateIndex
CREATE INDEX "Vehicle_status_idx" ON "Vehicle"("status");

-- CreateIndex
CREATE INDEX "Vehicle_branchId_idx" ON "Vehicle"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "LandedCostBill_billNumber_key" ON "LandedCostBill"("billNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SaleOrder_receiptNo_key" ON "SaleOrder"("receiptNo");

-- CreateIndex
CREATE UNIQUE INDEX "SaleOrder_vehicleId_key" ON "SaleOrder"("vehicleId");

-- AddForeignKey
ALTER TABLE "CarModel" ADD CONSTRAINT "CarModel_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "CarBrand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "CarModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleCostItem" ADD CONSTRAINT "VehicleCostItem_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleCostItem" ADD CONSTRAINT "VehicleCostItem_billId_fkey" FOREIGN KEY ("billId") REFERENCES "LandedCostBill"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LandedCostBill" ADD CONSTRAINT "LandedCostBill_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleTransfer" ADD CONSTRAINT "VehicleTransfer_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleTransfer" ADD CONSTRAINT "VehicleTransfer_sourceBranchId_fkey" FOREIGN KEY ("sourceBranchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleTransfer" ADD CONSTRAINT "VehicleTransfer_destBranchId_fkey" FOREIGN KEY ("destBranchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleOrder" ADD CONSTRAINT "SaleOrder_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleOrder" ADD CONSTRAINT "SaleOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleOrder" ADD CONSTRAINT "SaleOrder_sellerEmployeeId_fkey" FOREIGN KEY ("sellerEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanSchedule" ADD CONSTRAINT "LoanSchedule_saleOrderId_fkey" FOREIGN KEY ("saleOrderId") REFERENCES "SaleOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
