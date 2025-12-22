import { Types } from 'mongoose';
import ChildModel, { ChildDoc } from './child.model.js';
import ChildAccessModel from '../access/childAccess.model.js';

export async function createChild(name: string, dateOfBirth: Date, createdBy: string, role: string): Promise<ChildDoc> {
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
