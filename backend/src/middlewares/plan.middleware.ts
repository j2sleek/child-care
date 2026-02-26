import type { Request, Response, NextFunction } from 'express';
import { getUserPlan } from '../modules/billing/subscription.service.ts';
import type { PlanTier } from '../modules/billing/plan.config.ts';

export function requirePlan(tier: PlanTier) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const { plan } = await getUserPlan(req.user!.id);
    if (tier === 'pro' && plan !== 'pro') {
      throw Object.assign(
        new Error('This feature requires a Pro plan. Upgrade at /billing/upgrade'),
        { statusCode: 403, code: 'PLAN_REQUIRED' },
      );
    }
    next();
  };
}
