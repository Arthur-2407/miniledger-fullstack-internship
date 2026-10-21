import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service.js';
import { requestOtpSchema, verifyOtpSchema } from './auth.schema.js';

export class AuthController {
  async requestOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = requestOtpSchema.parse(req.body);
      const result = await authService.requestOtp(validated.phone);

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          phone: result.phone,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = verifyOtpSchema.parse(req.body);
      const result = await authService.verifyOtp(validated.phone, validated.otp);

      res.status(200).json({
        success: true,
        message: 'Authentication successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
