import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middlewares/auth.middleware.ts';
import * as ChildService from './child.service.ts';

const router = Router();

const createChildSchema = z.object({ 
  name: z.string().min(1),
  role: z.string(), 
  dateOfBirth: z.string().transform((s) => {
    // Support DD-MM-YYYY format
    if (/^\d{2}-\d{2}-\d{4}$/.test(s)) {
      const [day, month, year] = s.split('-');
      return new Date(`${year}-${month}-${day}`);
    }
    // Try standard formats
    return new Date(s);
  })
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const body = createChildSchema.parse(req.body);
    const child = await ChildService.createChild(body.name, body.dateOfBirth, req.user!.id, body.role);
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
