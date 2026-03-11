import { Router } from 'express';
import { authenticate, requireProfesor } from '../middleware/auth';
import {
  createGroup,
  getGroups,
  getGroupById,
  joinGroup,
  joinGroupByCode,
  removeMember,
  updateGroup,
  deleteGroup,
} from '../controllers/groupsController';

const router = Router();

router.use(authenticate);

router.get('/', getGroups);
router.post('/', requireProfesor, createGroup);
router.get('/:id', getGroupById);
router.put('/:id', requireProfesor, updateGroup);
router.delete('/:id', requireProfesor, deleteGroup);
router.post('/join', joinGroup);
router.get('/join/:codigo', joinGroupByCode);
router.delete('/:id/members/:userId', requireProfesor, removeMember);

export default router;
