import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { Prisma } from '@prisma/client';
import { app } from '../src/app.js';
import { prisma } from '../src/prisma/client.js';
import { signToken } from '../src/utils/jwt.js';
import { parseDateOnly } from '../src/utils/date.js';

describe('Receipt Upload Bonus Module Tests', () => {
  let userA: { id: string; phone: string; token: string };
  let userB: { id: string; phone: string; token: string };
  let loanAId: string;

  beforeEach(async () => {
    const phoneA = '+919666600001';
    const phoneB = '+919666600002';

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

    const loanA = await prisma.loan.create({
      data: {
        userId: userA.id,
        friendName: 'Deepak',
        amount: new Prisma.Decimal('1200.00'),
        dueDate: parseDateOnly('2026-11-01'),
        isRepaid: false,
      },
    });

    loanAId = loanA.id;
  });

  afterAll(async () => {
    await prisma.loan.deleteMany({
      where: { user: { phone: { in: ['+919666600001', '+919666600002'] } } },
    });
    await prisma.user.deleteMany({
      where: { phone: { in: ['+919666600001', '+919666600002'] } },
    });
    await prisma.$disconnect();
  });

  it('uploads a valid JPEG receipt and associates metadata with the loan', async () => {
    // 1x1 transparent GIF/JPEG mock buffer
    const mockImageBuffer = Buffer.from('fake-image-bytes-jpeg');

    const res = await request(app)
      .post(`/api/loans/${loanAId}/receipt`)
      .set('Authorization', `Bearer ${userA.token}`)
      .attach('receipt', mockImageBuffer, {
        filename: 'receipt.jpg',
        contentType: 'image/jpeg',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.loanId).toBe(loanAId);

    // Verify metadata in DB
    const updatedLoan = await prisma.loan.findUnique({ where: { id: loanAId } });
    expect(updatedLoan?.receiptPath).toBeDefined();
    expect(updatedLoan?.receiptMime).toBe('image/jpeg');

    // Retrieve the receipt through authenticated GET
    const getRes = await request(app)
      .get(`/api/loans/${loanAId}/receipt`)
      .set('Authorization', `Bearer ${userA.token}`);

    expect(getRes.status).toBe(200);
    expect(getRes.headers['content-type']).toContain('image/jpeg');
  });

  it('rejects unsupported file formats', async () => {
    const textBuffer = Buffer.from('plain-text-receipt');

    const res = await request(app)
      .post(`/api/loans/${loanAId}/receipt`)
      .set('Authorization', `Bearer ${userA.token}`)
      .attach('receipt', textBuffer, {
        filename: 'receipt.txt',
        contentType: 'text/plain',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('prevents User B from attaching or viewing receipts on User A loans', async () => {
    const mockImageBuffer = Buffer.from('fake-image-bytes');

    // User B attempts to attach receipt to User A's loan
    const uploadRes = await request(app)
      .post(`/api/loans/${loanAId}/receipt`)
      .set('Authorization', `Bearer ${userB.token}`)
      .attach('receipt', mockImageBuffer, {
        filename: 'receipt.png',
        contentType: 'image/png',
      });

    expect(uploadRes.status).toBe(403);
    expect(uploadRes.body.success).toBe(false);

    // User B attempts to view receipt on User A's loan
    const viewRes = await request(app)
      .get(`/api/loans/${loanAId}/receipt`)
      .set('Authorization', `Bearer ${userB.token}`);

    expect(viewRes.status).toBe(403);
  });
});
