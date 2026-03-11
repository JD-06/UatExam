import { Router } from 'express';
import { register, login, getMe, refreshToken } from '../controllers/authController';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', getMe);
router.post('/refresh', refreshToken);

export default router;
