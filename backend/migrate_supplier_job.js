const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const cols = await prisma.$queryRawUnsafe(`SELECT column_name FROM information_schema.columns WHERE table_name = 'Supplier';`);
  console.log('Supplier columns:', cols);
  await prisma.$executeRawUnsafe(`ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "job" TEXT;`);
  console.log('Added job column if not exists!');
}

run().catch(console.error).finally(() => prisma.$disconnect());
