import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import * as userController from '../controllers/userController';

const router = Router();

router.use(authenticate);
router.use(requireRole('ADMIN'));

router.get('/', userController.getUsers);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.get('/reps', userController.getReps);
router.get('/solution-architects', userController.getSolutionArchitects);

export default router;
