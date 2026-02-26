import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middlewares/auth.middleware.ts';
import { validateObjectId, validateDateParam } from '../../utils/validate.ts';
import { requirePermission } from '../../utils/permissions.ts';
import GrowthMeasurementModel from './growth.model.ts';

const router = Router({ mergeParams: true });

const measurementSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD'),
  weightKg:            z.number().positive().optional(),
  heightCm:            z.number().positive().optional(),
  headCircumferenceCm: z.number().positive().optional(),
  notes: z.string().optional(),
}).refine(
  (d) => d.weightKg || d.heightCm || d.headCircumferenceCm,
  { message: 'At least one measurement required' },
);

/** GET /children/:childId/growth */
router.get('/', requireAuth, async (req, res) => {
  validateObjectId(req.params.childId, 'childId');
  await requirePermission(req.user!.id, req.params.childId, 'canRead');

  const from = validateDateParam(req.query.from as string | undefined, 'from');
  const to   = validateDateParam(req.query.to   as string | undefined, 'to');

  const filter: any = { childId: req.params.childId };
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = from;
    if (to)   filter.date.$lte = to;
  }

  const measurements = await GrowthMeasurementModel.find(filter).sort({ date: 1 }).lean();
  res.json(measurements);
});

/** POST /children/:childId/growth */
router.post('/', requireAuth, async (req, res) => {
  validateObjectId(req.params.childId, 'childId');
  await requirePermission(req.user!.id, req.params.childId, 'canWrite');

  const body = measurementSchema.parse(req.body);
  const doc = await GrowthMeasurementModel.create({
    childId:    req.params.childId,
    recordedBy: req.user!.id,
    date: new Date(body.date),
    weightKg:            body.weightKg,
    heightCm:            body.heightCm,
    headCircumferenceCm: body.headCircumferenceCm,
    notes: body.notes,
  });
  res.status(201).json(doc);
});

/** PATCH /children/:childId/growth/:measurementId */
router.patch('/:measurementId', requireAuth, async (req, res) => {
  validateObjectId(req.params.childId,       'childId');
  validateObjectId(req.params.measurementId, 'measurementId');
  await requirePermission(req.user!.id, req.params.childId, 'canWrite');

  const body = measurementSchema.partial().parse(req.body);
  const doc = await GrowthMeasurementModel.findOneAndUpdate(
    { _id: req.params.measurementId, childId: req.params.childId },
    { $set: { ...body, ...(body.date ? { date: new Date(body.date) } : {}) } },
    { new: true },
  );
  if (!doc) throw Object.assign(new Error('Measurement not found'), { statusCode: 404, code: 'NOT_FOUND' });
  res.json(doc);
});

/** DELETE /children/:childId/growth/:measurementId */
router.delete('/:measurementId', requireAuth, async (req, res) => {
  validateObjectId(req.params.childId,       'childId');
  validateObjectId(req.params.measurementId, 'measurementId');
  await requirePermission(req.user!.id, req.params.childId, 'canWrite');

  await GrowthMeasurementModel.findOneAndDelete({
    _id: req.params.measurementId,
    childId: req.params.childId,
  });
  res.status(204).send();
});

export default router;
