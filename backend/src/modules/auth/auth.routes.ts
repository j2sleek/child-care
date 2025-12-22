import { Router } from 'express';
import { register, login } from './auth.controller.js';

const router = Router();
router.post('/register', (req, res, next) => register(req, res).catch(next));
router.post('/login', (req, res, next) => login(req, res).catch(next));
export default router;
