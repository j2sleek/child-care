import { Types } from 'mongoose';
export function validateObjectId(id, label = 'ID') {
    if (!Types.ObjectId.isValid(id)) {
        const err = new Error(`Invalid ${label}`);
        err.statusCode = 400;
        err.code = 'INVALID_ID';
        throw err;
    }
    return id;
}
