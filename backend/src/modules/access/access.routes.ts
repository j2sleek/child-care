import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middlewares/auth.middleware.ts';
import * as AccessService from './access.service.ts';

const router = Router();

const inviteSchema = z.object({
  childId: z.string().min(1),
  targetUserEmail: z.string().email(),
  role: z.enum(['father', 'mother', 'nanny', 'doctor']),
  permissions: z.object({ 
    canRead: z.boolean(), 
    canWrite: z.boolean(), 
    canInvite: z.boolean() 
  })
});

router.post('/invite', requireAuth, async (req, res, next) => {
  try {
    const body = inviteSchema.parse(req.body);
    const result = await AccessService.inviteByEmail(
      req.user!.id, 
      body.childId, 
      body.targetUserEmail, 
      body.role, 
      body.permissions
    );
    res.status(201).json({
      id: result._id, 
      childId: result.childId, 
      userId: result.userId, 
      role: result.role, 
      permissions: result.permissions
    });
  } catch (e) { next(e); }
});

router.get('/list/:childId', requireAuth, async (req, res, next) => {
  try {
    const list = await AccessService.listAccessForChild(req.user!.id, req.params.childId);
    res.json(list.map(a => ({ 
      id: a._id, 
      childId: a.childId, 
      userId: a.userId, 
      role: a.role, 
      permissions: a.permissions 
    })));
  } catch (e) { next(e); }
});

export default router;
