import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middlewares/auth.middleware.ts';
import { requirePlan } from '../../middlewares/plan.middleware.ts';
import { validateObjectId } from '../../utils/validate.ts';
import { isAiAvailable, providerSupports } from './providers/index.ts';
import * as AiService from './ai.service.ts';
import * as AiChatService from './ai.chat.service.ts';

const router = Router();

router.get('/status', (_req, res) => {
  const available = isAiAvailable();
  res.json({
    available,
    capabilities: {
      chat: providerSupports('chat'),
      transcription: providerSupports('transcription'),
    },
    ...(!available && { reason: 'AI provider not configured' }),
  });
});

router.get('/insights/:childId', requireAuth, requirePlan('pro'), async (req, res) => {
  validateObjectId(req.params.childId, 'childId');
  const result = await AiService.generateInsights(req.user!.id, req.params.childId);
  res.json(result);
});

router.get('/recommendations/:childId', requireAuth, requirePlan('pro'), async (req, res) => {
  validateObjectId(req.params.childId, 'childId');
  const result = await AiService.generateRecommendations(req.user!.id, req.params.childId);
  res.json(result);
});

router.get('/anomalies/:childId', requireAuth, requirePlan('pro'), async (req, res) => {
  validateObjectId(req.params.childId, 'childId');
  const result = await AiService.detectAnomalies(req.user!.id, req.params.childId);
  res.json(result);
});

router.get('/digest/:childId', requireAuth, requirePlan('pro'), async (req, res) => {
  validateObjectId(req.params.childId, 'childId');
  const result = await AiService.getDailyDigest(req.user!.id, req.params.childId);
  res.json(result);
});

router.get('/digest/:childId/:date', requireAuth, requirePlan('pro'), async (req, res) => {
  validateObjectId(req.params.childId, 'childId');
  const result = await AiService.getDailyDigest(req.user!.id, req.params.childId, req.params.date);
  res.json(result);
});

// --- Chat / Conversation ---

const sendMessageSchema = z.object({
  message: z.string().min(1).max(2000),
});

/** GET /ai/chat/:childId — fetch conversation history */
router.get('/chat/:childId', requireAuth, requirePlan('pro'), async (req, res) => {
  validateObjectId(req.params.childId, 'childId');
  const messages = await AiChatService.getChatHistory(req.user!.id, req.params.childId);
  res.json({ messages });
});

/** POST /ai/chat/:childId — send a message, receive AI reply */
router.post('/chat/:childId', requireAuth, requirePlan('pro'), async (req, res) => {
  validateObjectId(req.params.childId, 'childId');
  const { message } = sendMessageSchema.parse(req.body);
  const result = await AiChatService.sendChatMessage(req.user!.id, req.params.childId, message);
  res.json(result);
});

/** DELETE /ai/chat/:childId — clear conversation history */
router.delete('/chat/:childId', requireAuth, requirePlan('pro'), async (req, res) => {
  validateObjectId(req.params.childId, 'childId');
  await AiChatService.clearChat(req.user!.id, req.params.childId);
  res.status(204).send();
});

export default router;
