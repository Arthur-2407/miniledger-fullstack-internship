import { prisma } from '../../prisma/client.js';
import { getTodayUtcMidnight } from '../../utils/date.js';

export interface SummaryData {
  totalLent: number;
  totalRepaid: number;
  overdueAmount: number;
  currency: string;
}

export class SummaryService {
  /**
   * Calculate financial summary for the authenticated user
   */
  async getUserSummary(userId: string): Promise<SummaryData> {
    const todayMidnight = getTodayUtcMidnight();

    // 1. Total Lent: Sum of principal amounts of all loans for this user
    const totalLentAgg = await prisma.loan.aggregate({
      where: { userId },
      _sum: { amount: true },
    });

    // 2. Total Repaid: Sum of amounts for loans marked as repaid
    const totalRepaidAgg = await prisma.loan.aggregate({
      where: {
        userId,
        isRepaid: true,
      },
      _sum: { amount: true },
    });

    // 3. Overdue Amount: Sum of amounts for outstanding loans whose dueDate is strictly before today's calendar date
    const overdueAgg = await prisma.loan.aggregate({
      where: {
        userId,
        isRepaid: false,
        dueDate: {
          lt: todayMidnight,
        },
      },
      _sum: { amount: true },
    });

    const totalLent = totalLentAgg._sum.amount ? Number(totalLentAgg._sum.amount) : 0;
    const totalRepaid = totalRepaidAgg._sum.amount ? Number(totalRepaidAgg._sum.amount) : 0;
    const overdueAmount = overdueAgg._sum.amount ? Number(overdueAgg._sum.amount) : 0;

    return {
      totalLent: Number(totalLent.toFixed(2)),
      totalRepaid: Number(totalRepaid.toFixed(2)),
      overdueAmount: Number(overdueAmount.toFixed(2)),
      currency: 'INR',
    };
  }
}

export const summaryService = new SummaryService();
