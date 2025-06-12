import { Router } from 'express';
import { login, register } from '../controllers/authController';
import { loginSchema, signupSchema } from '../types/auth';
import validateRequest from '../middlewares/validateRequest';

const router = Router();

router.post('/register', validateRequest(signupSchema), register);
router.post('/login', validateRequest(loginSchema),login);

export default router;