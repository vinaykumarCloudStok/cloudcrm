import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as validationController from '../controllers/validationController';

const router = Router();

router.use(authenticate);

router.get('/opportunities/:id/checklists', validationController.getChecklists);
router.put('/opportunities/:id/checklists/:type', validationController.updateChecklist);
router.get('/opportunities/:id/handoff', validationController.getHandoff);
router.post('/opportunities/:id/handoff', validationController.createOrUpdateHandoff);

export default router;
