const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Country" (
      "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "name" TEXT NOT NULL UNIQUE,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('Country table created successfully or already exists!');

  const defaultCountries = [
    "BELGIUM",
    "CAMBODIA",
    "CANADA",
    "CHINA",
    "DENMARK",
    "DUBAI",
    "GERMANY",
    "HONG KONG",
    "JAPAN",
    "LAO PDR",
    "MALAYSIA",
  ];

  for (const name of defaultCountries) {
    await prisma.$executeRawUnsafe(`
      INSERT INTO "Country" ("id", "name", "createdAt", "updatedAt")
      VALUES (gen_random_uuid()::text, $1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT ("name") DO NOTHING;
    `, name);
  }

  const rows = await prisma.$queryRawUnsafe(`SELECT * FROM "Country" ORDER BY "name" ASC;`);
  console.log('Seeded countries:', rows.length);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
