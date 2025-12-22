import { Types } from 'mongoose';
import ChildAccessModel, { ChildRole } from './childAccess.model.js';
import UserModel from '../users/user.model.js';

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
  return inviteUserToChild(inviterUserId, childId, targetUser._id.toString(), role, permissions);
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
