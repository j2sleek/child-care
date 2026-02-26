import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { validateObjectId } from "../../utils/validate.js";
import * as AccessService from "./access.service.js";
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
    const result = await AccessService.inviteByEmail(req.user.id, body.childId, body.targetUserEmail, body.role, body.permissions);
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
    const list = await AccessService.listAccessForChild(req.user.id, req.params.childId);
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
    await AccessService.revokeAccess(req.user.id, req.params.accessId);
    res.status(204).send();
});
export default router;
