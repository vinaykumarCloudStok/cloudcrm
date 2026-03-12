import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as agentController from '../controllers/agentController';

const router = Router();

router.use(authenticate);

router.post('/account-intel/:accountId', agentController.accountIntel);
router.post('/lead-score/:leadId', agentController.leadScore);
router.post('/deal-coach/brief/:id', agentController.dealCoachBrief);
router.post('/deal-coach/follow-up/:opportunityId', agentController.dealCoachFollowUp);
router.post('/follow-up/scan', agentController.followUpScan);

export default router;
