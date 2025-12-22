import { Types, type PipelineStage } from 'mongoose';
export async function sleepSummaryPerDay(userId: string, childId: string) {
  await requirePermission(userId, childId, 'canRead');
  const pipeline: PipelineStage[] = [
    { $match: { 
        childId: new Types.ObjectId(childId), 
        type: 'sleep' 
    } },
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

export async function feedingPattern(userId: string, childId: string) {
  await requirePermission(userId, childId, 'canRead');
  const pipeline: PipelineStage[] = [
    { $match: { 
        childId: new Types.ObjectId(childId), 
        type: 'feed' 
    } },
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

export async function wakeWindows(userId: string, childId: string) {
  await requirePermission(userId, childId, 'canRead');
  const pipeline: PipelineStage[] = [
    { $match: { 
        childId: new Types.ObjectId(childId), 
        type: 'sleep' 
    } },
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
            $subtract: ['$startTime', '$prevEnd'] }, 
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

export function normalizeInsights(params: { sleep: any[]; feeding: any[]; ageWeeks: number; }) {
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
