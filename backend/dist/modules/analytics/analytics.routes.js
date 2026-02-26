import { Router } from 'express';
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { validateObjectId } from "../../utils/validate.js";
import * as AnalyticsService from "./analytics.service.js";
const router = Router();
router.get('/sleep/:childId', requireAuth, async (req, res) => {
    validateObjectId(req.params.childId, 'childId');
    const from = req.query.from;
    const to = req.query.to;
    res.json(await AnalyticsService.sleepSummaryPerDay(req.user.id, req.params.childId, from, to));
});
router.get('/feeding/:childId', requireAuth, async (req, res) => {
    validateObjectId(req.params.childId, 'childId');
    const from = req.query.from;
    const to = req.query.to;
    res.json(await AnalyticsService.feedingPattern(req.user.id, req.params.childId, from, to));
});
router.get('/wake-windows/:childId', requireAuth, async (req, res) => {
    validateObjectId(req.params.childId, 'childId');
    const from = req.query.from;
    const to = req.query.to;
    res.json(await AnalyticsService.wakeWindows(req.user.id, req.params.childId, from, to));
});
export default router;
