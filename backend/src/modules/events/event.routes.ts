import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middlewares/auth.middleware.ts';
import { validateObjectId } from '../../utils/validate.ts';
import * as EventService from './event.service.ts';
import EventTemplateModel from './eventTemplate.model.ts';

const router = Router();

const dateTransform = z.string().transform((s, ctx) => {
  const d = new Date(s);
  if (isNaN(d.getTime())) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid date/time string' });
    return z.NEVER;
  }
  return d;
});

const recordSchema = z.object({
  childId: z.string().min(1),
  type: z.enum(['sleep', 'feed', 'diaper', 'mood']).optional(),
  startTime: dateTransform,
  endTime: dateTransform.optional(),
  durationMinutes: z.number().optional(),
  data: z.record(z.string(), z.any()).optional(),
  notes: z.string().optional(),
  templateId: z.string().optional(),
});

const templateSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['sleep', 'feed', 'diaper', 'mood']),
  durationMinutes: z.number().positive().optional(),
  data: z.record(z.string(), z.any()).optional(),
  notes: z.string().optional(),
});

const updateEventSchema = z.object({
  startTime: dateTransform.optional(),
  endTime: dateTransform.optional(),
  durationMinutes: z.number().optional(),
  data: z.record(z.string(), z.any()).optional(),
  notes: z.string().optional()
});

router.post('/', requireAuth, async (req, res) => {
  const body = recordSchema.parse(req.body);
  validateObjectId(body.childId, 'childId');

  // Merge template defaults if templateId provided
  let type = body.type;
  let durationMinutes = body.durationMinutes;
  let data = body.data;
  let notes = body.notes;

  if (body.templateId) {
    validateObjectId(body.templateId, 'templateId');
    const tpl = await EventTemplateModel.findOne({
      _id: body.templateId,
      userId: req.user!.id,
    }).lean();
    if (!tpl) throw Object.assign(new Error('Template not found'), { statusCode: 404, code: 'NOT_FOUND' });
    type ??= tpl.type;
    durationMinutes ??= tpl.durationMinutes;
    data ??= tpl.data;
    notes ??= tpl.notes;
  }

  if (!type) throw Object.assign(new Error('type is required'), { statusCode: 400, code: 'VALIDATION_ERROR' });

  const doc = await EventService.recordEvent({
    userId: req.user!.id,
    childId: body.childId,
    type,
    startTime: body.startTime,
    endTime: body.endTime,
    durationMinutes,
    data,
    notes,
  });
  res.status(201).json({ id: doc._id });
});

// ── Event Templates ──────────────────────────────────────────────────

router.get('/templates', requireAuth, async (req, res) => {
  const templates = await EventTemplateModel.find({ userId: req.user!.id }).sort({ name: 1 }).lean();
  res.json(templates);
});

router.post('/templates', requireAuth, async (req, res) => {
  const body = templateSchema.parse(req.body);
  const tpl = await EventTemplateModel.create({ userId: req.user!.id, ...body });
  res.status(201).json(tpl);
});

router.patch('/templates/:templateId', requireAuth, async (req, res) => {
  validateObjectId(req.params.templateId, 'templateId');
  const body = templateSchema.partial().parse(req.body);
  const tpl = await EventTemplateModel.findOneAndUpdate(
    { _id: req.params.templateId, userId: req.user!.id },
    { $set: body },
    { new: true },
  );
  if (!tpl) throw Object.assign(new Error('Template not found'), { statusCode: 404, code: 'NOT_FOUND' });
  res.json(tpl);
});

router.delete('/templates/:templateId', requireAuth, async (req, res) => {
  validateObjectId(req.params.templateId, 'templateId');
  await EventTemplateModel.findOneAndDelete({ _id: req.params.templateId, userId: req.user!.id });
  res.status(204).send();
});

router.get('/timeline/:childId', requireAuth, async (req, res) => {
  validateObjectId(req.params.childId, 'childId');
  const limitRaw = parseInt(req.query.limit as string, 10);
  const offsetRaw = parseInt(req.query.offset as string, 10);
  const limit = Math.min(isNaN(limitRaw) ? 50 : limitRaw, 200);
  const offset = Math.max(isNaN(offsetRaw) ? 0 : offsetRaw, 0);
  const events = await EventService.listTimeline(req.user!.id, req.params.childId, limit, offset);
  res.json(events);
});

router.patch('/:eventId', requireAuth, async (req, res) => {
  validateObjectId(req.params.eventId, 'eventId');
  const body = updateEventSchema.parse(req.body);
  const doc = await EventService.updateEvent(req.user!.id, req.params.eventId, body);
  res.json(doc);
});

router.delete('/:eventId', requireAuth, async (req, res) => {
  validateObjectId(req.params.eventId, 'eventId');
  await EventService.deleteEvent(req.user!.id, req.params.eventId);
  res.status(204).send();
});

export default router;
