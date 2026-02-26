import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware.ts';
import { validateObjectId, validateDateParam } from '../../utils/validate.ts';
import * as AnalyticsService from './analytics.service.ts';

const router = Router();

router.get('/sleep/:childId', requireAuth, async (req, res) => {
  validateObjectId(req.params.childId, 'childId');
  const from = validateDateParam(req.query.from as string | undefined, 'from');
  const to = validateDateParam(req.query.to as string | undefined, 'to');
  res.json(await AnalyticsService.sleepSummaryPerDay(req.user!.id, req.params.childId, from?.toISOString().slice(0, 10), to?.toISOString().slice(0, 10)));
});

router.get('/feeding/:childId', requireAuth, async (req, res) => {
  validateObjectId(req.params.childId, 'childId');
  const from = validateDateParam(req.query.from as string | undefined, 'from');
  const to = validateDateParam(req.query.to as string | undefined, 'to');
  res.json(await AnalyticsService.feedingPattern(req.user!.id, req.params.childId, from?.toISOString().slice(0, 10), to?.toISOString().slice(0, 10)));
});

router.get('/wake-windows/:childId', requireAuth, async (req, res) => {
  validateObjectId(req.params.childId, 'childId');
  const from = validateDateParam(req.query.from as string | undefined, 'from');
  const to = validateDateParam(req.query.to as string | undefined, 'to');
  res.json(await AnalyticsService.wakeWindows(req.user!.id, req.params.childId, from?.toISOString().slice(0, 10), to?.toISOString().slice(0, 10)));
});

export default router;
