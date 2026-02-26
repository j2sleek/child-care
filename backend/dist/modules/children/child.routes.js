import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { validateObjectId } from "../../utils/validate.js";
import * as ChildService from "./child.service.js";
const router = Router();
const createChildSchema = z.object({
    name: z.string().min(1),
    role: z.string(),
    dateOfBirth: z.string().transform((s) => {
        if (/^\d{2}-\d{2}-\d{4}$/.test(s)) {
            const [day, month, year] = s.split('-');
            return new Date(`${year}-${month}-${day}`);
        }
        return new Date(s);
    })
});
const updateChildSchema = z.object({
    name: z.string().min(1).optional(),
    dateOfBirth: z.string().transform((s) => {
        if (/^\d{2}-\d{2}-\d{4}$/.test(s)) {
            const [day, month, year] = s.split('-');
            return new Date(`${year}-${month}-${day}`);
        }
        return new Date(s);
    }).optional()
}).refine(data => data.name || data.dateOfBirth, { message: 'At least one field required' });
router.post('/', requireAuth, async (req, res) => {
    const body = createChildSchema.parse(req.body);
    const child = await ChildService.createChild(body.name, body.dateOfBirth, req.user.id, body.role);
    res.status(201).json({
        id: child._id,
        name: child.name,
        dateOfBirth: child.dateOfBirth.toISOString()
    });
});
router.get('/mine', requireAuth, async (req, res) => {
    const children = await ChildService.listMyChildren(req.user.id);
    res.json(children.map((c) => ({
        id: c._id,
        name: c.name,
        dateOfBirth: c.dateOfBirth.toISOString()
    })));
});
router.patch('/:childId', requireAuth, async (req, res) => {
    validateObjectId(req.params.childId, 'childId');
    const body = updateChildSchema.parse(req.body);
    const child = await ChildService.updateChild(req.user.id, req.params.childId, body);
    res.json({
        id: child._id,
        name: child.name,
        dateOfBirth: child.dateOfBirth.toISOString()
    });
});
router.delete('/:childId', requireAuth, async (req, res) => {
    validateObjectId(req.params.childId, 'childId');
    await ChildService.deleteChild(req.user.id, req.params.childId);
    res.status(204).send();
});
export default router;
