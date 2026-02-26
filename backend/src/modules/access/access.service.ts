import { Types } from 'mongoose';
import ChildAccessModel, { type ChildAccessDoc, type ChildRole } from './childAccess.model.ts';
import UserModel from '../users/user.model.ts';
import { markOnboardingStep } from '../../utils/onboarding.ts';
import { logAudit } from '../../utils/audit.ts';

export async function inviteUserToChild(inviterUserId: string, childId: string, targetUserId: string, role: ChildRole, permissions: { canRead: boolean; canWrite: boolean; canInvite: boolean }) {
  const inviterAccess = await ChildAccessModel.findOne({
    childId: new Types.ObjectId(childId),
    userId: new Types.ObjectId(inviterUserId)
  });
  if (!inviterAccess || !inviterAccess.permissions.canInvite) {
    const err: any = new Error('Forbidden');
    err.statusCode = 403;
    err.code = 'FORBIDDEN';
    throw err;
  }
  const doc = await ChildAccessModel.findOneAndUpdate({
    childId: new Types.ObjectId(childId),
    userId: new Types.ObjectId(targetUserId)
    },
    { role, permissions },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return doc;
}

export async function inviteByEmail(inviterUserId: string, childId: string, targetUserEmail: string, role: ChildRole, permissions: { canRead: boolean; canWrite: boolean; canInvite: boolean }) {
  const targetUser = await UserModel.findOne({
    email: targetUserEmail
  });
  if (!targetUser) {
    const err: any = new Error('Target user not found');
    err.statusCode = 404;
    err.code = 'USER_NOT_FOUND';
    throw err;
  }
  const result = await inviteUserToChild(inviterUserId, childId, targetUser._id.toString(), role, permissions);
  markOnboardingStep(inviterUserId, 'invitedCaregiver');
  logAudit({ userId: inviterUserId, action: 'access.grant', targetType: 'Child', targetId: childId, meta: { targetUserEmail, role } });
  return result;
}

export async function listAccessForChild(requesterUserId: string, childId: string) {
  const requesterAccess = await ChildAccessModel.findOne({
    childId: new Types.ObjectId(childId),
    userId: new Types.ObjectId(requesterUserId)
  });
  if (!requesterAccess || !requesterAccess.permissions.canInvite) {
    const err: any = new Error('Forbidden');
    err.statusCode = 403;
    err.code = 'FORBIDDEN';
    throw err;
  }
  return ChildAccessModel.find({ childId: new Types.ObjectId(childId) }).lean();
}

export async function revokeAccess(requesterUserId: string, accessId: string): Promise<void> {
  const accessRecord = await ChildAccessModel.findById(accessId);
  if (!accessRecord) {
    const err: any = new Error('Access record not found');
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  // Check that the requester has canInvite permission for this child
  const requesterAccess = await ChildAccessModel.findOne({
    childId: accessRecord.childId,
    userId: new Types.ObjectId(requesterUserId)
  });
  if (!requesterAccess || !requesterAccess.permissions.canInvite) {
    const err: any = new Error('Forbidden');
    err.statusCode = 403;
    err.code = 'FORBIDDEN';
    throw err;
  }

  // Prevent revoking your own access
  if (accessRecord.userId.toString() === requesterUserId) {
    const err: any = new Error('Cannot revoke your own access');
    err.statusCode = 400;
    err.code = 'CANNOT_REVOKE_SELF';
    throw err;
  }

  await ChildAccessModel.findByIdAndDelete(accessId);
  logAudit({ userId: requesterUserId, action: 'access.revoke', targetType: 'Child', targetId: accessRecord.childId.toString(), meta: { revokedUserId: accessRecord.userId.toString() } });
}
