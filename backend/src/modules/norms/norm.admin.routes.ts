import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middlewares/auth.middleware.ts';
import { requireAdmin } from '../../middlewares/admin.middleware.ts';
import { validateObjectId } from '../../utils/validate.ts';
import NormModel from './norm.model.ts';
import * as NormsService from './norms.service.ts';

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

// ── Existing Norm CRUD (unchanged) ──────────────────────────────────

router.post('/norms', requireAuth, requireAdmin, async (req, res) => {
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
});

router.get('/norms', requireAuth, requireAdmin, async (_req, res) => {
  res.json(await NormModel.find().sort({
    version: -1,
    metric: 1,
    ageWeeksMin: 1
  }).lean());
});

router.delete('/norms/:id', requireAuth, requireAdmin, async (req, res) => {
  validateObjectId(req.params.id, 'normId');
  await NormModel.findByIdAndDelete(req.params.id);
  res.status(204).send();
});

// ── AI Research Pipeline ────────────────────────────────────────────

const researchSchema = z.object({
  metric: z.enum(['sleepMinutesPerDay', 'feedsPerDay', 'wakeWindowMinutes']).optional(),
  ageWeeksMin: z.number().int().nonnegative().optional(),
  ageWeeksMax: z.number().int().nonnegative().optional(),
  version: z.string().min(1).optional(),
});

router.post('/norms/research', requireAuth, requireAdmin, async (req, res) => {
  const body = researchSchema.parse(req.body);
  const result = await NormsService.researchNorms({
    adminUserId: req.user!.id,
    metric: body.metric,
    ageWeeksMin: body.ageWeeksMin,
    ageWeeksMax: body.ageWeeksMax,
    version: body.version,
  });
  res.json(result);
});

// ── Suggestion Management ───────────────────────────────────────────

router.get('/norms/suggestions', requireAuth, requireAdmin, async (req, res) => {
  const result = await NormsService.listSuggestions({
    status: req.query.status as string | undefined,
    metric: req.query.metric as string | undefined,
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
  });
  res.json(result);
});

// approve-batch must be defined BEFORE /:id routes to avoid param shadowing
const batchApproveSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(100),
});

router.post('/norms/suggestions/approve-batch', requireAuth, requireAdmin, async (req, res) => {
  const { ids } = batchApproveSchema.parse(req.body);
  ids.forEach((id) => validateObjectId(id, 'suggestionId'));
  const result = await NormsService.approveSuggestionBatch(ids, req.user!.id);
  res.json(result);
});

router.get('/norms/suggestions/:id', requireAuth, requireAdmin, async (req, res) => {
  validateObjectId(req.params.id, 'suggestionId');
  const result = await NormsService.getSuggestion(req.params.id);
  res.json(result);
});

router.post('/norms/suggestions/:id/approve', requireAuth, requireAdmin, async (req, res) => {
  validateObjectId(req.params.id, 'suggestionId');
  const { reviewNotes } = req.body ?? {};
  const result = await NormsService.approveSuggestion(req.params.id, req.user!.id, reviewNotes);
  res.json(result);
});

router.post('/norms/suggestions/:id/reject', requireAuth, requireAdmin, async (req, res) => {
  validateObjectId(req.params.id, 'suggestionId');
  const { reviewNotes } = z.object({ reviewNotes: z.string().min(1) }).parse(req.body);
  const result = await NormsService.rejectSuggestion(req.params.id, req.user!.id, reviewNotes);
  res.json(result);
});

// ── Bulk Import ─────────────────────────────────────────────────────

const bulkImportSchema = z.object({
  norms: z.array(upsertSchema).min(1).max(200),
});

router.post('/norms/bulk-import', requireAuth, requireAdmin, async (req, res) => {
  const { norms } = bulkImportSchema.parse(req.body);
  const result = await NormsService.bulkImportNorms(norms, req.user!.id);
  res.status(201).json(result);
});

// ── Coverage & Versions ─────────────────────────────────────────────

router.get('/norms/coverage', requireAuth, requireAdmin, async (req, res) => {
  const result = await NormsService.analyzeCoverage(req.query.version as string | undefined);
  res.json(result);
});

router.get('/norms/versions', requireAuth, requireAdmin, async (_req, res) => {
  const result = await NormsService.listVersions();
  res.json(result);
});

export default router;
