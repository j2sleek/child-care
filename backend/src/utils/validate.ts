import { Types } from 'mongoose';

// Require a full 24-hex-char ObjectId string (rejects 12-char strings that isValid() would accept)
const OBJECT_ID_RE = /^[a-f\d]{24}$/i;

export function validateObjectId(id: string, label = 'ID'): string {
  if (!OBJECT_ID_RE.test(id) || !Types.ObjectId.isValid(id)) {
    throw Object.assign(new Error(`Invalid ${label}`), { statusCode: 400, code: 'INVALID_ID' });
  }
  return id;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function validateDateParam(value: string | undefined, label: string): Date | undefined {
  if (value === undefined) return undefined;
  if (!DATE_RE.test(value)) {
    throw Object.assign(new Error(`Invalid ${label}: expected YYYY-MM-DD`), { statusCode: 400, code: 'INVALID_DATE' });
  }
  const d = new Date(value);
  if (isNaN(d.getTime())) {
    throw Object.assign(new Error(`Invalid ${label}: not a real date`), { statusCode: 400, code: 'INVALID_DATE' });
  }
  return d;
}
