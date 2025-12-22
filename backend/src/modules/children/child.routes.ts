import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import * as ChildService from './child.service.js';

const router = Router();

const createChildSchema = z.object({ name: z.string().min(1),role: z.string(), dateOfBirth: z.string().transform((s) => new Date(s)) });

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const body = createChildSchema.parse(req.body);
    const child = await ChildService.createChild(body.name, body.dateOfBirth, body.role, req.user!.id);
    res.status(201).json({ 
      id: child._id, 
      name: child.name, 
      dateOfBirth: child.dateOfBirth.toISOString() 
    });
  } catch (e) { next(e); }
});

router.get('/mine', requireAuth, async (req, res, next) => {
  try {
    const children = await ChildService.listMyChildren(req.user!.id);
    res.json(children.map((c) => ({ 
      id: c._id, 
      name: c.name, 
      dateOfBirth: c.dateOfBirth.toISOString() 
    })));
  } catch (e) { next(e); }
});

export default router;
