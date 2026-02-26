import { Router } from 'express';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { requireAuth } from '../../middlewares/auth.middleware.ts';
import { validateObjectId } from '../../utils/validate.ts';
import * as AccessService from './access.service.ts';
import ChildAccessModel from './childAccess.model.ts';
import InviteLinkModel from './inviteLink.model.ts';

const router = Router();

const inviteSchema = z.object({
  childId: z.string().min(1),
  targetUserEmail: z.string().email(),
  role: z.enum(['father', 'mother', 'nanny', 'doctor']),
  permissions: z.object({
    canRead: z.boolean(),
    canWrite: z.boolean(),
    canInvite: z.boolean()
  })
});

router.post('/invite', requireAuth, async (req, res) => {
  const body = inviteSchema.parse(req.body);
  validateObjectId(body.childId, 'childId');
  const result = await AccessService.inviteByEmail(
    req.user!.id,
    body.childId,
    body.targetUserEmail,
    body.role,
    body.permissions
  );
  res.status(201).json({
    id: result._id,
    childId: result.childId,
    userId: result.userId,
    role: result.role,
    permissions: result.permissions
  });
});

router.get('/list/:childId', requireAuth, async (req, res) => {
  validateObjectId(req.params.childId, 'childId');
  const list = await AccessService.listAccessForChild(req.user!.id, req.params.childId);
  res.json(list.map(a => ({
    id: a._id,
    childId: a.childId,
    userId: a.userId,
    role: a.role,
    permissions: a.permissions
  })));
});

router.delete('/:accessId', requireAuth, async (req, res) => {
  validateObjectId(req.params.accessId, 'accessId');
  await AccessService.revokeAccess(req.user!.id, req.params.accessId);
  res.status(204).send();
});

// ── Invite Links ─────────────────────────────────────────────────────

const inviteLinkSchema = z.object({
  childId: z.string().min(1),
  role: z.enum(['father', 'mother', 'nanny', 'doctor']),
  permissions: z.object({
    canRead:   z.boolean(),
    canWrite:  z.boolean(),
    canInvite: z.boolean(),
  }),
  expiresInHours: z.number().int().min(1).max(168).default(48),
  maxUses: z.number().int().min(1).max(100).default(10),
});

/** POST /access/invite-link — create a shareable invite link */
router.post('/invite-link', requireAuth, async (req, res) => {
  const body = inviteLinkSchema.parse(req.body);
  validateObjectId(body.childId, 'childId');

  // Verify requester has canInvite permission
  const access = await ChildAccessModel.findOne({
    childId: body.childId,
    userId: req.user!.id,
  }).lean();
  if (!access?.permissions.canInvite) {
    throw Object.assign(new Error('Forbidden'), { statusCode: 403, code: 'FORBIDDEN' });
  }

  const expiresAt = new Date(Date.now() + body.expiresInHours * 60 * 60 * 1000);
  const link = await InviteLinkModel.create({
    token: randomUUID(),
    childId: body.childId,
    createdBy: req.user!.id,
    role: body.role,
    permissions: body.permissions,
    expiresAt,
    maxUses: body.maxUses,
    useCount: 0,
  });

  res.status(201).json({ token: link.token, expiresAt: link.expiresAt, maxUses: link.maxUses });
});

/** GET /access/join/:token — redeem an invite link (must be authenticated) */
router.get('/join/:token', requireAuth, async (req, res) => {
  const link = await InviteLinkModel.findOne({ token: req.params.token }).lean();

  if (!link) throw Object.assign(new Error('Invite link not found or expired'), { statusCode: 404, code: 'NOT_FOUND' });
  if (link.expiresAt < new Date()) throw Object.assign(new Error('Invite link has expired'), { statusCode: 410, code: 'LINK_EXPIRED' });
  if (link.useCount >= link.maxUses) throw Object.assign(new Error('Invite link has reached its maximum uses'), { statusCode: 410, code: 'LINK_EXHAUSTED' });

  // Grant access
  await ChildAccessModel.findOneAndUpdate(
    { childId: link.childId, userId: req.user!.id },
    { role: link.role, permissions: link.permissions },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  // Increment use count
  await InviteLinkModel.updateOne({ _id: link._id }, { $inc: { useCount: 1 } });

  res.json({ childId: link.childId, role: link.role, permissions: link.permissions });
});

export default router;
