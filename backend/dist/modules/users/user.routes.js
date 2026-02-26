import { Router } from 'express';
import { z } from 'zod';
import UserModel from "./user.model.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { requireAdmin } from "../../middlewares/admin.middleware.js";
import { validateObjectId } from "../../utils/validate.js";
import { promoteToAdmin } from "../auth/auth.service.js";
const router = Router();
const updateProfileSchema = z.object({
    name: z.string().min(1).optional(),
    email: z.email().optional()
}).refine(data => data.name || data.email, { message: 'At least one field required' });
router.get('/me', requireAuth, async (req, res) => {
    const me = await UserModel.findById(req.user.id).lean();
    if (!me)
        return res.status(404).json({
            code: 'NOT_FOUND',
            message: 'User not found'
        });
    res.json({
        id: me._id,
        email: me.email,
        name: me.name,
        role: me.role
    });
});
router.patch('/me', requireAuth, async (req, res) => {
    const body = updateProfileSchema.parse(req.body);
    const updates = {};
    if (body.name)
        updates.name = body.name;
    if (body.email) {
        const existing = await UserModel.findOne({ email: body.email });
        if (existing && existing._id.toString() !== req.user.id) {
            return res.status(400).json({ code: 'EMAIL_EXISTS', message: 'Email already in use' });
        }
        updates.email = body.email;
    }
    const user = await UserModel.findByIdAndUpdate(req.user.id, updates, { new: true }).lean();
    if (!user)
        return res.status(404).json({ code: 'NOT_FOUND', message: 'User not found' });
    res.json({ id: user._id, email: user.email, name: user.name, role: user.role });
});
router.post('/promote/:userId', requireAuth, requireAdmin, async (req, res) => {
    validateObjectId(req.params.userId, 'userId');
    await promoteToAdmin(req.params.userId);
    res.json({ message: 'User promoted to admin' });
});
export default router;
