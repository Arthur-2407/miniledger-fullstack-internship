/* eslint-disable no-console */
import { config } from '../config/index.js';

export const logger = {
  info: (message: string, ...args: unknown[]) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, ...args);
  },
  warn: (message: string, ...args: unknown[]) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, ...args);
  },
  error: (message: string, ...args: unknown[]) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, ...args);
  },
  devOtp: (maskedPhone: string, otp: string) => {
    if (config.NODE_ENV !== 'production') {
      const banner = '==================================================';
      console.log(`\n${banner}`);
      console.log(`🔑 [DEV-OTP] Verification code for ${maskedPhone}:`);
      console.log(`   👉 OTP: >>> ${otp} <<< (valid for ${config.OTP_EXPIRY_MINUTES} mins)`);
      console.log(`${banner}\n`);
    }
  },
};
