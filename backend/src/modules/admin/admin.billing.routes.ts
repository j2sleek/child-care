import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middlewares/auth.middleware.ts';
import { requireAdmin } from '../../middlewares/admin.middleware.ts';
import { validateObjectId } from '../../utils/validate.ts';
import { adminSetPlan } from '../billing/subscription.service.ts';
import * as AdminBillingService from './admin.billing.service.ts';
import type { PlanTier } from '../billing/plan.config.ts';

const router = Router();

/** GET /admin/billing/subscriptions — paginated list of subscriptions */
router.get('/billing/subscriptions', requireAuth, requireAdmin, async (req, res) => {
  const { plan, status, search, page, limit } = req.query as Record<string, string | undefined>;
  res.json(await AdminBillingService.listSubscriptions({
    plan,
    status,
    search,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
  }));
});

/** GET /admin/billing/subscriptions/:userId — single user subscription + usage */
router.get('/billing/subscriptions/:userId', requireAuth, requireAdmin, async (req, res) => {
  validateObjectId(req.params.userId, 'userId');
  res.json(await AdminBillingService.getUserSubscriptionDetail(req.params.userId));
});

/** GET /admin/metrics/billing — billing aggregate metrics */
router.get('/metrics/billing', requireAuth, requireAdmin, async (_req, res) => {
  res.json(await AdminBillingService.getBillingMetrics());
});

const setAdminPlanSchema = z.object({
  plan: z.enum(['free', 'pro']),
  status: z.enum(['active', 'canceled', 'past_due', 'trialing']).optional(),
});

/** POST /admin/billing/subscriptions/:userId — override a user's plan */
router.post('/billing/subscriptions/:userId', requireAuth, requireAdmin, async (req, res) => {
  validateObjectId(req.params.userId, 'userId');
  const { plan, status } = setAdminPlanSchema.parse(req.body);
  await adminSetPlan(req.params.userId, plan as PlanTier, status, req.user!.id);
  res.json({ ok: true });
});

export default router;
