import { Types } from 'mongoose';
import CareEventModel, { type CareEventDoc, type CareEventType } from './careEvent.model.ts';
import { requirePermission } from '../../utils/permissions.ts';

export async function recordEvent(params: { 
    userId: string; 
    childId: string; 
    type: CareEventType; 
    startTime: Date; 
    endTime?: Date; 
    durationMinutes?: number; 
    data?: Record<string, any>; 
    notes?: string; 
  }): Promise<CareEventDoc> {
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
  return doc;
}

export async function listTimeline(userId: string, childId: string, limit = 50) {
  await requirePermission(userId, childId, 'canRead');
  return CareEventModel.find({ 
    childId: new Types.ObjectId(childId) 
  })
  .sort({ startTime: -1 })
  .limit(limit).lean();
}
