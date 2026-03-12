import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as leadController from '../controllers/leadController';

const router = Router();

router.use(authenticate);

router.get('/', leadController.getLeads);
router.post('/', leadController.createLead);
router.get('/:id', leadController.getLead);
router.put('/:id', leadController.updateLead);
router.patch('/:id/stage', leadController.updateLeadStage);
router.post('/:id/convert', leadController.convertToOpportunity);

export default router;
