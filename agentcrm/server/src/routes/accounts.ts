import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as accountController from '../controllers/accountController';

const router = Router();

router.use(authenticate);

router.get('/', accountController.getAccounts);
router.post('/', accountController.createAccount);
router.get('/:id', accountController.getAccount);
router.put('/:id', accountController.updateAccount);
router.get('/:id/timeline', accountController.getAccountTimeline);

export default router;
