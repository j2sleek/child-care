import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware.ts';
import * as AnalyticsService from './analytics.service.ts';

const router = Router();

router.get('/sleep/:childId', requireAuth, async (req, res, next) => {
  try { res.json(await AnalyticsService.sleepSummaryPerDay(req.user!.id, req.params.childId)); }
  catch (e) { next(e); }
});

router.get('/feeding/:childId', requireAuth, async (req, res, next) => {
  try { res.json(await AnalyticsService.feedingPattern(req.user!.id, req.params.childId)); }
  catch (e) { next(e); }
});

router.get('/wake-windows/:childId', requireAuth, async (req, res, next) => {
  try { res.json(await AnalyticsService.wakeWindows(req.user!.id, req.params.childId)); }
  catch (e) { next(e); }
});

export default router;
