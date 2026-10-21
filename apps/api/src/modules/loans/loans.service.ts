import { Prisma } from '@prisma/client';
import { prisma } from '../../prisma/client.js';
import { parseDateOnly, formatDateOnly, isOverdue } from '../../utils/date.js';
import { AppError } from '../../middleware/error.js';
import { CreateLoanInput } from './loans.schema.js';

export interface FormattedLoan {
  id: string;
  userId: string;
  friendName: string;
  amount: number;
  dueDate: string;
  isRepaid: boolean;
  isOverdue: boolean;
  repaidAt: string | null;
  hasReceipt: boolean;
  receiptPath: string | null;
  receiptOriginalName: string | null;
  createdAt: string;
  updatedAt: string;
}

export class LoansService {
  /**
   * Format Prisma loan object for API response
   */
  private formatLoan(loan: {
    id: string;
    userId: string;
    friendName: string;
    amount: Prisma.Decimal;
    dueDate: Date;
    isRepaid: boolean;
    repaidAt: Date | null;
    receiptPath: string | null;
    receiptOriginalName: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): FormattedLoan {
    const formattedDueDate = formatDateOnly(loan.dueDate);
    const overdue = isOverdue(loan.dueDate) && !loan.isRepaid;

    return {
      id: loan.id,
      userId: loan.userId,
      friendName: loan.friendName,
      amount: Number(loan.amount),
      dueDate: formattedDueDate,
      isRepaid: loan.isRepaid,
      isOverdue: overdue,
      repaidAt: loan.repaidAt ? loan.repaidAt.toISOString() : null,
      hasReceipt: Boolean(loan.receiptPath),
      receiptPath: loan.receiptPath,
      receiptOriginalName: loan.receiptOriginalName,
      createdAt: loan.createdAt.toISOString(),
      updatedAt: loan.updatedAt.toISOString(),
    };
  }

  /**
   * Retrieve all loans for the authenticated user
   */
  async getUserLoans(userId: string): Promise<FormattedLoan[]> {
    const loans = await prisma.loan.findMany({
      where: { userId },
      orderBy: [
        { isRepaid: 'asc' },
        { dueDate: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return loans.map((loan) => this.formatLoan(loan));
  }

  /**
   * Create a new loan entry for the authenticated user
   */
  async createLoan(userId: string, input: CreateLoanInput): Promise<FormattedLoan> {
    const parsedDate = parseDateOnly(input.dueDate);
    const decimalAmount = new Prisma.Decimal(input.amount.toFixed(2));

    const loan = await prisma.loan.create({
      data: {
        userId,
        friendName: input.friendName,
        amount: decimalAmount,
        dueDate: parsedDate,
        isRepaid: false,
      },
    });

    return this.formatLoan(loan);
  }

  /**
   * Mark an outstanding loan as repaid (idempotent, ownership-verified)
   */
  async markAsRepaid(userId: string, loanId: string): Promise<FormattedLoan> {
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
    });

    if (!loan) {
      throw new AppError(404, 'LOAN_NOT_FOUND', 'Loan not found.');
    }

    if (loan.userId !== userId) {
      throw new AppError(403, 'FORBIDDEN', 'You do not have permission to modify this loan.');
    }

    // Idempotent: if already repaid, return current state
    if (loan.isRepaid) {
      return this.formatLoan(loan);
    }

    const updated = await prisma.loan.update({
      where: { id: loanId },
      data: {
        isRepaid: true,
        repaidAt: new Date(),
      },
    });

    return this.formatLoan(updated);
  }
}

export const loansService = new LoansService();
