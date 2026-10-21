import { Router } from 'express';
import { receiptsController } from './receipts.controller.js';
import { uploadMiddleware } from './receipts.service.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

router.use(authenticate);

// POST /api/loans/:id/receipt
router.post('/:id/receipt', uploadMiddleware.single('receipt'), (req, res, next) => {
  receiptsController.uploadReceipt(req, res, next);
});

// GET /api/loans/:id/receipt
router.get('/:id/receipt', (req, res, next) => {
  receiptsController.getReceipt(req, res, next);
});

export const receiptsRoutes = router;
