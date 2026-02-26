import { Types } from 'mongoose';
import CareEventModel from "./careEvent.model.js";
import { requirePermission } from "../../utils/permissions.js";
import { invalidateAiCache } from "../ai/ai.service.js";
export async function recordEvent(params) {
    await requirePermission(params.userId, params.childId, 'canWrite');
    const doc = await CareEventModel.create({
        childId: new Types.ObjectId(params.childId),
        recordedBy: new Types.ObjectId(params.userId),
        type: params.type,
        startTime: params.startTime,
        endTime: params.endTime,
        durationMinutes: params.durationMinutes,
        data: params.data,
        notes: params.notes
    });
    invalidateAiCache(params.childId).catch(() => { });
    return doc;
}
export async function listTimeline(userId, childId, limit = 50, offset = 0) {
    await requirePermission(userId, childId, 'canRead');
    return CareEventModel.find({
        childId: new Types.ObjectId(childId)
    })
        .sort({ startTime: -1 })
        .skip(offset)
        .limit(limit)
        .lean();
}
export async function updateEvent(userId, eventId, updates) {
    const event = await CareEventModel.findById(eventId);
    if (!event) {
        const err = new Error('Event not found');
        err.statusCode = 404;
        err.code = 'NOT_FOUND';
        throw err;
    }
    await requirePermission(userId, event.childId.toString(), 'canWrite');
    const updated = await CareEventModel.findByIdAndUpdate(eventId, { $set: updates }, { new: true }).lean();
    invalidateAiCache(event.childId.toString()).catch(() => { });
    return updated;
}
export async function deleteEvent(userId, eventId) {
    const event = await CareEventModel.findById(eventId);
    if (!event) {
        const err = new Error('Event not found');
        err.statusCode = 404;
        err.code = 'NOT_FOUND';
        throw err;
    }
    await requirePermission(userId, event.childId.toString(), 'canWrite');
    await CareEventModel.findByIdAndDelete(eventId);
    invalidateAiCache(event.childId.toString()).catch(() => { });
}
