import { Types } from 'mongoose';
import UserModel from '../users/user.model.ts';
import ChildModel from '../children/child.model.ts';
import CareEventModel from '../events/careEvent.model.ts';
import ChildAccessModel from '../access/childAccess.model.ts';
import AiDigestModel from '../ai/aiDigest.model.ts';

interface PaginationOpts {
  page?: number;
  limit?: number;
}

function paginate(opts: PaginationOpts) {
  const page = Math.max(1, opts.page ?? 1);
  const limit = Math.min(100, Math.max(1, opts.limit ?? 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

function paginatedResponse<T>(data: T[], total: number, page: number, limit: number) {
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

// ── Users ───────────────────────────────────────────────────────────

interface ListUsersOpts extends PaginationOpts {
  search?: string;
  role?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export async function listUsers(opts: ListUsersOpts) {
  const { page, limit, skip } = paginate(opts);
  const filter: any = {};

  if (opts.search) {
    const regex = new RegExp(opts.search, 'i');
    filter.$or = [{ name: regex }, { email: regex }];
  }
  if (opts.role) filter.role = opts.role;

  const ALLOWED_SORT_FIELDS = ['createdAt', 'name', 'email', 'role'] as const;
  const sortField = ALLOWED_SORT_FIELDS.includes(opts.sort as any) ? opts.sort! : 'createdAt';
  const sortOrder = opts.order === 'asc' ? 1 : -1;

  const [data, total] = await Promise.all([
    UserModel.find(filter)
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean(),
    UserModel.countDocuments(filter),
  ]);

  return paginatedResponse(data, total, page, limit);
}

export async function getUserDetail(userId: string) {
  const user = await UserModel.findById(userId).lean();
  if (!user) {
    throw Object.assign(new Error('User not found'), { statusCode: 404, code: 'NOT_FOUND' });
  }

  const [children, access, eventCount] = await Promise.all([
    ChildModel.find({ createdBy: new Types.ObjectId(userId) }).lean(),
    ChildAccessModel.find({ userId: new Types.ObjectId(userId) })
      .populate('childId', 'name dateOfBirth')
      .lean(),
    CareEventModel.countDocuments({ recordedBy: new Types.ObjectId(userId) }),
  ]);

  return { ...user, children, access, eventCount };
}

// ── Children ────────────────────────────────────────────────────────

interface ListChildrenOpts extends PaginationOpts {
  search?: string;
  createdBy?: string;
}

export async function listChildren(opts: ListChildrenOpts) {
  const { page, limit, skip } = paginate(opts);
  const filter: any = {};

  if (opts.search) {
    filter.name = new RegExp(opts.search, 'i');
  }
  if (opts.createdBy) {
    filter.createdBy = new Types.ObjectId(opts.createdBy);
  }

  const [data, total] = await Promise.all([
    ChildModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'name email')
      .lean(),
    ChildModel.countDocuments(filter),
  ]);

  return paginatedResponse(data, total, page, limit);
}

export async function getChildDetail(childId: string) {
  const child = await ChildModel.findById(childId)
    .populate('createdBy', 'name email')
    .lean();
  if (!child) {
    throw Object.assign(new Error('Child not found'), { statusCode: 404, code: 'NOT_FOUND' });
  }

  const [access, recentEvents, eventCountsByType, digests] = await Promise.all([
    ChildAccessModel.find({ childId: new Types.ObjectId(childId) })
      .populate('userId', 'name email')
      .lean(),
    CareEventModel.find({ childId: new Types.ObjectId(childId) })
      .sort({ startTime: -1 })
      .limit(20)
      .populate('recordedBy', 'name email')
      .lean(),
    CareEventModel.aggregate([
      { $match: { childId: new Types.ObjectId(childId) } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]),
    AiDigestModel.find({ childId: new Types.ObjectId(childId) })
      .sort({ date: -1 })
      .limit(10)
      .lean(),
  ]);

  return {
    ...child,
    access,
    recentEvents,
    eventCountsByType: Object.fromEntries(eventCountsByType.map((e: any) => [e._id, e.count])),
    digests,
  };
}

// ── Events ──────────────────────────────────────────────────────────

interface ListEventsOpts extends PaginationOpts {
  childId?: string;
  type?: string;
  recordedBy?: string;
  from?: string;
  to?: string;
}

export async function listEvents(opts: ListEventsOpts) {
  const { page, limit, skip } = paginate(opts);
  const filter: any = {};

  if (opts.childId) filter.childId = new Types.ObjectId(opts.childId);
  if (opts.type) filter.type = opts.type;
  if (opts.recordedBy) filter.recordedBy = new Types.ObjectId(opts.recordedBy);
  if (opts.from || opts.to) {
    filter.startTime = {};
    if (opts.from) filter.startTime.$gte = new Date(opts.from);
    if (opts.to) filter.startTime.$lte = new Date(opts.to);
  }

  const [data, total] = await Promise.all([
    CareEventModel.find(filter)
      .sort({ startTime: -1 })
      .skip(skip)
      .limit(limit)
      .populate('recordedBy', 'name email')
      .populate('childId', 'name')
      .lean(),
    CareEventModel.countDocuments(filter),
  ]);

  return paginatedResponse(data, total, page, limit);
}

// ── Access Records ──────────────────────────────────────────────────

interface ListAccessOpts extends PaginationOpts {
  childId?: string;
  userId?: string;
  role?: string;
}

export async function listAccess(opts: ListAccessOpts) {
  const { page, limit, skip } = paginate(opts);
  const filter: any = {};

  if (opts.childId) filter.childId = new Types.ObjectId(opts.childId);
  if (opts.userId) filter.userId = new Types.ObjectId(opts.userId);
  if (opts.role) filter.role = opts.role;

  const [data, total] = await Promise.all([
    ChildAccessModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name email')
      .populate('childId', 'name')
      .lean(),
    ChildAccessModel.countDocuments(filter),
  ]);

  return paginatedResponse(data, total, page, limit);
}
