import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { validateObjectId } from "../../utils/validate.js";
import * as EventService from "./event.service.js";
const router = Router();
const recordSchema = z.object({
    childId: z.string().min(1),
    type: z.enum(['sleep', 'feed', 'diaper', 'mood']),
    startTime: z.string().transform((s) => new Date(s)),
    endTime: z.string().optional().transform((s) => (s ? new Date(s) : undefined)),
    durationMinutes: z.number().optional(),
    data: z.record(z.string(), z.any()).optional(),
    notes: z.string().optional()
});
const updateEventSchema = z.object({
    startTime: z.string().transform((s) => new Date(s)).optional(),
    endTime: z.string().transform((s) => new Date(s)).optional(),
    durationMinutes: z.number().optional(),
    data: z.record(z.string(), z.any()).optional(),
    notes: z.string().optional()
});
router.post('/', requireAuth, async (req, res) => {
    const body = recordSchema.parse(req.body);
    validateObjectId(body.childId, 'childId');
    const doc = await EventService.recordEvent({
        userId: req.user.id,
        childId: body.childId,
        type: body.type,
        startTime: body.startTime,
        endTime: body.endTime,
        durationMinutes: body.durationMinutes,
        data: body.data,
        notes: body.notes
    });
    res.status(201).json({ id: doc._id });
});
router.get('/timeline/:childId', requireAuth, async (req, res) => {
    validateObjectId(req.params.childId, 'childId');
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const events = await EventService.listTimeline(req.user.id, req.params.childId, limit, offset);
    res.json(events);
});
router.patch('/:eventId', requireAuth, async (req, res) => {
    validateObjectId(req.params.eventId, 'eventId');
    const body = updateEventSchema.parse(req.body);
    const doc = await EventService.updateEvent(req.user.id, req.params.eventId, body);
    res.json(doc);
});
router.delete('/:eventId', requireAuth, async (req, res) => {
    validateObjectId(req.params.eventId, 'eventId');
    await EventService.deleteEvent(req.user.id, req.params.eventId);
    res.status(204).send();
});
export default router;
