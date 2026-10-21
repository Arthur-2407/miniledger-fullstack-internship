import { Router } from 'express';
import { summaryController } from './summary.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', (req, res, next) => {
  summaryController.getSummary(req, res, next);
});

export const summaryRoutes = router;
