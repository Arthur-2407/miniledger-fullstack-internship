import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/prisma/client.js';
import { signToken } from '../src/utils/jwt.js';

describe('Loans API Module Tests', () => {
  let userA: { id: string; phone: string; token: string };
  let userB: { id: string; phone: string; token: string };

  beforeEach(async () => {
    // Setup 2 isolated test users
    const phoneA = '+919888800001';
    const phoneB = '+919888800002';

    await prisma.loan.deleteMany({
      where: { user: { phone: { in: [phoneA, phoneB] } } },
    });
    await prisma.user.deleteMany({
      where: { phone: { in: [phoneA, phoneB] } },
    });

    const dbUserA = await prisma.user.create({ data: { phone: phoneA } });
    const dbUserB = await prisma.user.create({ data: { phone: phoneB } });

    userA = {
      id: dbUserA.id,
      phone: dbUserA.phone,
      token: signToken({ userId: dbUserA.id, phone: dbUserA.phone }),
    };

    userB = {
      id: dbUserB.id,
      phone: dbUserB.phone,
      token: signToken({ userId: dbUserB.id, phone: dbUserB.phone }),
    };
  });

  afterAll(async () => {
    await prisma.loan.deleteMany({
      where: { user: { phone: { in: ['+919888800001', '+919888800002'] } } },
    });
    await prisma.user.deleteMany({
      where: { phone: { in: ['+919888800001', '+919888800002'] } },
    });
    await prisma.$disconnect();
  });

  it('allows authenticated user to create a valid loan', async () => {
    const res = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${userA.token}`)
      .send({
        friendName: 'Rohan Gupta',
        amount: 2500,
        dueDate: '2026-11-15',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.friendName).toBe('Rohan Gupta');
    expect(res.body.data.amount).toBe(2500);
    expect(res.body.data.dueDate).toBe('2026-11-15');
    expect(res.body.data.isRepaid).toBe(false);
  });

  it('rejects loan creation with nonpositive amount', async () => {
    const resNegative = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${userA.token}`)
      .send({
        friendName: 'Rohan Gupta',
        amount: -500,
        dueDate: '2026-11-15',
      });

    expect(resNegative.status).toBe(400);
    expect(resNegative.body.success).toBe(false);

    const resZero = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${userA.token}`)
      .send({
        friendName: 'Rohan Gupta',
        amount: 0,
        dueDate: '2026-11-15',
      });

    expect(resZero.status).toBe(400);
  });

  it('rejects loan creation with invalid date or missing friend name', async () => {
    const resBadDate = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${userA.token}`)
      .send({
        friendName: 'Rohan',
        amount: 1000,
        dueDate: 'not-a-date',
      });

    expect(resBadDate.status).toBe(400);

    const resEmptyName = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${userA.token}`)
      .send({
        friendName: '   ',
        amount: 1000,
        dueDate: '2026-11-15',
      });

    expect(resEmptyName.status).toBe(400);
  });

  it('enforces strict user isolation: User A cannot see or modify User B loans', async () => {
    // User B creates a loan
    const createRes = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${userB.token}`)
      .send({
        friendName: 'Suresh',
        amount: 5000,
        dueDate: '2026-12-01',
      });

    const userBLoanId = createRes.body.data.id;

    // User A fetches their loans: should be empty
    const listRes = await request(app)
      .get('/api/loans')
      .set('Authorization', `Bearer ${userA.token}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data).toHaveLength(0);

    // User A attempts to mark User B's loan as repaid: forbidden / unauthorized
    const repayRes = await request(app)
      .patch(`/api/loans/${userBLoanId}/repay`)
      .set('Authorization', `Bearer ${userA.token}`);

    expect(repayRes.status).toBe(403);
    expect(repayRes.body.success).toBe(false);

    // Verify User B's loan remains unpaid in DB
    const loanInDb = await prisma.loan.findUnique({ where: { id: userBLoanId } });
    expect(loanInDb?.isRepaid).toBe(false);
  });

  it('allows owner to mark a loan as repaid and handles repeated calls safely', async () => {
    const createRes = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${userA.token}`)
      .send({
        friendName: 'Pooja',
        amount: 800,
        dueDate: '2026-11-20',
      });

    const loanId = createRes.body.data.id;

    // Mark as repaid
    const repayRes1 = await request(app)
      .patch(`/api/loans/${loanId}/repay`)
      .set('Authorization', `Bearer ${userA.token}`);

    expect(repayRes1.status).toBe(200);
    expect(repayRes1.body.data.isRepaid).toBe(true);
    expect(repayRes1.body.data.repaidAt).toBeDefined();

    // Repeat repayment request: must be idempotent and succeed without error
    const repayRes2 = await request(app)
      .patch(`/api/loans/${loanId}/repay`)
      .set('Authorization', `Bearer ${userA.token}`);

    expect(repayRes2.status).toBe(200);
    expect(repayRes2.body.data.isRepaid).toBe(true);
  });
});
