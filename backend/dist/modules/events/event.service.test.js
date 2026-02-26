import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Types } from 'mongoose';
vi.mock('../../utils/permissions.ts', () => ({
    requirePermission: vi.fn(),
}));
const mockCareEventCreate = vi.fn();
const mockCareEventFind = vi.fn();
vi.mock('./careEvent.model.ts', () => ({
    default: {
        create: (...args) => mockCareEventCreate(...args),
        find: (...args) => mockCareEventFind(...args),
    },
}));
import { recordEvent, listTimeline } from "./event.service.js";
import { requirePermission } from "../../utils/permissions.js";
describe('event.service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(requirePermission).mockResolvedValue(undefined);
    });
    describe('recordEvent', () => {
        it('should check canWrite permission and create event', async () => {
            const userId = new Types.ObjectId().toString();
            const childId = new Types.ObjectId().toString();
            const fakeDoc = { _id: 'event1' };
            mockCareEventCreate.mockResolvedValue(fakeDoc);
            const result = await recordEvent({
                userId,
                childId,
                type: 'sleep',
                startTime: new Date(),
                durationMinutes: 30,
            });
            expect(requirePermission).toHaveBeenCalledWith(userId, childId, 'canWrite');
            expect(mockCareEventCreate).toHaveBeenCalledWith(expect.objectContaining({
                type: 'sleep',
                durationMinutes: 30,
            }));
            expect(result).toBe(fakeDoc);
        });
        it('should propagate permission errors', async () => {
            const err = new Error('Forbidden');
            err.statusCode = 403;
            vi.mocked(requirePermission).mockRejectedValue(err);
            await expect(recordEvent({
                userId: new Types.ObjectId().toString(),
                childId: new Types.ObjectId().toString(),
                type: 'feed',
                startTime: new Date(),
            })).rejects.toThrow('Forbidden');
        });
    });
    describe('listTimeline', () => {
        it('should check canRead permission and return events sorted desc', async () => {
            const userId = new Types.ObjectId().toString();
            const childId = new Types.ObjectId().toString();
            const fakeEvents = [{ _id: 'e1' }, { _id: 'e2' }];
            mockCareEventFind.mockReturnValue({
                sort: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                        lean: () => Promise.resolve(fakeEvents),
                    }),
                }),
            });
            const result = await listTimeline(userId, childId);
            expect(requirePermission).toHaveBeenCalledWith(userId, childId, 'canRead');
            expect(result).toEqual(fakeEvents);
        });
    });
});
