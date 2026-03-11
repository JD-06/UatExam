import { Router } from 'express';
import { authenticate, requireProfesor } from '../middleware/auth';
import {
  getForms,
  getFormById,
  createForm,
  updateForm,
  deleteForm,
  assignFormToGroups,
  getFormResults,
} from '../controllers/formsController';

const router = Router();

router.use(authenticate);

router.get('/', getForms);
router.post('/', requireProfesor, createForm);
router.get('/:id', getFormById);
router.put('/:id', requireProfesor, updateForm);
router.delete('/:id', requireProfesor, deleteForm);
router.get('/:id/results', requireProfesor, getFormResults);
router.post('/:id/assign', requireProfesor, assignFormToGroups);

export default router;
