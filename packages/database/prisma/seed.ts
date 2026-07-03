/**
 * SmartCanteen 360 — database seed.
 *
 * Idempotent: safe to run repeatedly (uses upsert on natural keys). Seeds the
 * RBAC catalogue, a demo company/tenant, an admin user, reference data and a
 * handful of employees with wallets, loyalty accounts and QR cards.
 *
 * Run:  pnpm db:seed
 */
import { randomBytes, randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { PrismaClient, Prisma } from '@prisma/client';
import {
  PERMISSIONS,
  ROLES,
  ROLE_PERMISSIONS,
  type RoleName,
} from '@smartcanteen/shared/rbac';

const prisma = new PrismaClient();

async function seedRbac() {
  console.log('→ Seeding permissions…');
  for (const p of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: p.key },
      update: { resource: p.resource, action: p.action, description: p.description },
      create: p,
    });
  }

  console.log('→ Seeding roles + grants…');
  for (const role of ROLES) {
    const created = await prisma.role.upsert({
      where: { name: role.name },
      update: { label: role.label, description: role.description },
      create: { name: role.name, label: role.label, description: role.description },
    });

    const keys = ROLE_PERMISSIONS[role.name as RoleName];
    const permissions = await prisma.permission.findMany({
      where: { key: { in: keys } },
      select: { id: true },
    });

    await prisma.rolePermission.deleteMany({ where: { roleId: created.id } });
    if (permissions.length > 0) {
      await prisma.rolePermission.createMany({
        data: permissions.map((perm) => ({ roleId: created.id, permissionId: perm.id })),
        skipDuplicates: true,
      });
    }
  }
}

async function seedCompany() {
  console.log('→ Seeding demo company…');
  return prisma.company.upsert({
    where: { slug: 'demo-corp' },
    update: {},
    create: {
      name: 'Demo Corp Canteen',
      slug: 'demo-corp',
      timezone: 'Africa/Johannesburg',
      currency: 'ZAR',
    },
  });
}

async function seedAdmin(companyId: string) {
  console.log('→ Seeding admin user…');
  const passwordHash = await bcrypt.hash('Admin@12345', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@smartcanteen.local' },
    update: { companyId, status: 'ACTIVE' },
    create: {
      companyId,
      email: 'admin@smartcanteen.local',
      passwordHash,
      firstName: 'System',
      lastName: 'Administrator',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
    },
  });

  const roleNames: RoleName[] = ['SUPER_ADMIN', 'COMPANY_ADMIN'];
  const roles = await prisma.role.findMany({ where: { name: { in: roleNames } } });
  for (const role of roles) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: admin.id, roleId: role.id } },
      update: {},
      create: { userId: admin.id, roleId: role.id },
    });
  }
  return admin;
}

async function seedReferenceData(companyId: string) {
  console.log('→ Seeding departments, cost centres, categories…');
  const departments = await Promise.all(
    ['Engineering', 'Operations', 'Finance', 'Human Resources'].map((name) =>
      prisma.department.upsert({
        where: { companyId_name: { companyId, name } },
        update: {},
        create: { companyId, name },
      }),
    ),
  );

  const costCentres = await Promise.all(
    [
      ['CC-1000', 'Head Office'],
      ['CC-2000', 'Production'],
    ].map(([code, name]) =>
      prisma.costCentre.upsert({
        where: { companyId_code: { companyId, code: code! } },
        update: { name: name! },
        create: { companyId, code: code!, name: name! },
      }),
    ),
  );

  const lunch = await prisma.mealCategory.upsert({
    where: { companyId_name: { companyId, name: 'Lunch Mains' } },
    update: {},
    create: { companyId, name: 'Lunch Mains', type: 'LUNCH', sortOrder: 1 },
  });

  const meals = [
    { name: 'Grilled Chicken & Veg', cost: 22.5, retail: 45, subsidy: 15, cal: 520 },
    { name: 'Beef Burger & Chips', cost: 28, retail: 55, subsidy: 20, cal: 780 },
    { name: 'Vegetable Curry & Rice', cost: 18, retail: 40, subsidy: 12, cal: 610 },
  ];
  for (const m of meals) {
    const meal = await prisma.meal.upsert({
      where: { id: `seed-${companyId}-${m.name}`.slice(0, 30) },
      update: {},
      create: {
        companyId,
        categoryId: lunch.id,
        name: m.name,
        description: `${m.name} — freshly prepared daily.`,
        costPrice: new Prisma.Decimal(m.cost),
        retailPrice: new Prisma.Decimal(m.retail),
        subsidyPrice: new Prisma.Decimal(m.subsidy),
        capacity: 200,
        isRecurring: true,
        status: 'PUBLISHED',
        nutrition: {
          create: {
            calories: new Prisma.Decimal(m.cal),
            protein: new Prisma.Decimal(35),
            carbs: new Prisma.Decimal(45),
            fat: new Prisma.Decimal(18),
          },
        },
      },
    });
    void meal;
  }

  console.log('→ Seeding retail products…');
  const retail = [
    ['Still Water 500ml', 'WATER', 12],
    ['Cola 330ml', 'COLD_DRINK', 18],
    ['Chocolate Bar', 'CHOCOLATE', 15],
    ['Cappuccino', 'COFFEE', 25],
  ] as const;
  for (const [name, category, price] of retail) {
    await prisma.retailProduct.upsert({
      where: { id: `seed-retail-${companyId}-${name}`.slice(0, 30) },
      update: {},
      create: {
        companyId,
        name,
        category,
        price: new Prisma.Decimal(price),
        costPrice: new Prisma.Decimal(Number(price) * 0.6),
      },
    });
  }

  return { departments, costCentres };
}

function qrPayload(employeeNumber: string) {
  // Placeholder encryption stand-in for the seed; the API encrypts with AES-256-GCM.
  const code = randomUUID();
  const encryptedData = randomBytes(24).toString('hex');
  return { code, encryptedData, ref: employeeNumber };
}

async function seedEmployees(
  companyId: string,
  departments: { id: string }[],
) {
  console.log('→ Seeding employees + wallets + loyalty + QR cards…');
  const people = [
    ['E-0001', 'Thabo', 'Nkosi'],
    ['E-0002', 'Aisha', 'Patel'],
    ['E-0003', 'Johan', 'van der Merwe'],
    ['E-0004', 'Lerato', 'Mokoena'],
    ['E-0005', 'Sipho', 'Dlamini'],
  ];

  for (let i = 0; i < people.length; i++) {
    const [num, first, last] = people[i]!;
    const dept = departments[i % departments.length]!;
    const employee = await prisma.employee.upsert({
      where: { companyId_employeeNumber: { companyId, employeeNumber: num! } },
      update: {},
      create: {
        companyId,
        employeeNumber: num!,
        firstName: first!,
        lastName: last!,
        email: `${first!.toLowerCase()}.${last!.split(' ').join('').toLowerCase()}@demo-corp.local`,
        departmentId: dept.id,
        mealSubsidy: new Prisma.Decimal(15),
        status: 'ACTIVE',
        wallet: { create: { balance: new Prisma.Decimal(250) } },
        loyaltyAccount: { create: { pointsBalance: 120, lifetimePoints: 340, tier: 'SILVER' } },
      },
    });

    const qr = qrPayload(num!);
    await prisma.qrCard.upsert({
      where: { employeeId: employee.id },
      update: {},
      create: {
        employeeId: employee.id,
        code: qr.code,
        encryptedData: qr.encryptedData,
      },
    });
  }
}

async function main() {
  console.log('🌱  Seeding SmartCanteen 360…');
  await seedRbac();
  const company = await seedCompany();
  await seedAdmin(company.id);
  const { departments } = await seedReferenceData(company.id);
  await seedEmployees(company.id, departments);
  console.log('✅  Seed complete.');
  console.log('    Admin login → admin@smartcanteen.local / Admin@12345');
}

main()
  .catch((err) => {
    console.error('❌  Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
