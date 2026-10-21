import fs from 'fs';
import path from 'path';
import multer from 'multer';
import crypto from 'crypto';
import { prisma } from '../../prisma/client.js';
import { config } from '../../config/index.js';
import { AppError } from '../../middleware/error.js';

// Ensure upload directory exists
if (!fs.existsSync(config.UPLOAD_DIR)) {
  fs.mkdirSync(config.UPLOAD_DIR, { recursive: true });
}

// Allowed MIME types for receipt photos
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

// Configure Multer storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, config.UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const safeName = `${crypto.randomUUID()}${ext}`;
    cb(null, safeName);
  },
});

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: config.MAX_FILE_SIZE_MB * 1024 * 1024, // e.g. 5MB
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(new AppError(400, 'UNSUPPORTED_MEDIA_TYPE', 'Only JPEG, PNG, and WebP image files are allowed.'));
    }
  },
});

export class ReceiptsService {
  /**
   * Associate an uploaded image receipt with a loan
   */
  async attachReceipt(userId: string, loanId: string, file: Express.Multer.File) {
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
    });

    if (!loan) {
      // Remove temporary uploaded file if loan doesn't exist
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      throw new AppError(404, 'LOAN_NOT_FOUND', 'Loan not found.');
    }

    if (loan.userId !== userId) {
      // Remove temporary uploaded file if unauthorized
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      throw new AppError(403, 'FORBIDDEN', 'You do not have permission to attach receipts to this loan.');
    }

    // Remove prior receipt file if one existed
    if (loan.receiptPath && fs.existsSync(loan.receiptPath)) {
      try {
        fs.unlinkSync(loan.receiptPath);
      } catch {
        // ignore unlink error
      }
    }

    const updated = await prisma.loan.update({
      where: { id: loanId },
      data: {
        receiptPath: file.path,
        receiptMime: file.mimetype,
        receiptOriginalName: file.originalname,
        receiptSize: file.size,
      },
    });

    return {
      loanId: updated.id,
      receiptMime: updated.receiptMime,
      receiptOriginalName: updated.receiptOriginalName,
      receiptSize: updated.receiptSize,
    };
  }

  /**
   * Get file path for streaming receipt to authenticated owner
   */
  async getReceiptFile(userId: string, loanId: string) {
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
    });

    if (!loan) {
      throw new AppError(404, 'LOAN_NOT_FOUND', 'Loan not found.');
    }

    if (loan.userId !== userId) {
      throw new AppError(403, 'FORBIDDEN', 'You do not have permission to view this receipt.');
    }

    if (!loan.receiptPath) {
      throw new AppError(404, 'RECEIPT_NOT_FOUND', 'No receipt found for this loan.');
    }

    // Guard against path traversal: ensure path is within UPLOAD_DIR
    const resolvedPath = path.resolve(loan.receiptPath);
    const resolvedUploadDir = path.resolve(config.UPLOAD_DIR);

    if (!resolvedPath.startsWith(resolvedUploadDir)) {
      throw new AppError(400, 'SECURITY_VIOLATION', 'Invalid receipt file path.');
    }

    if (!fs.existsSync(resolvedPath)) {
      throw new AppError(404, 'FILE_MISSING', 'Receipt file no longer exists on disk.');
    }

    return {
      filePath: resolvedPath,
      mimeType: loan.receiptMime || 'image/jpeg',
      originalName: loan.receiptOriginalName || 'receipt.jpg',
    };
  }
}

export const receiptsService = new ReceiptsService();
