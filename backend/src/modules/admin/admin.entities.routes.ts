import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware.ts';
import { requireAdmin } from '../../middlewares/admin.middleware.ts';
import { validateObjectId } from '../../utils/validate.ts';
import * as EntitiesService from './admin.entities.service.ts';
import AuditLogModel from '../audit/auditLog.model.ts';

const router = Router();

// ── Users ───────────────────────────────────────────────────────────

router.get('/entities/users', requireAuth, requireAdmin, async (req, res) => {
  const { search, role, page, limit, sort, order } = req.query as Record<string, string | undefined>;
  res.json(await EntitiesService.listUsers({
    search,
    role,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    sort,
    order: order as 'asc' | 'desc' | undefined,
  }));
});

router.get('/entities/users/:userId', requireAuth, requireAdmin, async (req, res) => {
  validateObjectId(req.params.userId, 'userId');
  res.json(await EntitiesService.getUserDetail(req.params.userId));
});

// ── Children ────────────────────────────────────────────────────────

router.get('/entities/children', requireAuth, requireAdmin, async (req, res) => {
  const { search, createdBy, page, limit } = req.query as Record<string, string | undefined>;
  res.json(await EntitiesService.listChildren({
    search,
    createdBy,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
  }));
});

router.get('/entities/children/:childId', requireAuth, requireAdmin, async (req, res) => {
  validateObjectId(req.params.childId, 'childId');
  res.json(await EntitiesService.getChildDetail(req.params.childId));
});

// ── Events ──────────────────────────────────────────────────────────

router.get('/entities/events', requireAuth, requireAdmin, async (req, res) => {
  const { childId, type, recordedBy, from, to, page, limit } = req.query as Record<string, string | undefined>;
  res.json(await EntitiesService.listEvents({
    childId,
    type,
    recordedBy,
    from,
    to,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
  }));
});

// ── Access Records ──────────────────────────────────────────────────

router.get('/entities/access', requireAuth, requireAdmin, async (req, res) => {
  const { childId, userId, role, page, limit } = req.query as Record<string, string | undefined>;
  res.json(await EntitiesService.listAccess({
    childId,
    userId,
    role,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
  }));
});

// ── Audit Log ────────────────────────────────────────────────────────

router.get('/audit', requireAuth, requireAdmin, async (req, res) => {
  const { userId, action, page, limit } = req.query as Record<string, string | undefined>;
  const pageN  = Math.max(1, Number(page ?? 1));
  const limitN = Math.min(100, Math.max(1, Number(limit ?? 50)));
  const filter: any = {};
  if (userId) { validateObjectId(userId, 'userId'); filter.userId = userId; }
  if (action) filter.action = new RegExp(action, 'i');

  const [data, total] = await Promise.all([
    AuditLogModel.find(filter).sort({ createdAt: -1 }).skip((pageN - 1) * limitN).limit(limitN).lean(),
    AuditLogModel.countDocuments(filter),
  ]);
  res.json({ data, total, page: pageN, limit: limitN, totalPages: Math.ceil(total / limitN) });
});

export default router;
