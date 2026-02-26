import { Types } from 'mongoose';
import CareEventModel from "../events/careEvent.model.js";
import { requirePermission } from "../../utils/permissions.js";
function buildDateMatch(childId, type, from, to) {
    const match = {
        childId: new Types.ObjectId(childId),
        type
    };
    if (from || to) {
        match.startTime = {};
        if (from)
            match.startTime.$gte = new Date(from);
        if (to)
            match.startTime.$lte = new Date(to);
    }
    return match;
}
export async function sleepSummaryPerDay(userId, childId, from, to) {
    await requirePermission(userId, childId, 'canRead');
    const pipeline = [
        { $match: buildDateMatch(childId, 'sleep', from, to) },
        { $project: {
                day: {
                    $dateToString: {
                        format: '%Y-%m-%d',
                        date: '$startTime'
                    }
                },
                durationMinutes: 1
            } },
        { $group: {
                _id: '$day',
                totalSleepMinutes: {
                    $sum: '$durationMinutes'
                },
                sessions: { $sum: 1 }
            } },
        { $sort: { _id: 1 } }
    ];
    return CareEventModel.aggregate(pipeline);
}
export async function feedingPattern(userId, childId, from, to) {
    await requirePermission(userId, childId, 'canRead');
    const pipeline = [
        { $match: buildDateMatch(childId, 'feed', from, to) },
        { $group: {
                _id: {
                    day: {
                        $dateToString: {
                            format: '%Y-%m-%d',
                            date: '$startTime'
                        }
                    }
                },
                totalAmount: { $sum: '$data.amountMl' },
                feedCount: { $sum: 1 }
            } },
        { $sort: { '_id.day': 1 } }
    ];
    return CareEventModel.aggregate(pipeline);
}
export async function wakeWindows(userId, childId, from, to) {
    await requirePermission(userId, childId, 'canRead');
    const pipeline = [
        { $match: buildDateMatch(childId, 'sleep', from, to) },
        { $sort: { startTime: 1 } },
        { $setWindowFields: {
                sortBy: { startTime: 1 },
                output: {
                    prevEnd: {
                        $shift: {
                            output: '$endTime',
                            by: -1
                        }
                    }
                }
            } },
        { $project: {
                wakeWindowMinutes: {
                    $cond: [
                        { $and: ['$prevEnd', '$startTime'] },
                        { $divide: [{
                                    $subtract: ['$startTime', '$prevEnd']
                                },
                                60000
                            ] },
                        null
                    ]
                },
                startTime: 1,
                endTime: 1
            } }
    ];
    return CareEventModel.aggregate(pipeline);
}
export function normalizeInsights(params) {
    return {
        sleep: params.sleep.map((d) => ({
            day: d._id,
            totalSleepMinutes: d.totalSleepMinutes,
            sessions: d.sessions
        })),
        feeding: params.feeding.map((d) => ({
            day: d._id.day,
            totalAmount: d.totalAmount,
            feedCount: d.feedCount
        })),
        ageWeeks: params.ageWeeks
    };
}
