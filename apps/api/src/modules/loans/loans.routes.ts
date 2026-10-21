import { Router } from 'express';
import { loansController } from './loans.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

// All loans routes require authentication
router.use(authenticate);

router.get('/', (req, res, next) => {
  loansController.getLoans(req, res, next);
});

router.post('/', (req, res, next) => {
  loansController.createLoan(req, res, next);
});

router.patch('/:id/repay', (req, res, next) => {
  loansController.repayLoan(req, res, next);
});

export const loansRoutes = router;
