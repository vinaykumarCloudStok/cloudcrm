import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as contactController from '../controllers/contactController';

const router = Router();

router.use(authenticate);

router.get('/', contactController.getContacts);
router.post('/', contactController.createContact);
router.get('/:id', contactController.getContact);
router.put('/:id', contactController.updateContact);

export default router;
