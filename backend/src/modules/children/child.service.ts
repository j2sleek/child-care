import { Types } from 'mongoose';
import ChildModel, { type ChildDoc } from './child.model.ts';
import ChildAccessModel, { type ChildAccessDoc } from '../access/childAccess.model.ts';

export async function createChild(name: string, dateOfBirth: Date, createdBy: string, role: string): Promise<ChildDoc> {
  if (!Types.ObjectId.isValid(createdBy)) {
    throw new Error('Invalid user ID');
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
  return child;
}

export async function listMyChildren(userId: string) {
  const accesses = await ChildAccessModel.find({ 
    userId: new Types.ObjectId(userId) 
  }).lean();
  const childIds = accesses.map((a) => a.childId);
  return ChildModel.find({ _id: { $in: childIds } }).lean();
}
