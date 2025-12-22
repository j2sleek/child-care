import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import * as EventService from './event.service.js';

const router = Router();
const recordSchema = z.object({
  childId: z.string().min(1),
  type: z.enum(['sleep', 'feed', 'diaper', 'mood']),
  startTime: z.string().transform((s) => new Date(s)),
  endTime: z.string().optional().transform((s) => (s ? new Date(s) : undefined)),
  durationMinutes: z.number().optional(),
  data: z.record(z.string(), z.any()).optional(),
  notes: z.string().optional()
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const body = recordSchema.parse(req.body);
    const doc = await EventService.recordEvent({
      userId: req.user!.id,
      childId: body.childId,
      type: body.type,
      startTime: body.startTime,
      endTime: body.endTime,
      durationMinutes: body.durationMinutes,
      data: body.data,
      notes: body.notes
    });
    res.status(201).json({ id: doc._id });
  } catch (e) { next(e); }
});

router.get('/timeline/:childId', requireAuth, async (req, res, next) => {
  try {
    const events = await EventService.listTimeline(req.user!.id, req.params.childId);
    res.json(events);
  } catch (e) { next(e); }
});

export default router;
