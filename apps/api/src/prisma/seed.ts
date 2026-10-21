/* eslint-disable no-console */
import { PrismaClient, Prisma } from '@prisma/client';
import { parseDateOnly } from '../utils/date.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting development database seeding...');

  const demoPhone = '+919876543210';

  // Upsert demo user
  const user = await prisma.user.upsert({
    where: { phone: demoPhone },
    update: {},
    create: {
      phone: demoPhone,
    },
  });

  console.log(`👤 Demo User created/verified: ${user.phone} (${user.id})`);

  // Clear existing loans for demo user to have clean reproducible state
  await prisma.loan.deleteMany({
    where: { userId: user.id },
  });

  // Calculate dynamic dates relative to today
  const today = new Date();
  const past5Days = new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const past12Days = new Date(today.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const future7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // 1. Overdue Loan (Rahul, ₹1,500, outstanding)
  const loan1 = await prisma.loan.create({
    data: {
      userId: user.id,
      friendName: 'Rahul Sharma',
      amount: new Prisma.Decimal('1500.00'),
      dueDate: parseDateOnly(past5Days),
      isRepaid: false,
    },
  });

  // 2. Future Active Loan (Priya Patel, ₹2,000, outstanding)
  const loan2 = await prisma.loan.create({
    data: {
      userId: user.id,
      friendName: 'Priya Patel',
      amount: new Prisma.Decimal('2000.00'),
      dueDate: parseDateOnly(future7Days),
      isRepaid: false,
    },
  });

  // 3. Fully Repaid Loan (Amit Verma, ₹1,000, repaid)
  const loan3 = await prisma.loan.create({
    data: {
      userId: user.id,
      friendName: 'Amit Verma',
      amount: new Prisma.Decimal('1000.00'),
      dueDate: parseDateOnly(past12Days),
      isRepaid: true,
      repaidAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('✅ Seeding completed successfully:');
  console.log(`   - Loan 1 (Overdue): ${loan1.friendName} | ₹${loan1.amount} | Due: ${past5Days}`);
  console.log(`   - Loan 2 (Active):  ${loan2.friendName} | ₹${loan2.amount} | Due: ${future7Days}`);
  console.log(`   - Loan 3 (Repaid):  ${loan3.friendName} | ₹${loan3.amount} | Repaid`);
  console.log('📊 Expected Summary: Total Lent = ₹4500.00 | Total Repaid = ₹1000.00 | Overdue = ₹1500.00');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
