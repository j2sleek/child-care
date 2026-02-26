import { Types } from 'mongoose';
import ChildModel from "./child.model.js";
import ChildAccessModel from "../access/childAccess.model.js";
import { requirePermission } from "../../utils/permissions.js";
import { validateObjectId } from "../../utils/validate.js";
export async function createChild(name, dateOfBirth, createdBy, role) {
    validateObjectId(createdBy, 'userId');
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
export async function listMyChildren(userId) {
    const accesses = await ChildAccessModel.find({
        userId: new Types.ObjectId(userId)
    }).lean();
    const childIds = accesses.map((a) => a.childId);
    return ChildModel.find({ _id: { $in: childIds } }).lean();
}
export async function updateChild(userId, childId, updates) {
    await requirePermission(userId, childId, 'canWrite');
    const child = await ChildModel.findByIdAndUpdate(childId, { $set: updates }, { new: true });
    if (!child) {
        const err = new Error('Child not found');
        err.statusCode = 404;
        err.code = 'NOT_FOUND';
        throw err;
    }
    return child;
}
export async function deleteChild(userId, childId) {
    await requirePermission(userId, childId, 'canWrite');
    const child = await ChildModel.findByIdAndDelete(childId);
    if (!child) {
        const err = new Error('Child not found');
        err.statusCode = 404;
        err.code = 'NOT_FOUND';
        throw err;
    }
    // Clean up all access records for this child
    await ChildAccessModel.deleteMany({ childId: new Types.ObjectId(childId) });
}
