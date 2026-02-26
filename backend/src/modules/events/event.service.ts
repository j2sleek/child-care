import { Types } from 'mongoose';
import CareEventModel, { type CareEventDoc, type CareEventType } from './careEvent.model.ts';
import { requirePermission } from '../../utils/permissions.ts';
import { invalidateAiCache } from '../ai/ai.service.ts';
import { getUserPlan, countEventsThisMonth } from '../billing/subscription.service.ts';
import { markOnboardingStep } from '../../utils/onboarding.ts';
import { notifyCoCaregiversOfEvent } from '../notifications/notification.service.ts';
import UserModel from '../users/user.model.ts';
import ChildModel from '../children/child.model.ts';

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

  const { limits } = await getUserPlan(params.userId);
  if (limits.maxEventsPerMonth !== Infinity) {
    const count = await countEventsThisMonth(params.userId);
    if (count >= limits.maxEventsPerMonth) {
      throw Object.assign(
        new Error(
          `Free plan allows ${limits.maxEventsPerMonth} events/month. Upgrade to Pro for unlimited logging.`,
        ),
        { statusCode: 403, code: 'QUOTA_EXCEEDED' },
      );
    }
  }

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
  invalidateAiCache(params.childId).catch(() => {});
  markOnboardingStep(params.userId, 'loggedFirstEvent');

  // Notify co-caregivers (fire-and-forget)
  Promise.all([
    UserModel.findById(params.userId, 'name').lean(),
    ChildModel.findById(params.childId, 'name').lean(),
  ]).then(([recorder, child]) => {
    if (!recorder || !child) return;
    notifyCoCaregiversOfEvent({
      childId: params.childId,
      recorderUserId: params.userId,
      recorderName: (recorder as any).name ?? (recorder as any).email ?? 'A caregiver',
      childName: (child as any).name,
      eventType: params.type,
    }).catch(() => {});
  }).catch(() => {});

  return doc;
}

export async function listTimeline(userId: string, childId: string, limit = 50, offset = 0) {
  await requirePermission(userId, childId, 'canRead');
  return CareEventModel.find({
    childId: new Types.ObjectId(childId)
  })
  .sort({ startTime: -1 })
  .skip(offset)
  .limit(limit)
  .lean();
}

export async function updateEvent(userId: string, eventId: string, updates: {
    startTime?: Date;
    endTime?: Date;
    durationMinutes?: number;
    data?: Record<string, any>;
    notes?: string;
  }): Promise<CareEventDoc> {
  const event = await CareEventModel.findById(eventId);
  if (!event) {
    const err: any = new Error('Event not found');
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }
  await requirePermission(userId, event.childId.toString(), 'canWrite');
  const updated = await CareEventModel.findByIdAndUpdate(eventId, { $set: updates }, { new: true }).lean();
  invalidateAiCache(event.childId.toString()).catch(() => {});
  return updated as CareEventDoc;
}

export async function deleteEvent(userId: string, eventId: string): Promise<void> {
  const event = await CareEventModel.findById(eventId);
  if (!event) {
    const err: any = new Error('Event not found');
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }
  await requirePermission(userId, event.childId.toString(), 'canWrite');
  await CareEventModel.findByIdAndDelete(eventId);
  invalidateAiCache(event.childId.toString()).catch(() => {});
}
