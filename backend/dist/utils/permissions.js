import { Types } from 'mongoose';
import ChildAccessModel from "../modules/access/childAccess.model.js";
export async function getAccessFor(userId, childId) {
    return ChildAccessModel.findOne({
        userId: new Types.ObjectId(userId),
        childId: new Types.ObjectId(childId)
    }).lean();
}
export async function requirePermission(userId, childId, perm) {
    const access = await getAccessFor(userId, childId);
    if (!access || !access.permissions?.[perm]) {
        const err = new Error('Forbidden');
        err.statusCode = 403;
        err.code = 'FORBIDDEN';
        throw err;
    }
}
