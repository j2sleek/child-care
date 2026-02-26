import { Types } from 'mongoose';
import ChildModel, { type ChildDoc } from './child.model.ts';
import ChildAccessModel from '../access/childAccess.model.ts';
import CareEventModel from '../events/careEvent.model.ts';
import AiDigestModel from '../ai/aiDigest.model.ts';
import AiConversationModel from '../ai/aiConversation.model.ts';
import { requirePermission } from '../../utils/permissions.ts';
import { validateObjectId } from '../../utils/validate.ts';
import { env } from '../../config/env.ts';
import { generatePresignedUploadUrl, deleteObject, getPublicUrl } from '../upload/s3.service.ts';
import { randomUUID } from 'crypto';
import { getUserPlan, countChildrenForUser } from '../billing/subscription.service.ts';
import { markOnboardingStep } from '../../utils/onboarding.ts';
import GrowthMeasurementModel from './growth.model.ts';
import { logAudit } from '../../utils/audit.ts';

export async function createChild(name: string, dateOfBirth: Date, createdBy: string, role: string): Promise<ChildDoc> {
  validateObjectId(createdBy, 'userId');

  const { limits } = await getUserPlan(createdBy);
  if (limits.maxChildren !== Infinity) {
    const count = await countChildrenForUser(createdBy);
    if (count >= limits.maxChildren) {
      throw Object.assign(
        new Error(
          `Free plan allows ${limits.maxChildren} child profile. Upgrade to Pro for unlimited children.`,
        ),
        { statusCode: 403, code: 'QUOTA_EXCEEDED' },
      );
    }
  }

  const child = await ChildModel.create({
    name,
    dateOfBirth,
    createdBy: new Types.ObjectId(createdBy)
  });
  await ChildAccessModel.create({
    childId: child._id,
    userId: new Types.ObjectId(createdBy),
    role: role,
    permissions: {
      canRead: true,
      canWrite: true,
      canInvite: true
    }
  });
  markOnboardingStep(createdBy, 'addedFirstChild');
  return child;
}

export async function listMyChildren(userId: string) {
  const accesses = await ChildAccessModel.find({
    userId: new Types.ObjectId(userId)
  }).lean();
  const childIds = accesses.map((a) => a.childId);
  return ChildModel.find({ _id: { $in: childIds } }).lean();
}

export async function updateChild(userId: string, childId: string, updates: { name?: string; dateOfBirth?: Date }): Promise<ChildDoc> {
  await requirePermission(userId, childId, 'canWrite');
  const child = await ChildModel.findByIdAndUpdate(
    childId,
    { $set: updates },
    { new: true }
  );
  if (!child) {
    throw Object.assign(new Error('Child not found'), { statusCode: 404, code: 'NOT_FOUND' });
  }
  return child;
}

export async function deleteChild(userId: string, childId: string): Promise<void> {
  await requirePermission(userId, childId, 'canWrite');
  const child = await ChildModel.findByIdAndDelete(childId);
  if (!child) {
    throw Object.assign(new Error('Child not found'), { statusCode: 404, code: 'NOT_FOUND' });
  }
  // Cascade-delete all related documents and S3 avatar in parallel
  const tasks: Promise<unknown>[] = [
    ChildAccessModel.deleteMany({ childId: new Types.ObjectId(childId) }),
    CareEventModel.deleteMany({ childId: new Types.ObjectId(childId) }),
    AiDigestModel.deleteMany({ childId: new Types.ObjectId(childId) }),
    AiConversationModel.deleteMany({ childId: new Types.ObjectId(childId) }),
    GrowthMeasurementModel.deleteMany({ childId: new Types.ObjectId(childId) }),
  ];
  if (child.avatarKey) {
    tasks.push(deleteObject(child.avatarKey));
  }
  await Promise.all(tasks);
  logAudit({ userId, action: 'child.delete', targetType: 'Child', targetId: childId });
}

/** Returns a presigned S3 URL the client uses to upload the avatar directly. */
export async function getAvatarUploadUrl(
  userId: string,
  childId: string,
  contentType: string,
): Promise<{ uploadUrl: string; avatarKey: string; publicUrl: string }> {
  await requirePermission(userId, childId, 'canWrite');
  const ext = contentType.split('/')[1] ?? 'jpg';
  const avatarKey = `${env.S3_AVATAR_PREFIX}${childId}/${randomUUID()}.${ext}`;
  const { uploadUrl, publicUrl } = await generatePresignedUploadUrl(avatarKey, contentType);
  return { uploadUrl, avatarKey, publicUrl };
}

/** Confirms avatar upload: stores the key/url on the child document. */
export async function confirmAvatar(
  userId: string,
  childId: string,
  avatarKey: string,
): Promise<ChildDoc> {
  await requirePermission(userId, childId, 'canWrite');
  const child = await ChildModel.findById(childId);
  if (!child) {
    throw Object.assign(new Error('Child not found'), { statusCode: 404, code: 'NOT_FOUND' });
  }
  // Delete old avatar from S3 if one exists
  if (child.avatarKey && child.avatarKey !== avatarKey) {
    await deleteObject(child.avatarKey).catch(() => undefined);
  }
  child.avatarKey = avatarKey;
  child.avatarUrl = getPublicUrl(avatarKey);
  await child.save();
  return child;
}

/** Removes the avatar from S3 and clears the fields. */
export async function removeAvatar(userId: string, childId: string): Promise<void> {
  await requirePermission(userId, childId, 'canWrite');
  const child = await ChildModel.findById(childId);
  if (!child) {
    throw Object.assign(new Error('Child not found'), { statusCode: 404, code: 'NOT_FOUND' });
  }
  if (child.avatarKey) {
    await deleteObject(child.avatarKey).catch(() => undefined);
  }
  child.avatarKey = undefined;
  child.avatarUrl = undefined;
  await child.save();
}
