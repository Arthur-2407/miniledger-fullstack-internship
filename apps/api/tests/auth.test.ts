import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { app } from '../src/app.js';
import { prisma } from '../src/prisma/client.js';

describe('Authentication Module Tests', () => {
  const testPhone = '+919999900001';

  beforeEach(async () => {
    // Clean up test records
    await prisma.otpChallenge.deleteMany({
      where: { phone: testPhone },
    });
    await prisma.loan.deleteMany({
      where: { user: { phone: testPhone } },
    });
    await prisma.user.deleteMany({
      where: { phone: testPhone },
    });
  });

  afterAll(async () => {
    await prisma.otpChallenge.deleteMany({
      where: { phone: testPhone },
    });
    await prisma.user.deleteMany({
      where: { phone: testPhone },
    });
    await prisma.$disconnect();
  });

  it('rejects malformed phone numbers', async () => {
    const res = await request(app)
      .post('/api/auth/request-otp')
      .send({ phone: '123' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('successfully generates and stores mock OTP for valid phone number', async () => {
    const res = await request(app)
      .post('/api/auth/request-otp')
      .send({ phone: testPhone });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.phone).toBeDefined();

    // Verify OTP challenge was persisted in database
    const challenge = await prisma.otpChallenge.findFirst({
      where: { phone: testPhone, consumed: false },
      orderBy: { createdAt: 'desc' },
    });

    expect(challenge).not.toBeNull();
    expect(challenge?.hashedOtp).toBeDefined();
    expect(challenge?.consumed).toBe(false);
    expect(challenge?.attempts).toBe(0);
  });

  it('rejects incorrect OTP with attempt counter and meaningful error', async () => {
    // Create known OTP challenge
    const rawOtp = '123456';
    const hashed = await bcrypt.hash(rawOtp, 10);
    await prisma.otpChallenge.create({
      data: {
        phone: testPhone,
        hashedOtp: hashed,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        consumed: false,
        attempts: 0,
      },
    });

    const res = await request(app)
      .post('/api/auth/verify-otp')
      .send({ phone: testPhone, otp: '999999' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_OTP');

    // Confirm attempts incremented in DB
    const updated = await prisma.otpChallenge.findFirst({
      where: { phone: testPhone },
    });
    expect(updated?.attempts).toBe(1);
  });

  it('authenticates valid OTP, issues JWT, and registers user', async () => {
    const rawOtp = '654321';
    const hashed = await bcrypt.hash(rawOtp, 10);
    await prisma.otpChallenge.create({
      data: {
        phone: testPhone,
        hashedOtp: hashed,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        consumed: false,
        attempts: 0,
      },
    });

    const res = await request(app)
      .post('/api/auth/verify-otp')
      .send({ phone: testPhone, otp: rawOtp });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.phone).toBe(testPhone);

    // Verify challenge is now marked consumed
    const challenge = await prisma.otpChallenge.findFirst({
      where: { phone: testPhone },
    });
    expect(challenge?.consumed).toBe(true);

    // Verify user exists in DB
    const user = await prisma.user.findUnique({
      where: { phone: testPhone },
    });
    expect(user).not.toBeNull();
  });

  it('rejects consumed OTP on reuse attempt', async () => {
    const rawOtp = '112233';
    const hashed = await bcrypt.hash(rawOtp, 10);
    await prisma.otpChallenge.create({
      data: {
        phone: testPhone,
        hashedOtp: hashed,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        consumed: true, // Already consumed
        attempts: 1,
      },
    });

    const res = await request(app)
      .post('/api/auth/verify-otp')
      .send({ phone: testPhone, otp: rawOtp });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NO_ACTIVE_OTP');
  });

  it('rejects expired OTP', async () => {
    const rawOtp = '555555';
    const hashed = await bcrypt.hash(rawOtp, 10);
    await prisma.otpChallenge.create({
      data: {
        phone: testPhone,
        hashedOtp: hashed,
        expiresAt: new Date(Date.now() - 10 * 60 * 1000), // Expired 10m ago
        consumed: false,
        attempts: 0,
      },
    });

    const res = await request(app)
      .post('/api/auth/verify-otp')
      .send({ phone: testPhone, otp: rawOtp });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('EXPIRED_OTP');
  });

  it('enforces authentication on protected routes', async () => {
    const resNoToken = await request(app).get('/api/loans');
    expect(resNoToken.status).toBe(401);
    expect(resNoToken.body.error.code).toBe('UNAUTHORIZED');

    const resBadToken = await request(app)
      .get('/api/loans')
      .set('Authorization', 'Bearer invalid-token-string');
    expect(resBadToken.status).toBe(401);
    expect(resBadToken.body.error.code).toBe('INVALID_TOKEN');
  });
});
