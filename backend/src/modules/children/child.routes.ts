import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middlewares/auth.middleware.ts';
import { requirePlan } from '../../middlewares/plan.middleware.ts';
import { validateObjectId, validateDateParam } from '../../utils/validate.ts';
import * as ChildService from './child.service.ts';
import * as ReportService from './report.service.ts';
import voiceRouter from './child.voice.ts';
import growthRouter from './growth.routes.ts';
import CareEventModel from '../events/careEvent.model.ts';
import { requirePermission } from '../../utils/permissions.ts';
import redisClient from '../../config/redis.ts';

const router = Router();

const CHILD_ROLES = ['father', 'mother', 'nanny', 'doctor'] as const;

const dateOfBirthTransform = z.string().transform((s, ctx) => {
  let iso = s;
  if (/^\d{2}-\d{2}-\d{4}$/.test(s)) {
    const [day, month, year] = s.split('-');
    iso = `${year}-${month}-${day}`;
  }
  const d = new Date(iso);
  if (isNaN(d.getTime())) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid date format; use YYYY-MM-DD or DD-MM-YYYY' });
    return z.NEVER;
  }
  return d;
});

const createChildSchema = z.object({
  name: z.string().min(1),
  role: z.enum(CHILD_ROLES),
  dateOfBirth: dateOfBirthTransform,
});

const updateChildSchema = z.object({
  name: z.string().min(1).optional(),
  dateOfBirth: dateOfBirthTransform.optional(),
}).refine(data => data.name || data.dateOfBirth, { message: 'At least one field required' });

const avatarUploadSchema = z.object({
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
});

const confirmAvatarSchema = z.object({
  avatarKey: z.string().min(1),
});

function serializeChild(c: any) {
  return {
    id: c._id,
    name: c.name,
    dateOfBirth: c.dateOfBirth instanceof Date ? c.dateOfBirth.toISOString() : c.dateOfBirth,
    ...(c.avatarUrl ? { avatarUrl: c.avatarUrl } : {}),
  };
}

// Voice input (must be before /:childId routes)
router.use(voiceRouter);

// Growth tracking
router.use('/:childId/growth', growthRouter);

router.post('/', requireAuth, async (req, res) => {
  const body = createChildSchema.parse(req.body);
  const child = await ChildService.createChild(body.name, body.dateOfBirth, req.user!.id, body.role);
  res.status(201).json(serializeChild(child));
});

router.get('/mine', requireAuth, async (req, res) => {
  const children = await ChildService.listMyChildren(req.user!.id);
  res.json(children.map(serializeChild));
});

router.patch('/:childId', requireAuth, async (req, res) => {
  validateObjectId(req.params.childId, 'childId');
  const body = updateChildSchema.parse(req.body);
  const child = await ChildService.updateChild(req.user!.id, req.params.childId, body);
  res.json(serializeChild(child));
});

router.delete('/:childId', requireAuth, async (req, res) => {
  validateObjectId(req.params.childId, 'childId');
  await ChildService.deleteChild(req.user!.id, req.params.childId);
  res.status(204).send();
});

// --- Export endpoint ---

router.get('/:childId/export', requireAuth, async (req, res) => {
  validateObjectId(req.params.childId, 'childId');
  await requirePermission(req.user!.id, req.params.childId, 'canRead');

  const format = (req.query.format as string) === 'csv' ? 'csv' : 'json';
  const from = validateDateParam(req.query.from as string | undefined, 'from');
  const to = validateDateParam(req.query.to as string | undefined, 'to');

  // Rate limit: 5 exports per hour per user
  const rateLimitKey = `export:rate:${req.user!.id}`;
  const count = await redisClient.incr(rateLimitKey);
  if (count === 1) await redisClient.expire(rateLimitKey, 3600);
  if (count > 5) {
    throw Object.assign(new Error('Export rate limit exceeded (5 per hour)'), { statusCode: 429, code: 'RATE_LIMITED' });
  }

  const filter: any = { childId: req.params.childId };
  if (from || to) {
    filter.startTime = {};
    if (from) filter.startTime.$gte = from;
    if (to) filter.startTime.$lte = to;
  }

  const events = await CareEventModel.find(filter).sort({ startTime: 1 }).lean();

  if (format === 'csv') {
    const header = 'id,type,startTime,endTime,durationMinutes,notes\n';
    const rows = events.map((e) =>
      [
        e._id,
        e.type,
        e.startTime.toISOString(),
        e.endTime?.toISOString() ?? '',
        e.durationMinutes ?? '',
        (e.notes ?? '').replace(/,/g, ';'),
      ].join(',')
    ).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="events-${req.params.childId}.csv"`);
    return res.send(header + rows);
  }

  res.setHeader('Content-Disposition', `attachment; filename="events-${req.params.childId}.json"`);
  res.json(events);
});

// --- Pediatrician report ---

router.get('/:childId/report', requireAuth, requirePlan('pro'), async (req, res) => {
  validateObjectId(req.params.childId, 'childId');
  const fromStr = req.query.from as string | undefined;
  const toStr = req.query.to as string | undefined;
  // Validate format if provided
  if (fromStr) validateDateParam(fromStr, 'from');
  if (toStr) validateDateParam(toStr, 'to');
  const report = await ReportService.generateReport(req.user!.id, req.params.childId, {
    from: fromStr,
    to: toStr,
  });
  res.json(report);
});

// --- Avatar endpoints ---

// Step 1: Client requests a presigned upload URL
router.post('/:childId/avatar/upload-url', requireAuth, requirePlan('pro'), async (req, res) => {
  validateObjectId(req.params.childId, 'childId');
  const { contentType } = avatarUploadSchema.parse(req.body);
  const result = await ChildService.getAvatarUploadUrl(req.user!.id, req.params.childId, contentType);
  res.json(result);
});

// Step 2: After uploading directly to S3, client confirms with the returned avatarKey
router.patch('/:childId/avatar/confirm', requireAuth, requirePlan('pro'), async (req, res) => {
  validateObjectId(req.params.childId, 'childId');
  const { avatarKey } = confirmAvatarSchema.parse(req.body);
  const child = await ChildService.confirmAvatar(req.user!.id, req.params.childId, avatarKey);
  res.json({ avatarUrl: child.avatarUrl });
});

// Remove avatar
router.delete('/:childId/avatar', requireAuth, requirePlan('pro'), async (req, res) => {
  validateObjectId(req.params.childId, 'childId');
  await ChildService.removeAvatar(req.user!.id, req.params.childId);
  res.status(204).send();
});

export default router;
