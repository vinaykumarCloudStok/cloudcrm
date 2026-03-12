import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import * as dashboardController from '../controllers/dashboardController';

const router = Router();

router.use(authenticate);

router.get('/rep', dashboardController.getRepDashboard);
router.get('/manager', requireRole('ADMIN', 'SALES_MANAGER'), dashboardController.getManagerDashboard);

export default router;
