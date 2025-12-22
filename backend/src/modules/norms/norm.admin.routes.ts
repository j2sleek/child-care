import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middlewares/auth.middleware.ts';
import { requireAdmin } from '../../middlewares/admin.middleware.ts';
import NormModel from './norm.model.ts';

const router = Router();
const upsertSchema = z.object({
  version: z.string().min(1),
  metric: z.enum(['sleepMinutesPerDay', 'feedsPerDay', 'wakeWindowMinutes']),
  ageWeeksMin: z.number().int().nonnegative(),
  ageWeeksMax: z.number().int().nonnegative(),
  low: z.number().nonnegative(),
  high: z.number().nonnegative(),
  notes: z.string().optional()
});

router.post('/norms', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const body = upsertSchema.parse(req.body);
    const doc = await NormModel.findOneAndUpdate({ 
        version: body.version, 
        metric: body.metric, 
        ageWeeksMin: body.ageWeeksMin, 
        ageWeeksMax: body.ageWeeksMax 
      },
      body,
      { 
        upsert: true, 
        new: true, 
        setDefaultsOnInsert: true 
      }
    );
    res.status(201).json(doc);
  } catch (e) { next(e); }
});

router.get('/norms', requireAuth, requireAdmin, async (_req, res, next) => {
  try { res.json(await NormModel.find().sort({ 
      version: -1, 
      metric: 1, 
      ageWeeksMin: 1 
    })
    .lean()); 
  } catch (e) { next(e); }
});

router.delete('/norms/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try { 
    await NormModel.findByIdAndDelete(req.params.id); 
    res.status(204).send(); 
  } catch (e) { next(e); }
});

export default router;
