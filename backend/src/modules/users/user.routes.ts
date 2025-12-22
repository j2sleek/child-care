import { Router } from 'express';
import UserModel from './user.model.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';

const router = Router();
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const me = await UserModel.findById(req.user!.id).lean();
    if (!me) return res.status(404).json({ 
      code: 'NOT_FOUND', 
      message: 'User not found' 
    });
    res.json({ 
      id: me._id, 
      email: me.email, 
      name: me.name, 
      role: me.role 
    });
  } catch (e) { next(e); }
});
export default router;
