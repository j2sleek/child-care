import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Types } from 'mongoose';
const mockFindOne = vi.fn();
vi.mock('../modules/access/childAccess.model.ts', () => ({
    default: {
        findOne: (...args) => mockFindOne(...args),
    },
}));
import { getAccessFor, requirePermission } from "./permissions.js";
describe('permissions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    describe('getAccessFor', () => {
        it('should query ChildAccess by userId and childId', async () => {
            const userId = new Types.ObjectId().toString();
            const childId = new Types.ObjectId().toString();
            mockFindOne.mockReturnValue({ lean: () => Promise.resolve({ permissions: { canRead: true } }) });
            const result = await getAccessFor(userId, childId);
            expect(mockFindOne).toHaveBeenCalledWith({
                userId: expect.any(Types.ObjectId),
                childId: expect.any(Types.ObjectId),
            });
            expect(result).toEqual({ permissions: { canRead: true } });
        });
        it('should return null if no access record', async () => {
            const userId = new Types.ObjectId().toString();
            const childId = new Types.ObjectId().toString();
            mockFindOne.mockReturnValue({ lean: () => Promise.resolve(null) });
            const result = await getAccessFor(userId, childId);
            expect(result).toBeNull();
        });
    });
    describe('requirePermission', () => {
        it('should resolve silently if user has the required permission', async () => {
            const userId = new Types.ObjectId().toString();
            const childId = new Types.ObjectId().toString();
            mockFindOne.mockReturnValue({
                lean: () => Promise.resolve({ permissions: { canRead: true, canWrite: true, canInvite: false } }),
            });
            await expect(requirePermission(userId, childId, 'canRead')).resolves.toBeUndefined();
            await expect(requirePermission(userId, childId, 'canWrite')).resolves.toBeUndefined();
        });
        it('should throw FORBIDDEN if user lacks the permission', async () => {
            const userId = new Types.ObjectId().toString();
            const childId = new Types.ObjectId().toString();
            mockFindOne.mockReturnValue({
                lean: () => Promise.resolve({ permissions: { canRead: true, canWrite: false, canInvite: false } }),
            });
            await expect(requirePermission(userId, childId, 'canWrite')).rejects.toThrow('Forbidden');
            mockFindOne.mockReturnValue({
                lean: () => Promise.resolve({ permissions: { canRead: true, canWrite: false, canInvite: false } }),
            });
            try {
                await requirePermission(userId, childId, 'canWrite');
                expect.unreachable('should have thrown');
            }
            catch (e) {
                expect(e.statusCode).toBe(403);
                expect(e.code).toBe('FORBIDDEN');
            }
        });
        it('should throw FORBIDDEN if no access record exists', async () => {
            const userId = new Types.ObjectId().toString();
            const childId = new Types.ObjectId().toString();
            mockFindOne.mockReturnValue({ lean: () => Promise.resolve(null) });
            try {
                await requirePermission(userId, childId, 'canRead');
                expect.unreachable('should have thrown');
            }
            catch (e) {
                expect(e.statusCode).toBe(403);
                expect(e.code).toBe('FORBIDDEN');
            }
        });
    });
});
