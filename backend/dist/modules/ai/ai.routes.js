import { Router } from 'express';
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { validateObjectId } from "../../utils/validate.js";
import { isAiAvailable } from "./providers/index.js";
import * as AiService from "./ai.service.js";
const router = Router();
router.get('/status', (_req, res) => {
    const available = isAiAvailable();
    res.json({
        available,
        ...(!available && { reason: 'AI provider not configured' })
    });
});
router.get('/insights/:childId', requireAuth, async (req, res) => {
    validateObjectId(req.params.childId, 'childId');
    const result = await AiService.generateInsights(req.user.id, req.params.childId);
    res.json(result);
});
router.get('/recommendations/:childId', requireAuth, async (req, res) => {
    validateObjectId(req.params.childId, 'childId');
    const result = await AiService.generateRecommendations(req.user.id, req.params.childId);
    res.json(result);
});
router.get('/anomalies/:childId', requireAuth, async (req, res) => {
    validateObjectId(req.params.childId, 'childId');
    const result = await AiService.detectAnomalies(req.user.id, req.params.childId);
    res.json(result);
});
router.get('/digest/:childId', requireAuth, async (req, res) => {
    validateObjectId(req.params.childId, 'childId');
    const result = await AiService.getDailyDigest(req.user.id, req.params.childId);
    res.json(result);
});
router.get('/digest/:childId/:date', requireAuth, async (req, res) => {
    validateObjectId(req.params.childId, 'childId');
    const result = await AiService.getDailyDigest(req.user.id, req.params.childId, req.params.date);
    res.json(result);
});
export default router;
