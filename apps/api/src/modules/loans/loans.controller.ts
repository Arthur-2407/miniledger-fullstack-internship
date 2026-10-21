import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.js';
import { loansService } from './loans.service.js';
import { createLoanSchema, loanIdParamSchema } from './loans.schema.js';
import { AppError } from '../../middleware/error.js';

export class LoansController {
  async getLoans(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
      }

      const loans = await loansService.getUserLoans(req.user.userId);

      res.status(200).json({
        success: true,
        data: loans,
      });
    } catch (error) {
      next(error);
    }
  }

  async createLoan(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
      }

      const validated = createLoanSchema.parse(req.body);
      const loan = await loansService.createLoan(req.user.userId, validated);

      res.status(201).json({
        success: true,
        message: 'Loan entry created successfully',
        data: loan,
      });
    } catch (error) {
      next(error);
    }
  }

  async repayLoan(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
      }

      const { id } = loanIdParamSchema.parse(req.params);
      const loan = await loansService.markAsRepaid(req.user.userId, id);

      res.status(200).json({
        success: true,
        message: 'Loan marked as repaid successfully',
        data: loan,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const loansController = new LoansController();
