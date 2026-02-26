import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middlewares/auth.middleware.ts';
import { validateObjectId } from '../../utils/validate.ts';
import ReminderModel from './reminder.model.ts';

const router = Router();

const reminderSchema = z.object({
  label:         z.string().min(1).max(100),
  type:          z.enum(['interval', 'time']),
  childId:       z.string().optional(),
  intervalHours: z.number().int().min(1).max(72).optional(),
  timeOfDay:     z.string().regex(/^\d{2}:\d{2}$/, 'Expected HH:MM').optional(),
  eventType:     z.enum(['sleep', 'feed', 'diaper', 'mood']).optional(),
  enabled:       z.boolean().optional(),
}).refine(
  (d) => (d.type === 'interval' ? !!d.intervalHours : !!d.timeOfDay),
  { message: 'intervalHours required for type=interval, timeOfDay required for type=time' },
);

router.get('/', requireAuth, async (req, res) => {
  const reminders = await ReminderModel.find({ userId: req.user!.id }).sort({ createdAt: -1 }).lean();
  res.json(reminders);
});

router.post('/', requireAuth, async (req, res) => {
  const body = reminderSchema.parse(req.body);
  if (body.childId) validateObjectId(body.childId, 'childId');
  const doc = await ReminderModel.create({ userId: req.user!.id, ...body });
  res.status(201).json(doc);
});

router.patch('/:reminderId', requireAuth, async (req, res) => {
  validateObjectId(req.params.reminderId, 'reminderId');
  const body = reminderSchema.partial().parse(req.body);
  const doc = await ReminderModel.findOneAndUpdate(
    { _id: req.params.reminderId, userId: req.user!.id },
    { $set: body },
    { new: true },
  );
  if (!doc) throw Object.assign(new Error('Reminder not found'), { statusCode: 404, code: 'NOT_FOUND' });
  res.json(doc);
});

router.delete('/:reminderId', requireAuth, async (req, res) => {
  validateObjectId(req.params.reminderId, 'reminderId');
  await ReminderModel.findOneAndDelete({ _id: req.params.reminderId, userId: req.user!.id });
  res.status(204).send();
});

export default router;
