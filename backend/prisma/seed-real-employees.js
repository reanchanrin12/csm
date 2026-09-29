const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding exact employees from reference image...');

  const ppBranch = await prisma.branch.findFirst({
    where: { name: 'PHNOM PENH' },
  });

  if (!ppBranch) {
    console.error('PHNOM PENH branch not found!');
    process.exit(1);
  }

  const realEmployees = [
    {
      englishName: 'Chahtola',
      khmerName: null,
      gender: 'Male',
      phone: '0767777450',
      jobPosition: 'Stock Controller',
      role: 'STOCK_CONTROLLER',
      salary: 400,
      branchId: ppBranch.id,
    },
    {
      englishName: 'Chhem Sreyna',
      khmerName: 'ឆែម ស្រីណា',
      gender: 'Female',
      phone: '077699778',
      jobPosition: 'Account Receivable',
      role: 'ACCOUNTANT',
      salary: 350,
      branchId: ppBranch.id,
    },
    {
      englishName: 'Chhoun Sovann Veasna',
      khmerName: 'ឈួន សុវណ្ណវាសនា',
      gender: 'Male',
      phone: '077333386',
      jobPosition: 'GM Production',
      role: 'ADMIN',
      salary: 1800,
      branchId: ppBranch.id,
    },
    {
      englishName: 'Doeun Mal',
      khmerName: 'ដឿន ម៉ាលី',
      gender: 'Female',
      phone: '085777768',
      jobPosition: 'Accountant',
      role: 'ACCOUNTANT',
      salary: 400,
      branchId: ppBranch.id,
    },
    {
      englishName: 'HARCH HEAR',
      khmerName: 'ហាច ហ៊ា',
      gender: 'Male',
      phone: '070712994',
      jobPosition: 'Technician',
      role: 'TECHNICIAN',
      salary: 140,
      branchId: ppBranch.id,
    },
    {
      englishName: 'Hei Rachana',
      khmerName: 'hei Rachana',
      gender: 'Female',
      phone: '0763636369',
      jobPosition: 'sale',
      role: 'SALE',
      salary: 500,
      branchId: ppBranch.id,
    },
    {
      englishName: 'HUY LYPRORSITH',
      khmerName: 'ហ៊ុយ លីប្រុសសិទ្ធ',
      gender: 'Male',
      phone: '0769927778',
      jobPosition: 'Head of Sales and Marketing',
      role: 'ADMIN',
      salary: 1000,
      branchId: ppBranch.id,
    },
    {
      englishName: 'KAN KUOY',
      khmerName: 'កាន គួយ',
      gender: 'Male',
      phone: '012368967',
      jobPosition: 'Technician',
      role: 'TECHNICIAN',
      salary: 190,
      branchId: ppBranch.id,
    },
    {
      englishName: 'KEN SAMNANG',
      khmerName: 'កែន សំណាង',
      gender: 'Male',
      phone: '093354331',
      jobPosition: 'Car Polish',
      role: 'TECHNICIAN',
      salary: 140,
      branchId: ppBranch.id,
    },
    {
      englishName: 'kong veykhoung',
      khmerName: 'គង់ វៃឃួង',
      gender: 'Male',
      phone: '0768900066',
      jobPosition: 'sale',
      role: 'SALE',
      salary: 500,
      branchId: ppBranch.id,
    },
  ];

  for (const emp of realEmployees) {
    const existing = await prisma.employee.findFirst({
      where: { englishName: emp.englishName },
    });

    if (existing) {
      await prisma.employee.update({
        where: { id: existing.id },
        data: emp,
      });
      console.log(`Updated ${emp.englishName}`);
    } else {
      await prisma.employee.create({
        data: emp,
      });
      console.log(`Created ${emp.englishName}`);
    }
  }

  // Also seed sample salary payments so the Salary Payment tab isn't blank
  const emp1 = await prisma.employee.findFirst({ where: { englishName: 'Chahtola' } });
  const emp2 = await prisma.employee.findFirst({ where: { englishName: 'Chhem Sreyna' } });
  const emp3 = await prisma.employee.findFirst({ where: { englishName: 'Chhoun Sovann Veasna' } });

  if (emp1) {
    await prisma.salaryPayment.create({
      data: {
        employeeId: emp1.id,
        paidDate: new Date('2026-09-26'),
        payAmount: 400,
        actualSalary: 400,
        payStatus: 'full payment',
        description: 'Monthly payroll for Sep 2026',
      },
    });
  }

  if (emp2) {
    await prisma.salaryPayment.create({
      data: {
        employeeId: emp2.id,
        paidDate: new Date('2026-09-26'),
        payAmount: 350,
        actualSalary: 350,
        payStatus: 'full payment',
        description: 'Monthly payroll for Sep 2026',
      },
    });
  }

  if (emp3) {
    await prisma.salaryPayment.create({
      data: {
        employeeId: emp3.id,
        paidDate: new Date('2026-09-26'),
        payAmount: 1800,
        actualSalary: 1800,
        payStatus: 'full payment',
        description: 'GM monthly payroll',
      },
    });
  }

  console.log('✅ Real employees and salary payments seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
