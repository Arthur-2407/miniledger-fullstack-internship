import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../../prisma/client.js';
import { config } from '../../config/index.js';
import { logger } from '../../utils/logger.js';
import { normalizePhone, maskPhone } from '../../utils/phone.js';
import { signToken } from '../../utils/jwt.js';
import { AppError } from '../../middleware/error.js';

export class AuthService {
  /**
   * Request a 6-digit mock OTP, hash and persist it, and print to terminal log.
   */
  async requestOtp(rawPhone: string): Promise<{ success: boolean; message: string; phone: string }> {
    const normalizedPhone = normalizePhone(rawPhone);

    // Generate cryptographically secure 6-digit OTP
    const rawOtp = crypto.randomInt(100000, 1000000).toString();
    const salt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(rawOtp, salt);

    const expiresAt = new Date(Date.now() + config.OTP_EXPIRY_MINUTES * 60 * 1000);

    // Invalidate previous unconsumed OTPs for this phone number
    await prisma.otpChallenge.updateMany({
      where: {
        phone: normalizedPhone,
        consumed: false,
      },
      data: {
        consumed: true,
      },
    });

    // Store new challenge
    await prisma.otpChallenge.create({
      data: {
        phone: normalizedPhone,
        hashedOtp,
        expiresAt,
        attempts: 0,
        consumed: false,
      },
    });

    // Print dev OTP in terminal
    logger.devOtp(maskPhone(normalizedPhone), rawOtp);

    return {
      success: true,
      message: 'OTP has been sent successfully (check terminal output in dev mode).',
      phone: maskPhone(normalizedPhone),
    };
  }

  /**
   * Verify the 6-digit OTP, mark consumed, upsert user, and issue JWT.
   */
  async verifyOtp(rawPhone: string, otp: string) {
    const normalizedPhone = normalizePhone(rawPhone);

    const challenge = await prisma.otpChallenge.findFirst({
      where: {
        phone: normalizedPhone,
        consumed: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!challenge) {
      throw new AppError(
        400,
        'NO_ACTIVE_OTP',
        'No active OTP request found for this phone number. Please request a new OTP.'
      );
    }

    // Check expiry
    if (new Date() > challenge.expiresAt) {
      await prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { consumed: true },
      });
      throw new AppError(400, 'EXPIRED_OTP', 'The OTP has expired. Please request a new one.');
    }

    // Check attempt threshold
    if (challenge.attempts >= config.OTP_MAX_ATTEMPTS) {
      await prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { consumed: true },
      });
      throw new AppError(
        429,
        'TOO_MANY_ATTEMPTS',
        'Maximum verification attempts reached for this OTP. Please request a new one.'
      );
    }

    // Verify OTP match with bcrypt
    const isMatch = await bcrypt.compare(otp, challenge.hashedOtp);

    if (!isMatch) {
      // Increment attempts counter
      await prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { attempts: { increment: 1 } },
      });

      const remainingAttempts = config.OTP_MAX_ATTEMPTS - (challenge.attempts + 1);
      throw new AppError(
        400,
        'INVALID_OTP',
        `Incorrect OTP. ${remainingAttempts > 0 ? `${remainingAttempts} attempt(s) remaining.` : 'Please request a new OTP.'}`
      );
    }

    // Consume the challenge so it cannot be reused
    await prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: { consumed: true },
    });

    // Find or create the user (Registration on login)
    const user = await prisma.user.upsert({
      where: { phone: normalizedPhone },
      update: {},
      create: { phone: normalizedPhone },
    });

    // Issue JWT token
    const token = signToken({
      userId: user.id,
      phone: user.phone,
    });

    return {
      token,
      user: {
        id: user.id,
        phone: user.phone,
        createdAt: user.createdAt,
      },
    };
  }
}

export const authService = new AuthService();
