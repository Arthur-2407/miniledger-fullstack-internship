import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { Prisma } from '@prisma/client';
import { app } from '../src/app.js';
import { prisma } from '../src/prisma/client.js';
import { signToken } from '../src/utils/jwt.js';
import { parseDateOnly } from '../src/utils/date.js';

describe('Summary Calculations API Tests', () => {
  let user1: { id: string; phone: string; token: string };
  let user2: { id: string; phone: string; token: string };

  beforeEach(async () => {
    const phone1 = '+919777700001';
    const phone2 = '+919777700002';

    await prisma.loan.deleteMany({
      where: { user: { phone: { in: [phone1, phone2] } } },
    });
    await prisma.user.deleteMany({
      where: { phone: { in: [phone1, phone2] } },
    });

    const dbUser1 = await prisma.user.create({ data: { phone: phone1 } });
    const dbUser2 = await prisma.user.create({ data: { phone: phone2 } });

    user1 = {
      id: dbUser1.id,
      phone: dbUser1.phone,
      token: signToken({ userId: dbUser1.id, phone: dbUser1.phone }),
    };

    user2 = {
      id: dbUser2.id,
      phone: dbUser2.phone,
      token: signToken({ userId: dbUser2.id, phone: dbUser2.phone }),
    };
  });

  afterAll(async () => {
    await prisma.loan.deleteMany({
      where: { user: { phone: { in: ['+919777700001', '+919777700002'] } } },
    });
    await prisma.user.deleteMany({
      where: { phone: { in: ['+919777700001', '+919777700002'] } },
    });
    await prisma.$disconnect();
  });

  it('returns zero totals when user has no loans', async () => {
    const res = await request(app)
      .get('/api/summary')
      .set('Authorization', `Bearer ${user1.token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual({
      totalLent: 0,
      totalRepaid: 0,
      overdueAmount: 0,
      currency: 'INR',
    });
  });

  it('correctly computes totals for outstanding, repaid, overdue, and due-today loans', async () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const pastStr = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const futureStr = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Loan 1: Outstanding, Overdue (past due date) => ₹1,000
    await prisma.loan.create({
      data: {
        userId: user1.id,
        friendName: 'Overdue Friend',
        amount: new Prisma.Decimal('1000.00'),
        dueDate: parseDateOnly(pastStr),
        isRepaid: false,
      },
    });

    // Loan 2: Outstanding, Due TODAY (should NOT be overdue per specs!) => ₹500
    await prisma.loan.create({
      data: {
        userId: user1.id,
        friendName: 'Today Friend',
        amount: new Prisma.Decimal('500.00'),
        dueDate: parseDateOnly(todayStr),
        isRepaid: false,
      },
    });

    // Loan 3: Outstanding, Future due date => ₹2,000
    await prisma.loan.create({
      data: {
        userId: user1.id,
        friendName: 'Future Friend',
        amount: new Prisma.Decimal('2000.00'),
        dueDate: parseDateOnly(futureStr),
        isRepaid: false,
      },
    });

    // Loan 4: Repaid loan with past due date (repaid loans do not count as overdue) => ₹1,500
    await prisma.loan.create({
      data: {
        userId: user1.id,
        friendName: 'Repaid Friend',
        amount: new Prisma.Decimal('1500.00'),
        dueDate: parseDateOnly(pastStr),
        isRepaid: true,
        repaidAt: new Date(),
      },
    });

    // Loan for User 2 (must NOT affect User 1's summary) => ₹10,000
    await prisma.loan.create({
      data: {
        userId: user2.id,
        friendName: 'User2 Friend',
        amount: new Prisma.Decimal('10000.00'),
        dueDate: parseDateOnly(pastStr),
        isRepaid: false,
      },
    });

    // Fetch summary for User 1
    const res = await request(app)
      .get('/api/summary')
      .set('Authorization', `Bearer ${user1.token}`);

    expect(res.status).toBe(200);
    // Total lent = 1000 + 500 + 2000 + 1500 = 5000
    expect(res.body.data.totalLent).toBe(5000);
    // Total repaid = 1500
    expect(res.body.data.totalRepaid).toBe(1500);
    // Overdue amount = 1000 (only Loan 1 is past due and unpaid; Loan 2 is due today, Loan 4 is repaid)
    expect(res.body.data.overdueAmount).toBe(1000);
    expect(res.body.data.currency).toBe('INR');
  });
});
