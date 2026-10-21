import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.js';
import { receiptsService } from './receipts.service.js';
import { loanIdParamSchema } from '../loans/loans.schema.js';
import { AppError } from '../../middleware/error.js';

export class ReceiptsController {
  async uploadReceipt(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
      }

      const { id } = loanIdParamSchema.parse(req.params);

      if (!req.file) {
        throw new AppError(400, 'NO_FILE_PROVIDED', 'Please provide an image file with key "receipt".');
      }

      const result = await receiptsService.attachReceipt(req.user.userId, id, req.file);

      res.status(200).json({
        success: true,
        message: 'Receipt uploaded and attached to loan successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getReceipt(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
      }

      const { id } = loanIdParamSchema.parse(req.params);
      const receipt = await receiptsService.getReceiptFile(req.user.userId, id);

      res.setHeader('Content-Type', receipt.mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${receipt.originalName}"`);
      res.sendFile(receipt.filePath);
    } catch (error) {
      next(error);
    }
  }
}

export const receiptsController = new ReceiptsController();
