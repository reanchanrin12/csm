import { PrismaClient, UserRole, EmployeeRole } from '@prisma/client';
import { scryptSync, randomBytes } from 'crypto';

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

async function main() {
  console.log('🌱 Seeding Super Admin for CSM...');

  // 1. Default Branch (Required for Employee relation)
  const defaultBranch = await prisma.branch.upsert({
    where: { name: 'PHNOM PENH' },
    update: {},
    create: {
      name: 'PHNOM PENH',
      address: 'Phnom Penh, Cambodia',
    },
  });

  // 2. Base Admin Employee
  const adminEmp = await prisma.employee.upsert({
    where: { email: 'admin@csm.local' },
    update: { branchId: defaultBranch.id },
    create: {
      englishName: 'System Admin',
      khmerName: 'អ្នកគ្រប់គ្រងប្រព័ន្ធ',
      email: 'admin@csm.local',
      phone: '012 000 000',
      role: EmployeeRole.ADMIN,
      salary: 1000,
      branchId: defaultBranch.id,
    },
  });

  // 3. Super Admin User
  const adminHash = hashPassword('admin123');
  await (prisma as any).user.upsert({
    where: { username: 'admin' },
    update: {
      passwordHash: adminHash,
      role: UserRole.SUPER_ADMIN,
      isActive: true,
      employeeId: adminEmp.id,
    },
    create: {
      username: 'admin',
      passwordHash: adminHash,
      role: UserRole.SUPER_ADMIN,
      isActive: true,
      employeeId: adminEmp.id,
    },
  });

  console.log('✅ Super Admin seeded successfully!');
  console.log('👉 Login: username "admin" / password "admin123"');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
