import { Types } from 'mongoose';
import ChildModel from "../children/child.model.js";
import CareEventModel from "../events/careEvent.model.js";
import NormModel from "../norms/norm.model.js";
import { sleepSummaryPerDay, feedingPattern, wakeWindows } from "../analytics/analytics.service.js";
import { env } from "../../config/env.js";
export async function collectChildContext(childId) {
    const child = await ChildModel.findById(childId).lean();
    if (!child) {
        throw Object.assign(new Error('Child not found'), { statusCode: 404, code: 'NOT_FOUND' });
    }
    const now = new Date();
    const ageMs = now.getTime() - new Date(child.dateOfBirth).getTime();
    const ageWeeks = Math.floor(ageMs / (7 * 24 * 60 * 60 * 1000));
    const ageMonths = Math.floor(ageMs / (30.44 * 24 * 60 * 60 * 1000));
    return {
        name: child.name,
        dateOfBirth: child.dateOfBirth,
        ageWeeks,
        ageMonths
    };
}
export async function collectRecentEvents(childId, days = 7) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const events = await CareEventModel.find({
        childId: new Types.ObjectId(childId),
        startTime: { $gte: since }
    }).sort({ startTime: -1 }).lean();
    return {
        sleep: events.filter(e => e.type === 'sleep'),
        feed: events.filter(e => e.type === 'feed'),
        diaper: events.filter(e => e.type === 'diaper'),
        mood: events.filter(e => e.type === 'mood')
    };
}
export async function collectAnalytics(userId, childId) {
    const [sleepSummary, feedingData, wakeWindowData] = await Promise.all([
        sleepSummaryPerDay(userId, childId),
        feedingPattern(userId, childId),
        wakeWindows(userId, childId)
    ]);
    return {
        sleepSummary,
        feedingPattern: feedingData,
        wakeWindows: wakeWindowData
    };
}
export async function collectNorms(ageWeeks) {
    const norms = await NormModel.find({
        version: env.NORMS_VERSION,
        ageWeeksMin: { $lte: ageWeeks },
        ageWeeksMax: { $gte: ageWeeks }
    }).lean();
    const result = {};
    for (const norm of norms) {
        result[norm.metric] = { low: norm.low, high: norm.high };
    }
    return result;
}
export async function buildAiContext(userId, childId) {
    const child = await collectChildContext(childId);
    const [recentEvents, analytics, norms] = await Promise.all([
        collectRecentEvents(childId),
        collectAnalytics(userId, childId),
        collectNorms(child.ageWeeks)
    ]);
    return { child, recentEvents, analytics, norms };
}
