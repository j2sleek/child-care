import { Router } from 'express';
import express from 'express';
import { createHmac, timingSafeEqual } from 'crypto';
import { requireAuth } from '../../middlewares/auth.middleware.ts';
import { getUserPlan, handleWebhook, startTrial } from './subscription.service.ts';
import { env } from '../../config/env.ts';

const router = Router();

/** GET /billing/plan — returns current plan info for the authenticated user */
router.get('/plan', requireAuth, async (req, res) => {
  const info = await getUserPlan(req.user!.id);
  res.json(info);
});

/** POST /billing/trial/start — opt-in to 14-day AI/voice trial (one-time, free users only) */
router.post('/trial/start', requireAuth, async (req, res) => {
  const info = await startTrial(req.user!.id);
  res.status(201).json(info);
});

/** POST /billing/webhook — receives plan updates from payment providers */
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    // HMAC verification
    const secret = env.BILLING_WEBHOOK_SECRET;
    if (secret) {
      const signature = req.headers['x-webhook-signature'] as string | undefined;
      if (!signature) {
        throw Object.assign(new Error('Missing webhook signature'), { statusCode: 401, code: 'UNAUTHORIZED' });
      }
      const expected = createHmac('sha256', secret)
        .update(req.body as Buffer)
        .digest('hex');
      const expectedBuf = Buffer.from(expected, 'utf8');
      const receivedBuf = Buffer.from(signature, 'utf8');
      const valid =
        expectedBuf.length === receivedBuf.length &&
        timingSafeEqual(expectedBuf, receivedBuf);
      if (!valid) {
        throw Object.assign(new Error('Invalid webhook signature'), { statusCode: 401, code: 'UNAUTHORIZED' });
      }
    }

    const body = JSON.parse((req.body as Buffer).toString('utf8'));
    const provider = (req.headers['x-webhook-provider'] as string | undefined) ?? 'unknown';
    const eventType: string = body.event_type ?? body.type ?? body.eventType ?? '';

    const result = await handleWebhook(provider, eventType, body);
    res.json(result);
  },
);

export default router;
