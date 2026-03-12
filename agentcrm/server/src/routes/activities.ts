import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as activityController from '../controllers/activityController';

const router = Router();

router.use(authenticate);

router.get('/', activityController.getActivities);
router.post('/', activityController.logActivity);

export default router;
