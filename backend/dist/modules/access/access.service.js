import { Types } from 'mongoose';
import ChildAccessModel from "./childAccess.model.js";
import UserModel from "../users/user.model.js";
export async function inviteUserToChild(inviterUserId, childId, targetUserId, role, permissions) {
    const inviterAccess = await ChildAccessModel.findOne({
        childId: new Types.ObjectId(childId),
        userId: new Types.ObjectId(inviterUserId)
    });
    if (!inviterAccess || !inviterAccess.permissions.canInvite) {
        const err = new Error('Forbidden');
        err.statusCode = 403;
        err.code = 'FORBIDDEN';
        throw err;
    }
    const doc = await ChildAccessModel.findOneAndUpdate({
        childId: new Types.ObjectId(childId),
        userId: new Types.ObjectId(targetUserId)
    }, { role, permissions }, { upsert: true, new: true, setDefaultsOnInsert: true });
    return doc;
}
export async function inviteByEmail(inviterUserId, childId, targetUserEmail, role, permissions) {
    const targetUser = await UserModel.findOne({
        email: targetUserEmail
    });
    if (!targetUser) {
        const err = new Error('Target user not found');
        err.statusCode = 404;
        err.code = 'USER_NOT_FOUND';
        throw err;
    }
    return inviteUserToChild(inviterUserId, childId, targetUser._id.toString(), role, permissions);
}
export async function listAccessForChild(requesterUserId, childId) {
    const requesterAccess = await ChildAccessModel.findOne({
        childId: new Types.ObjectId(childId),
        userId: new Types.ObjectId(requesterUserId)
    });
    if (!requesterAccess || !requesterAccess.permissions.canInvite) {
        const err = new Error('Forbidden');
        err.statusCode = 403;
        err.code = 'FORBIDDEN';
        throw err;
    }
    return ChildAccessModel.find({ childId: new Types.ObjectId(childId) }).lean();
}
export async function revokeAccess(requesterUserId, accessId) {
    const accessRecord = await ChildAccessModel.findById(accessId);
    if (!accessRecord) {
        const err = new Error('Access record not found');
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
        const err = new Error('Forbidden');
        err.statusCode = 403;
        err.code = 'FORBIDDEN';
        throw err;
    }
    // Prevent revoking your own access
    if (accessRecord.userId.toString() === requesterUserId) {
        const err = new Error('Cannot revoke your own access');
        err.statusCode = 400;
        err.code = 'CANNOT_REVOKE_SELF';
        throw err;
    }
    await ChildAccessModel.findByIdAndDelete(accessId);
}
