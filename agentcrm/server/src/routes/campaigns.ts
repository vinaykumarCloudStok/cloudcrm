import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as campaignController from '../controllers/campaignController';

const router = Router();

router.use(authenticate);

router.get('/', campaignController.getCampaigns);
router.post('/', campaignController.createCampaign);
router.get('/:id', campaignController.getCampaign);
router.put('/:id', campaignController.updateCampaign);
router.patch('/:id/status', campaignController.updateCampaignStatus);
router.post('/:id/enroll', campaignController.enrollContacts);
router.post('/:id/remove/:contactId', campaignController.removeEnrollment);

export default router;
