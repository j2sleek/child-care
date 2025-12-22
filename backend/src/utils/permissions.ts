import { Types } from 'mongoose';
import ChildAccessModel, { ChildAccessDoc } from '../modules/access/childAccess.model.js'

export async function getAccessFor(userId: string, childId: string): Promise<ChildAccessDoc | null> {
  return ChildAccessModel.findOne({
    userId: new Types.ObjectId(userId),
    childId: new Types.ObjectId(childId)
  }).lean();
}

export async function requirePermission(userId: string, childId: string, perm: 'canRead'|'canWrite'|'canInvite') {
  const access = await getAccessFor(userId, childId);
  if (!access || !access.permissions?.[perm]) {
    const err: any = new Error('Forbidden');
    err.statusCode = 403;
    err.code = 'FORBIDDEN';
    throw err;
  }
}