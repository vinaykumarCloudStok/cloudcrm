import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as opportunityController from '../controllers/opportunityController';

const router = Router();

router.use(authenticate);

// Static routes MUST be defined before parameterized routes
router.get('/pipeline', opportunityController.getPipeline);
router.get('/forecast', opportunityController.getForecast);

router.get('/', opportunityController.getOpportunities);
router.post('/', opportunityController.createOpportunity);
router.get('/:id', opportunityController.getOpportunity);
router.put('/:id', opportunityController.updateOpportunity);
router.patch('/:id/stage', opportunityController.updateStage);

export default router;
