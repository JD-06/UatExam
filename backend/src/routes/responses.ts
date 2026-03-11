import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { submitResponse, getResponses, getMyResponse } from '../controllers/responsesController';

const router = Router();

router.use(authenticate);

router.post('/', submitResponse);
router.get('/:formId', getResponses);
router.get('/:formId/mine', getMyResponse);

export default router;
