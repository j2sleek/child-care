import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware.ts';
import { requireAdmin } from '../../middlewares/admin.middleware.ts';
import { validateDateParam } from '../../utils/validate.ts';
import * as MetricsService from './admin.metrics.service.ts';

const router = Router();

router.get('/metrics/overview', requireAuth, requireAdmin, async (_req, res) => {
  res.json(await MetricsService.getOverview());
});

router.get('/metrics/users', requireAuth, requireAdmin, async (req, res) => {
  const { granularity } = req.query as { granularity?: string };
  const from = validateDateParam(req.query.from as string | undefined, 'from');
  const to = validateDateParam(req.query.to as string | undefined, 'to');
  res.json(await MetricsService.getUserMetrics(
    from?.toISOString().slice(0, 10),
    to?.toISOString().slice(0, 10),
    (granularity as any) || 'month'
  ));
});

router.get('/metrics/children', requireAuth, requireAdmin, async (_req, res) => {
  res.json(await MetricsService.getChildMetrics());
});

router.get('/metrics/events', requireAuth, requireAdmin, async (req, res) => {
  const { granularity } = req.query as { granularity?: string };
  const from = validateDateParam(req.query.from as string | undefined, 'from');
  const to = validateDateParam(req.query.to as string | undefined, 'to');
  res.json(await MetricsService.getEventMetrics(
    from?.toISOString().slice(0, 10),
    to?.toISOString().slice(0, 10),
    (granularity as any) || 'month'
  ));
});

router.get('/metrics/access', requireAuth, requireAdmin, async (_req, res) => {
  res.json(await MetricsService.getAccessMetrics());
});

router.get('/metrics/ai', requireAuth, requireAdmin, async (_req, res) => {
  res.json(await MetricsService.getAiMetrics());
});

router.get('/metrics/system', requireAuth, requireAdmin, async (_req, res) => {
  res.json(await MetricsService.getSystemMetrics());
});

export default router;
